import express from "express";
const router = express.Router();

import { createUniversity, updateUniversity, getAllUniversities, getUniversityById, getUniversitiesByType, deleteUniversity, } from "../controller/university.controller.js";

import { verifyToken } from "../middleware/auth.middleware.js";
import { isSuperAdminOrAdmin, } from "../middleware/role.middleware.js";

// ✅ Create University (SuperAdmin or Admin only)
router.route("/")
  .post(verifyToken, isSuperAdminOrAdmin, createUniversity)
  .get(verifyToken, getAllUniversities); //dropdown

router.route("/:universityId")
  .patch(verifyToken, isSuperAdminOrAdmin, updateUniversity)
  .delete( verifyToken, isSuperAdminOrAdmin, deleteUniversity)
  .get( verifyToken, getUniversityById);

router.route("/type/:type").get(verifyToken, getUniversitiesByType);

export default router;
