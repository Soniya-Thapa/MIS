import express from "express";
const router = express.Router();

import {assignSubjectsToTeacher,removeSubjectFromTeacher,getTeacherAssignments,getSubjectTeachers,getAllAssignments,getAvailableSubjectsForTeacher,getAvailableTeachersForSubject,bulkAssignTeachersToSubjects} from "../controller/teacherSubjectAssignment.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
import { isSuperAdminOrAdmin, isSuperAdminOrAdminOrTeacher } from "../middleware/role.middleware.js"

router.route("/assign").post(verifyToken,isSuperAdminOrAdmin, assignSubjectsToTeacher);
router.route("/").get(verifyToken,isSuperAdminOrAdmin, getAllAssignments);
router.route("/remove/teacher/:teacher_id/subject/:subject_id").delete(verifyToken,isSuperAdminOrAdmin, removeSubjectFromTeacher);
router.route("/teacher/:teacher_id").get(verifyToken,isSuperAdminOrAdminOrTeacher, getTeacherAssignments); // Teachers can view their own assignments
router.route("/subject/:subject_id").get(verifyToken,isSuperAdminOrAdminOrTeacher, getSubjectTeachers); // Anyone can view subject teachers
router.route("/available-subjects/teacher/:teacher_id").get(verifyToken,isSuperAdminOrAdmin, getAvailableSubjectsForTeacher);
router.route("/available-teachers/subject/:subject_id").get(verifyToken,isSuperAdminOrAdmin, getAvailableTeachersForSubject);
router.route("/bulk-assign").post(verifyToken,isSuperAdminOrAdmin, bulkAssignTeachersToSubjects);

export default router;