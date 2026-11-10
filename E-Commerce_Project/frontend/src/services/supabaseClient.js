import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

const defaultBucket = import.meta.env.VITE_SUPABASE_BUCKET || "jeans for jeans";

export const BUCKETS = {
  PRODUCTS: import.meta.env.VITE_SUPABASE_BUCKET_PRODUCTS || defaultBucket,
  PROFILES: import.meta.env.VITE_SUPABASE_BUCKET_PROFILES || defaultBucket,
};

export const FOLDERS = {
  PRODUCTS: import.meta.env.VITE_SUPABASE_FOLDER_PRODUCTS || "products",
  PROFILES: import.meta.env.VITE_SUPABASE_FOLDER_PROFILES || "profiles",
};

/**
 * Uploads a file to a specific Supabase storage bucket and returns its public URL.
 *
 * @param {File} file - The file to upload.
 * @param {string} bucket - The Supabase storage bucket name.
 * @param {string} [prefix=""] - Optional folder path prefix (e.g. userId or subfolder).
 * @returns {Promise<string>} The public URL of the uploaded image.
 */
export async function uploadImageToSupabase(file, bucket, prefix = "") {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured! Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env"
    );
  }

  if (!file) {
    throw new Error("No file provided for upload.");
  }

  // Validate that it's an image
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  // Generate a clean unique file name
  const extension = file.name?.split(".").pop() || "jpg";
  const cleanExt = extension.replace(/[^a-zA-Z0-9]/g, "");
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const timeStamp = Date.now();
  const fileName = prefix
    ? `${prefix}/${timeStamp}_${randomSuffix}.${cleanExt}`
    : `${timeStamp}_${randomSuffix}.${cleanExt}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Supabase storage upload error:", error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
}

/**
 * Uploads a profile picture to the profiles folder in Supabase storage using the user's email.
 * @param {File} file
 * @param {string} [userIdentifier="user"] - User email or identifier
 * @returns {Promise<string>} Public URL
 */
export async function uploadProfileImage(file, userIdentifier = "user") {
  const bucket = BUCKETS.PROFILES;
  const cleanIdentifier = String(userIdentifier).trim().replace(/[^a-zA-Z0-9@._-]/g, "_");
  const prefix = bucket === FOLDERS.PROFILES ? cleanIdentifier : `${FOLDERS.PROFILES}/${cleanIdentifier}`;
  return uploadImageToSupabase(file, bucket, prefix);
}

/**
 * Uploads a product image to the products folder in Supabase storage.
 * @param {File} file
 * @returns {Promise<string>} Public URL
 */
export async function uploadProductImage(file) {
  const bucket = BUCKETS.PRODUCTS;
  const prefix = bucket === FOLDERS.PRODUCTS ? "" : FOLDERS.PRODUCTS;
  return uploadImageToSupabase(file, bucket, prefix);
}
