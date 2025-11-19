import express from "express"
const router = express.Router()

import upload from "../middleware/multer.middleware.js"
import { forgotPassword, getMe, loginUser, logout, refreshToken, registerUser, resetPassword, setPassword } from "../controller/auth.controller.js"
import { protectRoute, requireTemporaryPassword } from "../middleware/auth.middleware.js"
import { moderateLimiter, refreshLimiter, strictLimiter } from "../middleware/rateLimiter.middleware.js"
import { handleValidationErrors, validateForgot, validateLogin, validateRegistration, validateResetPassword, validateSetPassword } from "../middleware/validation.middleware.js"

router.route("/register").post(strictLimiter, upload.single("image"), validateRegistration, handleValidationErrors, registerUser)
router.route("/login").post(strictLimiter, validateLogin, handleValidationErrors, loginUser)
router.route("/set-new-password").post(strictLimiter, moderateLimiter, validateSetPassword, protectRoute, requireTemporaryPassword, setPassword)
router.route("/logout").post(protectRoute, logout)
router.route("/forgot-password").post(strictLimiter, moderateLimiter, validateForgot, forgotPassword)
router.route("/reset-password/:token").post(strictLimiter, moderateLimiter, validateResetPassword, resetPassword)
router.route('/refresh-token').post(refreshLimiter, refreshToken);
router.route('/get-me').get(protectRoute, getMe);

export default router