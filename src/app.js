import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user.js";
import authRouter from "./routes/auth.js";

const app = express();

app.use(
    cors({
      origin: process.env.ORIGIN,
      credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/users",userRouter);
app.use("/api/v1",authRouter);
  

export {app};