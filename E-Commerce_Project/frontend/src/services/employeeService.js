import api from "./axiosInstance";

const getAdminHeaders = () => {
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  return auth?.user?.id ? { "User-Id": auth.user.id } : {};
};

export const getAllEmployees = async () => {
  const { data } = await api.get("/admin/auth/employees/all");
  return data;
};

export const getEmployee = async (id) => {
  const { data } = await api.get(`/admin/auth/employees/${id}`);
  return data;
};

export const addEmployee = async (employeeData) => {
  const { data } = await api.post("/admin/auth/employees/add", employeeData, {
    headers: getAdminHeaders(),
  });
  return data;
};

export const updateEmployeePermissions = async (id, permissions) => {
  await api.put(`/admin/auth/employees/${id}/permissions`, permissions, {
    headers: getAdminHeaders(),
  });
};

export const deleteEmployee = async (id) => {
  await api.delete(`/admin/auth/employees/${id}`, {
    headers: getAdminHeaders(),
  });
};

export const getAllPermissions = async () => {
  const { data } = await api.get("/admin/auth/permissions");
  return data;
};
