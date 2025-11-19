import express from "express"
const router = express.Router()

import {enrollStudent,getCourseEnrollments,getStudentsBySemester,getSemesterDistribution,selfEnroll,updateEnrollmentStatus,getPendingEnrollments,getUserEnrollmentStatus,upgradeStudentSemester,checkEnrollmentStatus,withdrawEnrollment,cancelEnrollment,getAllEnrollments,getEnrollmentByUser} from "../controller/enrollment.controller.js"

import { verifyToken } from "../middleware/auth.middleware.js"
import {isSuperAdminOrAdminOrCoordinatorOrTeacher,isSuperAdminOrAdminOrCoordinatorOrAccountantOrTeacher,isStudent,isSuperAdminOrAdmin,isSuperAdminOrAdminOrCoordinator} from "../middleware/role.middleware.js"

router.route("/")
  .post(verifyToken, isSuperAdminOrAdminOrCoordinator, enrollStudent)
  .get(verifyToken, isSuperAdminOrAdmin, getAllEnrollments);
router.route("/course/:courseId").get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrTeacher, getCourseEnrollments)
router.route("/course/:courseId/semester/:current_semester").get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrTeacher, getStudentsBySemester)
router.route("/distribution/course/:courseId").get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrAccountantOrTeacher, getSemesterDistribution)
router.route("/self").post(verifyToken, isStudent, selfEnroll)
router.route("/by-user").get(verifyToken, isSuperAdminOrAdminOrCoordinator, getEnrollmentByUser);
router.route("/pending").get(verifyToken, isSuperAdminOrAdmin, getPendingEnrollments);
router.route("/:enrollmentId/status").patch(verifyToken, isSuperAdminOrAdmin, updateEnrollmentStatus);
router.route("/:enrollmentId/upgrade").patch(verifyToken, isSuperAdminOrAdmin, upgradeStudentSemester);
router.route("/:enrollmentId/cancel").delete(verifyToken, isSuperAdminOrAdmin, cancelEnrollment);
router.route("/:enrollmentId/withdraw").delete(verifyToken, withdrawEnrollment);
router.route("/mystatus").get(verifyToken, isStudent, getUserEnrollmentStatus);
router.route("/check-enrollment-status").get(verifyToken, isStudent, checkEnrollmentStatus);

export default router

// import express from 'express'
// const router = express.Router();
// import { verifyToken, isSuperAdmin } from '../middleware/auth.middleware.js';

// import {
//     selfEnroll,
//     updateEnrollmentStatus,
//     getPendingEnrollments,
//     getUserEnrollmentStatus,
//     getCourseEnrollments,
//     getStudentsBySemester,
//     getSemesterDistribution,
//     enrollStudent,
//     upgradeStudentSemester,
//     checkEnrollmentStatus,
//     withdrawEnrollment,
//     cancelEnrollment,
//     getAllEnrollments,
//     getEnrollmentByUser
// } from '../controllers/enrollmentController.js'

// // Apply authentication middleware to all routes
// router.use(verifyToken);

// // Student routes
// router.post('/self-enroll', selfEnroll);
// router.get('/my-status', getUserEnrollmentStatus);

// // Admin routes
// router.post('/enroll', enrollStudent);
// router.post('/:enrollmentId/status', isSuperAdmin, updateEnrollmentStatus);
// router.get('/pending', isSuperAdmin, getPendingEnrollments);
// router.get('/course/:courseId', isSuperAdmin, getCourseEnrollments);
// router.get('/course/:courseId/semester/:semester', isSuperAdmin, getStudentsBySemester);
// router.get('/course/:courseId/distribution', isSuperAdmin, getSemesterDistribution);
// router.put('/:enrollmentId/upgrade', isSuperAdmin, upgradeStudentSemester);
// router.get('/status', verifyToken, checkEnrollmentStatus);
// router.delete('/withdraw', verifyToken, withdrawEnrollment);
// router.delete('/:enrollmentId/cancel', isSuperAdmin, cancelEnrollment);
// router.get('/all', isSuperAdmin, getAllEnrollments);
// router.get('/by-user', isSuperAdmin, getEnrollmentByUser);
// export default router;