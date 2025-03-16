import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteImageOnCloudinary = async (cloudinaryUrl) => {
  try {
    console.log(cloudinaryUrl);

    if (!cloudinaryUrl) return null;
    const assest_id = cloudinaryUrl.split("/").pop().split(".")[0];
    const response = await cloudinary.uploader.destroy(assest_id, {
      invalidate: true,
      resource_type: "image",
    });
    return response;
  } catch (error) {
    return null;
  }
};

export { uploadOnCloudinary, deleteImageOnCloudinary };
