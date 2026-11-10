import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getProfile, updateProfile } from "../services/userService";
import { uploadProfileImage } from "../services/supabaseClient";
import { toast } from "react-toastify";

function ProfilePage() {
    const navigate = useNavigate();
    const { auth } = useAuth();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        street: "",
        city: "",
        country: "",
        zipCode: "",
    });

    useEffect(() => {
        let isMounted = true;
        const loadUserProfile = async () => {
            try {
                setLoading(true);
                const data = await getProfile();
                if (isMounted && data) {
                    setForm({
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        phoneNumber: data.phoneNumber || "",
                        street: data.street || "",
                        city: data.city || "",
                        country: data.country || "",
                        zipCode: data.zipCode || "",
                    });
                    if (data.photoUrl) {
                        setPhotoPreview(data.photoUrl);
                    }
                    localStorage.setItem("user_profile", JSON.stringify(data));
                    window.dispatchEvent(new CustomEvent("profile:updated", { detail: data }));
                }
            } catch (err) {
                console.error("Could not load user profile:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadUserProfile();
        return () => { isMounted = false; };
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image must be under 5 MB.");
            return;
        }

        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.firstName.trim()) {
            toast.error("First name is required.");
            return;
        }
        if (!form.lastName.trim()) {
            toast.error("Last name is required.");
            return;
        }
        if (form.phoneNumber && !/^\+?[0-9]{7,15}$/.test(form.phoneNumber)) {
            toast.error("Invalid phone number format.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phoneNumber: form.phoneNumber.trim(),
                street: form.street.trim(),
                city: form.city.trim(),
                country: form.country.trim(),
                zipCode: form.zipCode.trim(),
            };

            // If a new photo file was picked from device, upload it to Supabase Storage first
            if (photoFile) {
                try {
                    const userIdentifier = auth?.user?.email || "profile";
                    const publicUrl = await uploadProfileImage(photoFile, userIdentifier);
                    payload.photoUrl = publicUrl;
                } catch (uploadErr) {
                    console.error("Failed to upload photo to Supabase:", uploadErr);
                    toast.error(
                        uploadErr?.message || "Failed to upload photo to Supabase Storage. Check frontend/.env settings."
                    );
                    setSaving(false);
                    return;
                }
            } else if (photoPreview) {
                payload.photoUrl = photoPreview;
            }

            const updated = await updateProfile(payload);

            if (updated) {
                setForm({
                    firstName: updated.firstName || form.firstName,
                    lastName: updated.lastName || form.lastName,
                    phoneNumber: updated.phoneNumber || form.phoneNumber,
                    street: updated.street || form.street,
                    city: updated.city || form.city,
                    country: updated.country || form.country,
                    zipCode: updated.zipCode || form.zipCode,
                });
                if (updated.photoUrl) {
                    setPhotoPreview(updated.photoUrl);
                }
                setPhotoFile(null);
                localStorage.setItem("user_profile", JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent("profile:updated", { detail: updated }));
            }

            toast.success("Profile saved successfully!");
        } catch (err) {
            toast.error(err?.response?.data?.message ?? "Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    const initials = [form.firstName?.[0], form.lastName?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase();

    const inputBase =
        "w-full py-3 bg-transparent border-b text-sm text-stone-900 outline-none transition-colors duration-200 placeholder:text-gray-300";

    return (
        <div>
            <Navbar />
            <div className="border-t pt-8 pb-16 max-w-xl mx-auto px-4">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6 transition-colors group cursor-pointer"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                </button>

                <div className="mb-10">
                <h1 className="text-3xl font-semibold text-stone-900">My Profile</h1>
                <p className="text-sm text-gray-400 mt-1">
                    Update your personal details below.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">

                {/* ── Photo avatar ─────────────────────────────────── */}
                <div className="flex flex-col items-center gap-3">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative w-24 h-24 rounded-full cursor-pointer group"
                    >
                        {/* Photo or initials */}
                        {photoPreview ? (
                            <img
                                src={photoPreview}
                                alt="Profile"
                                className="w-24 h-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-black text-white flex items-center justify-center text-2xl font-semibold select-none">
                                {initials || "?"}
                            </div>
                        )}

                        {/* Camera overlay on hover */}
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-7 h-7 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
                                />
                            </svg>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400">
                        Click photo to change &nbsp;·&nbsp; JPG, PNG, WEBP · max 5 MB
                    </p>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                    />
                </div>

                {/* ── Email — locked ─────────────────────────────────── */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={auth?.user?.email ?? ""}
                        disabled
                        className={`${inputBase} border-gray-200 text-gray-400 cursor-not-allowed`}
                    />
                </div>

                {/* ── First Name ─────────────────────────────────────── */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                        First Name
                    </label>
                    <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        placeholder="Enter your first name"
                        maxLength={50}
                        className={`${inputBase} border-gray-300 focus:border-black`}
                    />
                </div>

                {/* ── Last Name ──────────────────────────────────────── */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                        Last Name
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        placeholder="Enter your last name"
                        maxLength={50}
                        className={`${inputBase} border-gray-300 focus:border-black`}
                    />
                </div>

                {/* ── Phone ──────────────────────────────────────────── */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        name="phoneNumber"
                        value={form.phoneNumber}
                        onChange={handleChange}
                        placeholder="+20 10x xxxx xxxx"
                        maxLength={16}
                        className={`${inputBase} border-gray-300 focus:border-black`}
                    />
                </div>

                <hr className="border-gray-100" />

                {/* ── Street ─────────────────────────────────────────── */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                        Street Address
                    </label>
                    <input
                        type="text"
                        name="street"
                        value={form.street}
                        onChange={handleChange}
                        placeholder="123 Nile Corniche St."
                        maxLength={200}
                        className={`${inputBase} border-gray-300 focus:border-black`}
                    />
                </div>

                {/* ── City + Country ─────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                            City
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            placeholder="Cairo"
                            maxLength={100}
                            className={`${inputBase} border-gray-300 focus:border-black`}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                            Country
                        </label>
                        <input
                            type="text"
                            name="country"
                            value={form.country}
                            onChange={handleChange}
                            placeholder="Egypt"
                            maxLength={100}
                            className={`${inputBase} border-gray-300 focus:border-black`}
                        />
                    </div>
                </div>

                {/* ── Zip ────────────────────────────────────────────── */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                        Zip / Postal Code
                    </label>
                    <input
                        type="text"
                        name="zipCode"
                        value={form.zipCode}
                        onChange={handleChange}
                        placeholder="11511"
                        maxLength={10}
                        className={`${inputBase} border-gray-300 focus:border-black`}
                    />
                </div>

                {/* ── Save ───────────────────────────────────────────── */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-black text-white text-sm tracking-widest uppercase px-10 py-3 rounded-full
                       hover:bg-stone-800 active:scale-95 transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving && (
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {saving ? "Saving…" : "Save Profile"}
                    </button>
                </div>

            </form>
            </div>
        </div>
    );
}

export default ProfilePage;