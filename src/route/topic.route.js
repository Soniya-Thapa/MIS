import express from "express"
const router = express.Router()

import { createTopic, updateTopic, deleteTopic, getTopicsByChapter, getTopicById, getAllTopics, getTopicTitles } from "../controller/topic.controller.js"
import { verifyToken } from "../middleware/auth.middleware.js"
import { isSuperAdminOrAdminOrTeacher } from "../middleware/role.middleware.js"

router.route("/chapter/:chapterId")
  .post(verifyToken, isSuperAdminOrAdminOrTeacher, createTopic)
  .get(getTopicsByChapter)

router.route("/:topicId")
  .delete(verifyToken, isSuperAdminOrAdminOrTeacher, deleteTopic)
  .get(getTopicById)
  .patch(verifyToken, isSuperAdminOrAdminOrTeacher, updateTopic)

router.route("/").get(getAllTopics)
router.route("/titles").post(getTopicTitles)

export default router