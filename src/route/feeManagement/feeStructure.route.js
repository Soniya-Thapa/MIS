import express from "express";
const router = express.Router();

import {  createFeeStructure,  updateFeeStructure,  deleteFeeStructure,  getFeeStructureById,  getAllFeeStructures,  getFeeStructuresByCourse,  getActiveFeeStructures} from "../../controller/feeManagement/feeStructure.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";
import {isSuperAdminOrAdmin,isSuperAdminOrAdminOrCoordinatorOrAccountant} from "../../middleware/role.middleware.js";

router
  .route("/")
  .post(verifyToken, isSuperAdminOrAdmin, createFeeStructure)
  .get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrAccountant, getAllFeeStructures);

router.route("/active").get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrAccountant, getActiveFeeStructures);
router.route("/course/:courseId").get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrAccountant, getFeeStructuresByCourse);

router
  .route("/:feeStructureId")
  .patch(verifyToken, isSuperAdminOrAdmin, updateFeeStructure)
  .get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrAccountant, getFeeStructureById)
  .delete(verifyToken, isSuperAdminOrAdmin, deleteFeeStructure);

export default router;
