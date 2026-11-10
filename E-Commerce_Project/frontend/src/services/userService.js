import api from "./axiosInstance";

const getAuth = () =>
    JSON.parse(localStorage.getItem("auth") || "null");

const getUserId = () => getAuth()?.user?.id ?? "";
const getUserEmail = () => getAuth()?.user?.email ?? "";

export const getProfile = async () => {
    const { data } = await api.get("/users/me", {
        headers: {
            "User-Id": getUserId(),
            "User-Email": getUserEmail(),
        },
    });
    return data.data;
};

export const updateProfile = async (payload) => {
    const { data } = await api.put("/users/me", payload, {
        headers: {
            "User-Id": getUserId(),
            "User-Email": getUserEmail(),
        },
    });
    return data.data;
};

export const uploadPhoto = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/users/me/photo", formData, {
        headers: {
            "User-Id": getUserId(),
            "Content-Type": "multipart/form-data",
        },
    });
    return data.data;
}