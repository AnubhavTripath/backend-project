import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
         if(!localFilePath) return null;

         //upload the file on cloudinary
         const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "auto"
         })
        
         // Delete temp file after successful upload
        fs.unlinkSync(localFilePath);

         //file has been uploaded successfully
         console.log("file uploaded successfully" , response)
         return response
    } catch (error) {
        fs.unlinkSync(localFilePath) //unlink sync basically firstly unlink the locally saved temporary file as the upload operation got failed
        return null
    }
}


export {uploadOnCloudinary}