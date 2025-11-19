import express from "express"
const router = express.Router()

import upload from "../middleware/multer.middleware.js"
import { createUser,deleteUser, getAllUsers, getUserById, updateUser, blockUser, unblockUser, getBlockedUsers, getAllTeachers, getAllStudents, getAllAdmins, getAllCoordinators, getAllAccountants, getUserByEmail, getUserByUsername, uploadProfilePicture, getUserStats } from "../controller/user.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { isSelf, isSuperAdmin, isSuperAdminOrAdmin, isSuperAdminOrAdminOrCoordinator, isSuperAdminOrAdminOrCoordinatorOrSelf, isSuperAdminOrAdminOrCoordinatorOrTeacher, isSuperAdminOrAdminOrSelf } from "../middleware/role.middleware.js";

router.route("/")
.post(verifyToken, upload.single("image"),createUser)
.get(verifyToken, isSuperAdminOrAdminOrCoordinator, getAllUsers)

router.route('/blocked').get(verifyToken, isSuperAdminOrAdminOrCoordinator, getBlockedUsers);
router.route('/teachers').get(verifyToken, isSuperAdminOrAdminOrCoordinator, getAllTeachers);
router.route('/students').get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrTeacher, getAllStudents);
router.route('/admins').get(verifyToken, isSuperAdmin, getAllAdmins);
router.route('/coordinators').get(verifyToken, isSuperAdminOrAdmin, getAllCoordinators);
router.route('/accountants').get(verifyToken, isSuperAdminOrAdmin, getAllAccountants);

router.route('/stats').get(verifyToken, isSuperAdminOrAdminOrCoordinator, getUserStats);

router.route('/email/:email').get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrSelf, getUserByEmail);
router.route('/username/:username').get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrSelf, getUserByUsername);

router.route("/:userId")
.delete(verifyToken, isSuperAdminOrAdmin, deleteUser)
.get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrSelf, getUserById)
.patch(verifyToken, isSuperAdminOrAdminOrSelf, updateUser)

router.route('/:userId/profile-picture').post(verifyToken, isSelf, upload.single("image"), uploadProfilePicture);
router.route("/:userId/block").post(verifyToken, isSuperAdmin, blockUser)
router.route("/:userId/unblock").post(verifyToken, isSuperAdmin, unblockUser)

export default router

