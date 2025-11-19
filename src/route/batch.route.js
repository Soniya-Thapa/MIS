import express from "express";
const router = express.Router();

import { createBatch, updateBatch, deleteBatch, getBatchById, getAllBatches, getBatchesByCourse, getActiveBatches } from "../controller/ batch.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";
import { isSuperAdminOrAdmin, isSuperAdminOrAdminOrCoordinator, isSuperAdminOrAdminOrCoordinatorOrTeacher, isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent } from "../middleware/role.middleware.js";

router
  .route("/")
  .post(verifyToken, isSuperAdminOrAdminOrCoordinator, createBatch)
  .get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrTeacher, getAllBatches);

router.route("/active").get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent, getActiveBatches);
router.route("/course/:courseId").get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrTeacher, getBatchesByCourse);

router
  .route("/:batchId")
  .get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrTeacher, getBatchById)
  .patch(verifyToken, isSuperAdminOrAdminOrCoordinator, updateBatch)
  .delete(verifyToken, isSuperAdminOrAdmin, deleteBatch);

export default router;
