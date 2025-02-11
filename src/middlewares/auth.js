import jwt from 'jsonwebtoken';

import {User} from "../models/user.js"

export const verifyJWT = async(req,res,next)=>{
    const token = req.cookies.accessToken || req.header("Authorization");
    // console.log("token",token)
    if(!token)
    {
        return res.status(401).json({
            message : "unauthorized token"
        })
    }
    try {
        const decodedToken = jwt.decode(token);
        // console.log(decodedToken)
        if(!decodedToken._id)
        {
            return res.status(401).json({
                message : "unauthorized token"
            })
        }

        const existingUser = await User.findById(decodedToken._id).select("-password -refresh_token");
        if(!existingUser)
        {
            return res.status(401).json({
                message : "unauthorized"
            })
        }
        req.user = existingUser;
        next();
    } catch (error) {
        console.log(error)
    }
    
}