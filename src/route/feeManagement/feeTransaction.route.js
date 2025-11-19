import express from "express";
const router = express.Router();

import { recordPayment, getStudentTransactions, getPendingPayments, generateFeeReceipt, getPaymentHistory, getTransactionsBySemester } from "../../controller/feeManagement/feeTransaction.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";
import { isSuperAdminOrAdminOrAccountant, isSuperAdminOrAdminOrCoordinatorOrAccountant, isSuperAdminOrAdminOrCoordinatorOrAccountantOrStudent, isSuperAdminOrAdminOrAccountantOrStudent } from "../../middleware/role.middleware.js";

router.route("/").post(verifyToken, isSuperAdminOrAdminOrAccountant, recordPayment);
router.route("/history").get(verifyToken, isSuperAdminOrAdminOrAccountant, getPaymentHistory);
router.route("/student/:studentId").get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrAccountantOrStudent, getStudentTransactions);
router.route("/pending").get(verifyToken, isSuperAdminOrAdminOrAccountantOrStudent, getPendingPayments);
router.route("/:transactionId/receipt").get(verifyToken, isSuperAdminOrAdminOrAccountantOrStudent, generateFeeReceipt);
router.route("/analytics/semester/:semesterId").get(verifyToken, isSuperAdminOrAdminOrCoordinatorOrAccountant, getTransactionsBySemester);

export default router;
