import express from "express"
const router = express.Router()

import upload from "../middleware/multer.middleware.js"
import { uploadStudyMaterial, getAllStudyMaterials, getStudyMaterialsBySubject, getStudyMaterialsByChapter, getStudyMaterialsByTopic, deleteStudyMaterial, updateStudyMaterial, getChapterOnlyMaterials, getSubjectOnlyMaterials } from "../controller/studyMaterial.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
import { isSuperAdminOrAdminOrTeacher, isSuperAdminOrAdminOrCoordinator, isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent } from "../middleware/role.middleware.js"

router.route("/upload").post(verifyToken, isSuperAdminOrAdminOrTeacher, upload.single("document"), uploadStudyMaterial)
router.route("/").get(verifyToken, isSuperAdminOrAdminOrCoordinator, getAllStudyMaterials)

router.route("/:materialId")
  .delete(verifyToken, isSuperAdminOrAdminOrTeacher, deleteStudyMaterial)
  .patch(verifyToken, isSuperAdminOrAdminOrTeacher, upload.single("document"), updateStudyMaterial)

router.route("/subject/:subjectId").get(verifyToken,isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent,getStudyMaterialsBySubject)
router.route("/chapter/:chapterId").get(verifyToken,isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent,getStudyMaterialsByChapter)
router.route("/topic/:topicId").get(verifyToken,isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent,getStudyMaterialsByTopic)

router.route("/chapter-only/:chapterId").get(verifyToken,isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent,getChapterOnlyMaterials)
router.route("/subject-only/:subjectId").get(verifyToken,isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent,getSubjectOnlyMaterials)

export default router