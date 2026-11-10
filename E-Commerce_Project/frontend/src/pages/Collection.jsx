import React, { useContext, useEffect, useState, useMemo } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import SearchBar from "../components/SearchBar";
import { categoryApi } from "../services/productService";

function Collection() {
  const { products, search, showSearch } = useContext(ShopContext);
  // eslint-disable-next-line no-unused-vars
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("relevance");
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => {
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list)) setDbCategories(list);
      })
      .catch(() => {});
  }, []);

  const mainCategories = useMemo(
    () => dbCategories.filter((c) => !c.parentId),
    [dbCategories]
  );

  const subCategories = useMemo(() => {
    const subs = dbCategories.filter((c) => c.parentId);
    const seen = new Set();
    return subs.filter((c) => {
      const key = c.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [dbCategories]);

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory((prev) => prev.filter((item) => item !== e.target.value));
    } else {
      setCategory((prev) => [...prev, e.target.value]);
    }
  };
  const toggleSubCategory = (e) => {
    if (subCategory.includes(e.target.value)) {
      setSubCategory((prev) => prev.filter((item) => item !== e.target.value));
    } else {
      setSubCategory((prev) => [...prev, e.target.value]);
    }
  };
  const applyFilter = () => {
    let productsCopy = products.slice();
    if (showSearch && search) {
      productsCopy = productsCopy.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (category.length > 0) {
      // categoryParent is the top-level category (e.g. Men / Women / Kids)
      productsCopy = productsCopy.filter((item) => {
        const parent = item.categoryParent || item.category;
        return category.some((c) => (parent || "").toLowerCase() === c.toLowerCase());
      });
    }
    if (subCategory.length > 0) {
      // category (on the DTO) is the sub-category name
      productsCopy = productsCopy.filter((item) => {
        const sub = item.category;
        return subCategory.some((s) => (sub || "").toLowerCase() === s.toLowerCase());
      });
    }
    setFilterProducts(productsCopy);
  };
  const sortProducts = () => {
    let sortCopy = filterProducts.slice();
    switch (sortType) {
      case "low-to-high":
        setFilterProducts(sortCopy.sort((a, b) => Number(a.price) - Number(b.price)));
        break;
      case "high-to-low":
        setFilterProducts(sortCopy.sort((a, b) => Number(b.price) - Number(a.price)));
        break;
      default:
        applyFilter();
        break;
    }
  };

  useEffect(
    function () {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      applyFilter();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, subCategory, search, showSearch, products],
  );
  useEffect(
    function () {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      sortProducts();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortType],
  );

  return (
    <div>
      <Navbar />
      <SearchBar />
      <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
        {/* Filter Options */}
        <div className="min-w-60">
          <p className="my-2 text-xl flex items-center cursor-pointer gap-2">
            FILTERS
            <img
              className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`}
              src={assets.dropdown_icon}
              alt="icon"
            />
          </p>
          {/* Category filter */}
          <div
            className={`border border-gray-300 pl-5 py-3 mt-6 ${showFilter ? "" : "hidden"} sm:block`}
          >
            <p className="mb-3 text-sm font-medium">CATEGORIES</p>
            <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
              {mainCategories.length === 0 ? (
                <p className="text-xs text-gray-400">No categories</p>
              ) : (
                mainCategories.map((c) => (
                  <label key={c.id} className="flex gap-2 items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-3"
                      value={c.name}
                      checked={category.includes(c.name)}
                      onChange={toggleCategory}
                    />
                    {c.name}
                  </label>
                ))
              )}
            </div>
          </div>
          {/* SubCategory filter */}
          <div
            className={`border border-gray-300 pl-5 py-3 my-5 ${showFilter ? "" : "hidden"} sm:block`}
          >
            <p className="mb-3 text-sm font-medium">TYPE</p>
            <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
              {subCategories.length === 0 ? (
                <p className="text-xs text-gray-400">No subcategories</p>
              ) : (
                subCategories.map((c) => (
                  <label key={c.id} className="flex gap-2 items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-3"
                      value={c.name}
                      checked={subCategory.includes(c.name)}
                      onChange={toggleSubCategory}
                    />
                    {c.name}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        {/* Right Side */}
        <div className="flex-1">
          <div className="flex justify-between text-base sm:text-2xl mb-4">
            <Title text1={"ALL"} text2={"COLLECTIONS"} />
            {/* product sort */}
            <select
              className="border-2 border-gray-300 px-2 text-sm"
              onChange={(e) => setSortType(e.target.value)}
            >
              <option value="relevance">Sort by: Relevent</option>
              <option value="low-to-high">Sort by: Low to High</option>
              <option value="high-to-low">Sort by: High to Low</option>
            </select>
          </div>
          {/* map product */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
            {filterProducts.map((item, index) => (
              <ProductItem
                key={index}
                name={item.name}
                id={item.id}
                price={item.price}
                image={item.images}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Collection;
