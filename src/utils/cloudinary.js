import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
    secure: true,
    cloud_name : process.env.CLODINARY_CLOUD_NAME,
    api_key : process.env.CLODINARY_API_KEY,
    api_secret : process.env.CLODINARY_API_SECRET_KEY
});

export const uploadFileToCloudinary = async(filePath)=>{
    try {
        if(!filePath) return null;
        const response = await cloudinary.uploader.upload(
            filePath,{
                resource_type : "auto"
            }
        )
        console.log("File upload complete", response.url)
        return response.url;
    } catch (error) {
        console.log(error);
        return null;
    } finally {
        fs.unlinkSync(filePath);
    }
}
