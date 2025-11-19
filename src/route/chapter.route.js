import express from "express"
const router = express.Router()

import { createChapter, updateChapter, deleteChapter, getChaptersBySubject, getChapterById, getAllChapters, getChapterTitles } from "../controller/chapter.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
import { isSuperAdminOrAdminOrTeacher } from "../middleware/role.middleware.js"

router.route("/subject/:subjectId")
  .post(verifyToken, isSuperAdminOrAdminOrTeacher, createChapter)
  .get(getChaptersBySubject)

router.route("/:chapterId")
  .delete(verifyToken, isSuperAdminOrAdminOrTeacher, deleteChapter)
  .get(getChapterById)
  .patch(verifyToken, isSuperAdminOrAdminOrTeacher, updateChapter)

router.route("/").get(getAllChapters)
router.route("/titles").post(getChapterTitles)

export default router