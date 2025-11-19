import express from "express"
const router = express.Router()

import { createRole, updateRole, getAllRoles, deleteRole } from "../controller/role.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
import { isSuperAdminOrAdmin } from "../middleware/role.middleware.js"

router.route("/")
  .post(verifyToken, isSuperAdminOrAdmin, createRole)
  .get(getAllRoles)

router.route("/:roleId")
  .delete(verifyToken, isSuperAdminOrAdmin, deleteRole)
  .patch(verifyToken, isSuperAdminOrAdmin, updateRole)

export default router