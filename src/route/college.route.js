import express from "express";
const router = express.Router();

import { createCollege } from "../controller/college.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { isSuperAdminOrAdmin } from "../middleware/role.middleware.js";

router.route("/")
  .post(verifyToken, isSuperAdminOrAdmin,createCollege)

export default router;
