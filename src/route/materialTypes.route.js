import express from "express"
const router = express.Router()

import { getAllMaterialTypes} from "../controller/materialTypes.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
import { isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent } from "../middleware/role.middleware.js"

router.route("/").get(verifyToken,isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent,getAllMaterialTypes)

export default router;