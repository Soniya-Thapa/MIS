import express from "express"
const router = express.Router()

import { createSemester, updateSemester, deleteSemester, getSemestersByCourse, getSemesterById, upgradeSemester, getStudentSemesterInfo, getAccessibleSemesters, getAllSemesters, getSemesterTitles } from "../controller/semester.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
import { isSuperAdminOrAdmin } from "../middleware/role.middleware.js"

router.route("/course/:courseId")
  .post(verifyToken, isSuperAdminOrAdmin, createSemester)
  .get(getSemestersByCourse)

router.route("/:semesterId")
  .delete(verifyToken, isSuperAdminOrAdmin, deleteSemester)
  .get(getSemesterById)
  .patch(verifyToken, isSuperAdminOrAdmin, updateSemester)

router.route("/").get(getAllSemesters)
router.route("/titles").post(getSemesterTitles)

router.route("/upgrade").post(verifyToken,isSuperAdminOrAdmin,upgradeSemester)
router.route("/student/:studentId").get(getStudentSemesterInfo)
router.route("/student/:studentId/accessible").get(getAccessibleSemesters)


export default router