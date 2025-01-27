import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true, 
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim: true,
    },
    password : {
        type : String,
        required : true,
        trim: true,
    },
    profile_photo: {
        type: String,
    },
    cover_photo: {
        type: String,
    },
    refresh_token: {
        type: String,
    },
    posts : [
        {
            type : Schema.Types.ObjectId,
            ref : "Post"
        }
    ]
},{timestamps : true})

userSchema.pre('save', async function(next) {

    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

userSchema.methods.isPasswordMatch = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
    jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        process.env.ACCESSTOKEN_SECRET_KEY,
        {
            expiresIn: ACCESSTOKEN_EXP_TIME,
        }
    );
};
  
userSchema.methods.generateRefreshToken = async function () {
    jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET_KEY,
        {
            expiresIn: REFRESH_TOKEN_EXP_TIME,
        }
    );
};


export const User = mongoose.model("User", userSchema); 
