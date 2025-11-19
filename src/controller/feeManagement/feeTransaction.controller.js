import { PrismaClient } from "@prisma/client";
import hashids from "../../services/hashids.js";

const prisma = new PrismaClient();

// Helper to decode hashed ID
const decodeId = (hashedId, name = "ID") => {
  const decoded = hashids.decode(hashedId);
  if (decoded.length === 0) throw new Error(`Invalid ${name}`);
  return decoded[0];
};

// Record a payment (students pay fees)
const recordPayment = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing."
      });
    }
    const { student_id: hashedStudentId, semester_id: hashedSemesterId, payment_method, reference_number, remarks, categories } = req.body;
    // Validate required fields
    if (!hashedStudentId || !hashedSemesterId || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide student_id, semester_id, amount_paid and at least one category with amount_paid.."
      });
    }
    // Decode hash IDs
    const student_id = decodeId(hashedStudentId, "student ID");
    const semester_id = decodeId(hashedSemesterId, "semester ID");
    // Authenticated user
    const userId = req.user?.user_id;
    if (!userId)
      return res.status(401).json({
        success: false,
        message: "User not authenticated."
      });
    // Check existence
    const student = await prisma.user.findUnique({
      where: {
        user_id: student_id
      }
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }
    const existingPayment = await prisma.fee_transaction.findFirst({
      where: {
        student_id, semester_id
      }
    });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment for this semester has already been recorded."
      });
    }
    // Create transaction
    const transaction = await prisma.fee_transaction.create({
      data: {
        amount_paid: categories.reduce((sum, c) => sum + parseFloat(c.amount_paid), 0),
        payment_method: payment_method || "Cash",
        reference_number: reference_number || null,
        remarks: remarks || null,
        payment_date: new Date(),
        // Relations
        student: { connect: { user_id: student_id } },
        semester: { connect: { semester_id } },
        recorder: { connect: { user_id: userId } },
        categories: {
          create: categories.map(c => ({
            category: { connect: { category_id: decodeId(c.category_id, "category ID") } },
            amount_paid: parseFloat(c.amount_paid)
          }))
        },
      },
      include: {
        categories: true
      }
    });
    // Hash IDs for response
    const hashedTransaction = {
      ...transaction,
      transaction_id: hashids.encode(transaction.transaction_id),
      student_id: hashids.encode(transaction.student_id),
      semester_id: hashids.encode(transaction.semester_id),
      recorded_by: hashids.encode(transaction.recorded_by),
      categories: transaction.categories.map(cat => ({
        ...cat,
        id: hashids.encode(cat.id),
        transaction_id: hashids.encode(cat.transaction_id),
        category_id: hashids.encode(cat.category_id)
      }))
    };
    return res.status(201).json({
      success: true,
      message: "Payment recorded successfully.",
      data: hashedTransaction
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record payment.",
      error: error.message
    });
  }
};

// Get payment history of a student
const getStudentTransactions = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const { studentId: hashedStudentId } = req.params;
    if (!hashedStudentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is missing."
      });
    }
    const student_id = decodeId(hashedStudentId, "student ID");
    const transactions = await prisma.fee_transaction.findMany({
      where: {
        student_id
      },
      orderBy: {
        payment_date: "desc"
      },
      include: {
        categories: {  // this is the relation field in your schema
          include: {
            category: { // fetch category details like name
              select: {
                category_id: true,
                category_name: true,
                description: true,
                created_by: true,
                is_active: true
              }
            }
          }
        }
      }
    });
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found for this student."
      });
    }
    const hashed = transactions.map(t => ({
      ...t,
      transaction_id: hashids.encode(t.transaction_id),
      student_id: hashids.encode(t.student_id),
      semester_id: hashids.encode(t.semester_id),
      recorded_by: hashids.encode(t.recorded_by),
      categories: t.categories.map(c => ({
        ...c,
        id: hashids.encode(c.id),
        transaction_id: hashids.encode(c.transaction_id),
        category_id: hashids.encode(c.category_id),
        category: {
          ...c.category,
          category_id: hashids.encode(c.category.category_id),
          created_by: hashids.encode(c.category.created_by)
        }
      }))
    }));
    return res.status(200).json({
      success: true,
      message: "Student transactions fetched successfully.",
      data: hashed
    });
  } catch (error) {
    console.error("Error fetching student transactions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions.",
      error: error.message
    });
  }
};

// Get pending payments for a student
const getPendingPayments = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const { studentId: hashedStudentId } = req.query;
    if (!hashedStudentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID required."
      });
    }
    const student_id = decodeId(hashedStudentId, "student ID");
    // Find enrollment (with batch info)
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        student_id
      },
      include: {
        batch: true
      }
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found for student."
      });
    }
    // Get fee structure for this course + batch year
    const feeStructure = await prisma.fee_structure.findUnique({
      where: {
        course_id_batch_year: {
          course_id: enrollment.course_id,
          batch_year: enrollment.batch?.batch_year || 0
        }
      },
      include: {
        fee_structure_categories: {
          include: {
            category: true
          }
        }
      }
    });
    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found for this batch."
      });
    }
    // Fetch all transactions for this student in this batch
    const transactions = await prisma.fee_transaction.findMany({
      where: {
        student_id
      },
      include: {
        categories: true // fetch paid amounts per category
      }
    });
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found."
      });
    }
    // Calculate total paid per category
    const paidPerCategory = {};
    transactions.forEach(tx => {
      tx.categories.forEach(c => {
        if (!paidPerCategory[c.category_id]) paidPerCategory[c.category_id] = 0;
        paidPerCategory[c.category_id] += Number(c.amount_paid);
      });
    });
    // Prepare pending per category
    const pendingCategories = feeStructure.fee_structure_categories.map(c => {
      const paid = paidPerCategory[c.category_id] || 0;
      return {
        category_id: hashids.encode(c.category_id),
        category_name: c.category.category_name,
        total_amount: Number(c.amount),
        paid_amount: paid,
        pending_amount: Number(c.amount) - paid
      };
    });
    // Total pending
    const totalPending = pendingCategories.reduce((sum, c) => sum + c.pending_amount, 0);
    return res.status(200).json({
      success: true,
      totalPending,
      categories: pendingCategories
    });
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending payments.",
      error: error.message
    });
  }
};

// Generate fee receipt for a transaction
const generateFeeReceipt = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const { transactionId: hashedTransactionId } = req.params;
    if (!hashedTransactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID missing."
      });
    }
    const transaction_id = decodeId(hashedTransactionId, "transaction ID");
    const transaction = await prisma.fee_transaction.findUnique({
      where: {
        transaction_id
      },
      include: {
        student: true,
        categories: {
          include: {
            category: true // assuming fee_transaction_category → category relation exists
          }
        }
      },
    });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found."
      });
    }
    // Get enrollment info to find batch & course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        student_id: transaction.student_id
      },
      include: {
        batch: true
      }
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found for student."
      });
    }
    const feeStructure = await prisma.fee_structure.findUnique({
      where: {
        course_id_batch_year: {
          course_id: enrollment.course_id,
          batch_year: enrollment.batch?.batch_year || 0
        }
      },
      include: {
        fee_structure_categories: {
          include: {
            category: true
          }
        }
      }
    });
    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found for this batch."
      });
    }
    const categories = transaction.categories.map((c) => {
      const structure = feeStructure.fee_structure_categories.find(
        (sc) => sc.category_id === c.category_id
      );
      const totalAmount = structure ? Number(structure.amount) : Number(c.amount_paid);
      const paidAmount = Number(c.amount_paid);
      const pendingAmount = totalAmount - paidAmount;
      return {
        category_name: c.category.category_name,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        pending_amount: pendingAmount
      };
    });
    const total_amount = categories.reduce((sum, c) => sum + c.total_amount, 0);
    const paid_amount = categories.reduce((sum, c) => sum + c.paid_amount, 0);
    const pending_amount = categories.reduce((sum, c) => sum + c.pending_amount, 0);
    const studentName =
      transaction.student?.name ||
      transaction.student?.full_name ||
      transaction.student?.username ||
      "Unknown Student";
    // If one transaction may have multiple categories
    const receipt = {
      receipt_number: hashids.encode(transaction.transaction_id),
      student_name: studentName,
      categories,
      total_amount,
      paid_amount,
      pending_amount,
      date: transaction.payment_date.toISOString().split("T")[0],
      method: transaction.payment_method
    };
    return res.status(200).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate receipt.",
      error: error.message
    });
  }
};

// Admin: get all payment history
const getPaymentHistory = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const transactions = await prisma.fee_transaction.findMany({
      include: {
        student: true,
        categories: {
          include: {
            category: { // assuming fee_transaction_category → category relation exists
              select: {
                category_id: true,
                category_name: true,
                description: true,
                created_by: true,
                is_active: true
              }
            }
          }
        }
      },
      orderBy: {
        payment_date: "desc"
      },
    });
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found for this student."
      });
    }
    const hashed = transactions.map(t => ({
      ...t,
      transaction_id: hashids.encode(t.transaction_id),
      student_id: hashids.encode(t.student_id),
      semester_id: hashids.encode(t.semester_id),
      recorded_by: hashids.encode(t.recorded_by),
      student: {
        ...t.student,
        user_id: hashids.encode(t.student.user_id),
        role_id: hashids.encode(t.student.role_id),
        created_by: hashids.encode(t.student.created_by),
      },
      categories: t.categories.map(c => ({
        ...c,
        id: hashids.encode(c.id),
        transaction_id: hashids.encode(c.transaction_id),
        category_id: hashids.encode(c.category_id),
        category: {
          ...c.category,
          category_id: hashids.encode(c.category.category_id),
          created_by: hashids.encode(c.category.created_by),
        }
      }))
    }));
    return res.status(200).json({
      success: true,
      message: "Payment history fetched successfully.",
      data: hashed
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history.",
      error: error.message
    });
  }
};

// Analytics: transactions by semester/batch
const getTransactionsBySemester = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const { semesterId: hashedSemesterId } = req.params;
    if (!hashedSemesterId) {
      return res.status(400).json({
        success: false,
        message: "Semester ID missing."
      });
    }
    const semester_id = decodeId(hashedSemesterId, "semester ID");
    const transactions = await prisma.fee_transaction.findMany({
      where: { semester_id },
      include: {
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    if (!transactions || transactions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No transactions found for this student."
      });
    }
    // Encode IDs if needed (like your example)
    const result = transactions.map((tx) => ({
      transaction_id: hashids.encode(tx.transaction_id),
      student_id: hashids.encode(tx.student_id),
      semester_id: hashids.encode(tx.semester_id),
      amount_paid: tx.amount_paid.toString(),
      payment_date: tx.payment_date,
      payment_method: tx.payment_method,
      reference_number: tx.reference_number,
      remarks: tx.remarks,
      recorded_by: hashids.encode(tx.recorded_by),
      created_at: tx.created_at,
      categories: tx.categories.map((c) => ({
        id: hashids.encode(c.id),
        transaction_id: hashids.encode(c.transaction_id),
        category_id: hashids.encode(c.category_id),
        amount_paid: c.amount_paid.toString(),
        category: {
          category_id: hashids.encode(c.category.category_id),
          category_name: c.category.category_name,
          description: c.category.description,
          created_by: hashids.encode(c.category.created_by),
          is_active: c.category.is_active
        }
      }))
    }));
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Error fetching transactions by semester:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions.",
      error: error.message
    });
  }
};

export {
  recordPayment,
  getStudentTransactions,
  getPendingPayments,
  generateFeeReceipt,
  getPaymentHistory,
  getTransactionsBySemester,
};
