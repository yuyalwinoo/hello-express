import fs from "fs";

import {uploadFileToCloudinary} from '../utils/cloudinary.js';
import { User } from "../models/user.js";

export const registerController = async(req,res)=>{

    const {username, email, password} = req.body;
    let profile_photo = "";
    let cover_photo = "";
    const profile_photo_path = req.files.profile_photo[0].path;
    const cover_photo_path = req.files.cover_photo[0].path;
    

    try {
        if([username,email,password].some( item=>item?.trim === "")){
            res.status(400).json({
                message : "All fields are required."
            })
            throw new Error("All fields are required");
            
        }

        const existingUser = await User.findOne({
            $or : [{username},{email}]
        })
        
    console.log("existingUser",existingUser)
        if(existingUser)
        {
            res.status(409).json({
                message : "username or email already exists."
            })
            throw new Error("username or email already exists.")
        }
    
        if(profile_photo_path && cover_photo_path)
        {
            profile_photo = await uploadFileToCloudinary(profile_photo_path);
            cover_photo = await uploadFileToCloudinary(cover_photo_path);
        }

        const user = await User.create({
            username : username.toLowerCase(),
            email,
            password,
            profile_photo,
            cover_photo
        })

        const createdUser = await User.findById(user._id).select("-password -refresh_token");

        if(!createdUser){
            return res.status(500).json({
                message : "Something went wrong in user registration"
            })
        }

        return res.status(201).json(
           {
            userInfo : createdUser,
            message : "User registration is success."
           }
        )
    } catch (error) {
        console.log(error);
        fs.unlinkSync(profile_photo_path);
        fs.unlinkSync(cover_photo_path);
    }

}