import fs from "fs";
import jwt from "jsonwebtoken";

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
        
    //console.log("existingUser",existingUser)
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

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
        const existingUser = await User.findById(userId);
        
        if(!existingUser)
        {
            res.status(404).json({
                message : "User not found!"
            })
        }

        const accessToken = await existingUser.generateRefreshToken();
        const refreshToken = await existingUser.generateRefreshToken();
        // console.log("accessToken",accessToken)
        // console.log("refreshToken",refreshToken)
        existingUser.refresh_token = refreshToken;
        await existingUser.save({validateBeforeSave : false}); // validateBeforeSave : false allow missing other data like email, password ... 

        return {accessToken, refreshToken};
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message : "Something went wrong with token"
        })
    }
}

export const loginController = async(req,res)=>{
    const {username, email, password} = req.body;

    if(username === "" || email === "" || password === ""){
        res.status(400).json({
            message : "All fields are required."
        })
    }

    const existingUser = await User.findOne({
        $or : [{username},{email}]
    })
    
    if(!existingUser)
    {
        res.status(404).json({
            message : "User not found!"
        })
    }

    const isPassMatch = await existingUser.isPasswordMatch(password);

    if(!isPassMatch)
    {
        return res.status(401).json({ message: "Invaild Credentials." });
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(existingUser._id);

    const user = await User.findById(existingUser._id).select("-password -refresh_token");

    const option = {
        httpOnly : true,
        secure : process.env.NODE_ENV === "production",
    }
    return res.status(200).cookie("accessToken",accessToken, option)
                            .cookie("refreshToken",refreshToken, option)
                            .json({
                                user,
                                message: "Login success."
                            })
}

export const generateNewRefreshToken = async(req,res)=>{
    const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!oldRefreshToken)
    {
        return res.status(401).json({message : "Unauthorized."})
    }

    try {
        const verifiedToken = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET_KEY);

        const existingUser = await User.findById(verifiedToken?._id);
        if(!existingUser)
        {
            return res.status(404).json({message : "No user found."})
        }

        if(oldRefreshToken !== existingUser.refresh_token)
        {
            return res.status(401).json({message : "Invalid refresh token."})
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(existingUser?._id);

        const option = {
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
        }
        return res.status(200).cookie("accessToken",accessToken, option)
                                .cookie("refreshToken",refreshToken, option)
                                .json({
                                    message: "Token updated."
                                })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong." });
    }
}

export const logoutController = async(req,res)=>{
    // console.log(req.user)
    if(!req.user || !req.user._id)
    {
        return res.status(400).json({message : "logout unauthorized"})
    }

    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
              $unset: {
                refresh_token: 1,
              },
            },
            { new: true }
        );

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        };
    
        return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json({ message: `${req.user.username} logout successfully.` });
    } catch (error) {
        console.log(error)
    }
}