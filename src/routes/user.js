import { Router } from "express";
import { getAllUsers } from "../controllers/user.js";

const router = Router();

router.get("/", getAllUsers);

export default router;
