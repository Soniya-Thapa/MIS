import express from "express"
const router = express.Router()

import upload from "../middleware/multer.middleware.js"
import { createSubject, updateSubject, deleteSubject, getSubjectsBySemester, getSubjectById, getAllSubjects, getSubjectTitles } from "../controller/subject.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
import { isSuperAdminOrAdminOrCoordinator } from "../middleware/role.middleware.js"

router.route("/semester/:semesterId")
  .post(verifyToken, isSuperAdminOrAdminOrCoordinator, upload.single("image"), createSubject)
  .get(getSubjectsBySemester)

router.route("/:subjectId")
  .delete(verifyToken, isSuperAdminOrAdminOrCoordinator, deleteSubject)
  .get(getSubjectById)
  .patch(verifyToken, isSuperAdminOrAdminOrCoordinator, upload.single("image"), updateSubject)

router.route("/").get(getAllSubjects)
router.route("/titles").post(getSubjectTitles)

export default router