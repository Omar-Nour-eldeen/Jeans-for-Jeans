
import api from "./axiosInstance";


export const productApi = {

  getAll: async () =>
    api
      .get("/products")
      .then((res) => res.data)
      .then((body) => body.data),


  getById: async (productId) =>
    api.get(`/products/${productId}`).then((res) => res.data),
};
export const categoryApi = {
  getAll: () => api.get("/categories"),
  getById: (id) => api.get(`/categories/${id}`),
  getSubcategories: (id) => api.get(`/categories/${id}/subcategories`),
  getProducts: (id) => api.get(`/categories/${id}/products`),
};

export const variantApi = {
  getAll: (productId) => api.get(`/products/${productId}/variants`),
  getById: (productId, variantId) =>
    api.get(`/products/${productId}/variants/${variantId}`),
};

export const imageApi = {
  getAll: (productId) => api.get(`/products/${productId}/images`),
  getById: (productId, imageId) =>
    api.get(`/products/${productId}/images/${imageId}`),
};




export const adminProductApi = {

  create: (data) => api.post("/admin/products", data),


  update: (productId, data) => api.put(`/admin/products/${productId}`, data),


  delete: (productId) => api.delete(`/admin/products/${productId}`),
};

export const adminCategoryApi = {
  create: (data) => api.post("/admin/categories", data),


  update: (categoryId, data) =>
    api.put(`/admin/categories/${categoryId}`, data),

  delete: (categoryId) => api.delete(`/admin/categories/${categoryId}`),
};

export const adminVariantApi = {

  create: (productId, data) =>
    api.post(`/admin/products/${productId}/variants`, data),

  update: (productId, variantId, data) =>
    api.put(`/admin/products/${productId}/variants/${variantId}`, data),


  delete: (productId, variantId) =>
    api.delete(`/admin/products/${productId}/variants/${variantId}`),
};

export const adminImageApi = {

  create: (productId, data) =>
    api.post(`/admin/products/${productId}/images`, data),


  delete: (productId, imageId) =>
    api.delete(`/admin/products/${productId}/images/${imageId}`),
};




export async function createProductFull(form) {
  let categoryId = form.categoryId;

  if (!categoryId) {
    const categoriesRes = await categoryApi.getAll();
    const allCategories = categoriesRes?.data?.data || categoriesRes?.data || [];

    if (form.subCategory) {
      const parentCat = allCategories.find(
        (c) => !c.parentId && c.name.toLowerCase() === (form.category || "").toLowerCase()
      );
      const subCat = allCategories.find(
        (c) =>
          c.name.toLowerCase() === form.subCategory.toLowerCase() &&
          (!parentCat || c.parentId === parentCat.id)
      );
      if (subCat) categoryId = subCat.id;
      else if (parentCat) categoryId = parentCat.id;
    } else if (form.category) {
      const cat = allCategories.find(
        (c) => c.name.toLowerCase() === form.category.toLowerCase()
      );
      if (cat) categoryId = cat.id;
    }
  }

  if (!categoryId) {
    throw new Error("Please select a valid category from the database.");
  }

  const productRes = await adminProductApi.create({
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    status: "ACTIVE",
    categoryId: Number(categoryId),
  });
  const product = productRes.data.data;

  const images = Array.isArray(form.imageUrls) && form.imageUrls.length > 0
    ? form.imageUrls.filter(Boolean)
    : form.imageUrl?.trim()
    ? [form.imageUrl.trim()]
    : [];

  for (const s3Url of images) {
    await adminImageApi.create(product.id, { s3Url: s3Url.trim() });
  }

  await Promise.all(
    Object.entries(form.sizeQuantities).map(([size, stockQuantity]) =>
      adminVariantApi.create(product.id, { size, stockQuantity }),
    ),
  );

  return product;
}

export async function updateProductFull(productId, form, initial) {
  let categoryId = form.categoryId;

  if (!categoryId) {
    const categoriesRes = await categoryApi.getAll();
    const allCategories = categoriesRes?.data?.data || categoriesRes?.data || [];

    if (form.subCategory) {
      const parentCat = allCategories.find(
        (c) => !c.parentId && c.name.toLowerCase() === (form.category || "").toLowerCase()
      );
      const subCat = allCategories.find(
        (c) =>
          c.name.toLowerCase() === form.subCategory.toLowerCase() &&
          (!parentCat || c.parentId === parentCat.id)
      );
      if (subCat) categoryId = subCat.id;
      else if (parentCat) categoryId = parentCat.id;
    } else if (form.category) {
      const cat = allCategories.find(
        (c) => c.name.toLowerCase() === form.category.toLowerCase()
      );
      if (cat) categoryId = cat.id;
    }
  }

  const updatePayload = {
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price),
  };
  if (categoryId) {
    updatePayload.categoryId = Number(categoryId);
  }

  const productRes = await adminProductApi.update(productId, updatePayload);
  const product = productRes.data.data;

  const originalImages = Array.isArray(initial?.images)
    ? initial.images
    : initial?.images ? [initial.images] : [];

  const currentImages = Array.isArray(form.imageUrls) && form.imageUrls.length > 0
    ? form.imageUrls.filter(Boolean)
    : form.imageUrl?.trim()
    ? [form.imageUrl.trim()]
    : [];

  const toAdd = currentImages.filter((img) => !originalImages.includes(img));
  for (const s3Url of toAdd) {
    await adminImageApi.create(product.id, { s3Url: s3Url.trim() });
  }


  const variantsRes = await variantApi.getAll(productId);
  const existingVariants = variantsRes.data.data;
  const existingBySize = Object.fromEntries(
    existingVariants.map((v) => [v.size, v]),
  );

  await Promise.all(
    Object.entries(form.sizeQuantities).map(([size, stockQuantity]) => {
      const ex = existingBySize[size];
      if (ex) {
        return ex.stockQuantity !== stockQuantity
          ? adminVariantApi.update(productId, ex.id, { stockQuantity })
          : Promise.resolve();
      }
      return adminVariantApi.create(productId, { size, stockQuantity });
    }),
  );

  await Promise.all(
    existingVariants
      .filter((v) => form.sizeQuantities[v.size] === undefined)
      .map((v) => adminVariantApi.delete(productId, v.id)),
  );

  return product;
}

export default api;
