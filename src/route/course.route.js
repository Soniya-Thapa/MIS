import express from "express"
const router = express.Router()

import upload from "../middleware/multer.middleware.js"
import { createCourse, deleteCourse, getAllCourses, getCourseById, getCourseTitles, updateCourse } from "../controller/course.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
import { isSuperAdminOrAdmin } from "../middleware/role.middleware.js"

router.route("/")
  .post(verifyToken, isSuperAdminOrAdmin, upload.single("image"), createCourse)
  .get(getAllCourses)

router.route("/:courseId")
  .delete(verifyToken, isSuperAdminOrAdmin, deleteCourse)
  .get(getCourseById)
  .patch(verifyToken, isSuperAdminOrAdmin, upload.single("image"), updateCourse)

router.route("/titles").post(verifyToken, getCourseTitles)

export default router