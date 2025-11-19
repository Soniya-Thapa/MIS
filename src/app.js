import express from "express"
import cookieParser from "cookie-parser";
const app = express()

import authRoutes from "../src/route/auth.route.js"
import userRoutes from "../src/route/user.route.js"
import courseRoutes from "../src/route/course.route.js"
import semesterRoutes from "../src/route/semester.route.js"
import subjectRoutes from "../src/route/subject.route.js"
import chapterRoutes from "../src/route/chapter.route.js"
import topicRoutes from "../src/route/topic.route.js"
import roleRoutes from "../src/route/role.route.js"
import materialTypeRoutes from "../src/route/materialTypes.route.js"
import studyMaterialRoutes from "../src/route/studyMaterial.route.js"
import teacherSubjectAssignmentRoutes from "./route/teacherSubjectAssignment.route.js"
import batchRoutes from "./route/batch.route.js"
import feeCategoryRoutes from "./route/feeManagement/feeCategory.route.js"
import feeStructureRoutes from "./route/feeManagement/feeStructure.route.js"
import feeTransactionRoutes from "./route/feeManagement/feeTransaction.route.js"
import enrollmentRoutes from "./route/enrollment.route.js"
import locationRoutes from "./route/location.route.js"
import universityRoutes from "./route/university.route.js"
import collegeRoutes from "./route/college.route.js"

app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/auth",authRoutes)
app.use("/users",userRoutes)
app.use("/courses",courseRoutes)
app.use("/semesters",semesterRoutes)
app.use("/subjects",subjectRoutes)
app.use("/chapters",chapterRoutes)
app.use("/topics",topicRoutes)
app.use("/roles",roleRoutes)
app.use("/materialTypes",materialTypeRoutes)
app.use("/studyMaterials",studyMaterialRoutes)
app.use("/teacherSubjectAssignments",teacherSubjectAssignmentRoutes)
app.use("/batches",batchRoutes)
app.use("/feeCategories",feeCategoryRoutes)
app.use("/feeStructures",feeStructureRoutes)
app.use("/feeTransactions",feeTransactionRoutes)
app.use("/enrollments",enrollmentRoutes)
app.use("/locations",locationRoutes)
app.use("/universities",universityRoutes)
app.use("/colleges",collegeRoutes)

export default app