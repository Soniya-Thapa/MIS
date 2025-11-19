import express from "express";
const router = express.Router();

import { createFeeCategory, updateFeeCategory, deleteFeeCategory, getAllFeeCategories } from "../../controller/feeManagement/feeCategory.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";
import {isSuperAdminOrAdmin,isSuperAdminOrAdminOrCoordinatorOrAccountantOrTeacher} from "../../middleware/role.middleware.js";

router
  .route("/")
  .post(verifyToken, isSuperAdminOrAdmin, createFeeCategory)
  .get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrAccountantOrTeacher, getAllFeeCategories);

router
  .route("/:id")
  .patch(verifyToken, isSuperAdminOrAdmin, updateFeeCategory)
  .delete(verifyToken, isSuperAdminOrAdmin, deleteFeeCategory);

export default router;
