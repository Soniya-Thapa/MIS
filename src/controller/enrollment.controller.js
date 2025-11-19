import { PrismaClient } from "@prisma/client";
import { emailTemplates, sendEmail } from "../services/email.config.js";
import hashids from "../services/hashids.js";

const prisma = new PrismaClient();

// Enroll a student in a course
export const enrollStudent = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing."
      });
    }
    const { studentId, courseId, current_semester, batch_id, fee_structure_id } = req.body;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Validate input
    if (!studentId || !courseId || !current_semester || !fee_structure_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID, course ID, current semester, and fee structure ID are required",
      });
    }
    // Decode student_id
    const decodedStudentId = hashids.decode(studentId);
    if (decodedStudentId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID"
      });
    }
    const parsedStudentId = decodedStudentId[0];
    // Decode course_id
    const decodedCourseId = hashids.decode(courseId);
    if (decodedCourseId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }
    const parsedCourseId = decodedCourseId[0];
    // Decode fee_structure_id
    const decodedFeeStructureId = hashids.decode(fee_structure_id);
    if (decodedFeeStructureId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee structure ID"
      });
    }
    const parsedFeeStructureId = decodedFeeStructureId[0];
    // Decode batch_id if provided
    let parsedBatchId = null;
    if (batch_id) {
      const decodedBatchId = hashids.decode(batch_id);
      if (decodedBatchId.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch ID"
        });
      }
      parsedBatchId = decodedBatchId[0];
    }
    // Check if student is already enrolled in this course
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: parseInt(parsedStudentId),
          course_id: parseInt(parsedCourseId)
        }
      },
    });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "Student is already enrolled in a course",
        current_course: existingEnrollment.course_id,
      });
    }
    // Check if course exists and get semesters
    const course = await prisma.course.findUnique({
      where: {
        course_id: parseInt(parsedCourseId)
      },
      include: {
        semesters: true,
      },
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    // Validate semester exists in course
    const semesterExists = course.semesters.some(
      (sem) => sem.semester_number === parseInt(current_semester)
    );
    if (!semesterExists) {
      return res.status(404).json({
        success: false,
        message: "Semester not found in this course.",
      });
    }
    // Check if student exists
    const student = await prisma.user.findUnique({
      where: {
        user_id: parseInt(parsedStudentId)
      },
      include: {
        role: true
      }
    });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    // Check if fee structure exists
    const feeStructure = await prisma.fee_structure.findUnique({
      where: {
        fee_structure_id: parseInt(parsedFeeStructureId)
      }
    });
    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found"
      });
    }
    // Get Approved status ID
    const approvedStatus = await prisma.enrollmentstatus.findUnique({
      where: {
        name: "Approved"
      },
    });
    if (!approvedStatus) {
      return res.status(500).json({
        success: false,
        message: "Error: Approved status not found",
      });
    }
    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        student_id: parseInt(parsedStudentId),
        course_id: parseInt(parsedCourseId),
        current_semester: current_semester,
        status_id: approvedStatus.status_id,
        batch_id: parsedBatchId ? parseInt(parsedBatchId) : null,
        batchBatch_id: parsedBatchId ? parseInt(parsedBatchId) : null,
        fee_structure_id: parseInt(parsedFeeStructureId),
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        course: {
          select: {
            course_id: true,
            course_code: true,
            course_name: true,
            college_id: true,
            description: true,
            created_by: true,
            image: true
          }
        },
        enrollmentstatus: {
          select: {
            status_id: true,
            name: true,
            description: true
          }
        },
        batch: {
          select: {
            batch_id: true,
            course_id: true,
            batch_year: true,
            batch_name: true,
            is_active: true
          }
        },
        fee_structure: {
          select: {
            fee_structure_id: true,
            course_id: true,
            batch_year: true,
            total_amount: true,
            duration_years: true,
            total_semesters: true,
            created_by: true,
            is_active: true
          }
        },
      },
    });
    // Hash the response data
    const hashedEnrollment = {
      ...enrollment,
      enrollment_id: hashids.encode(enrollment.enrollment_id),
      student_id: hashids.encode(enrollment.student_id),
      course_id: hashids.encode(enrollment.course_id),
      batch_id: enrollment.batch_id ? hashids.encode(enrollment.batch_id) : null,
      batchBatch_id: enrollment.batchBatch_id ? hashids.encode(enrollment.batchBatch_id) : null,
      fee_structure_id: hashids.encode(enrollment.fee_structure_id),
      status_id: hashids.encode(enrollment.status_id),
      user: {
        ...enrollment.user,
        user_id: hashids.encode(enrollment.user.user_id)
      },
      course: {
        ...enrollment.course,
        course_id: hashids.encode(enrollment.course.course_id),
        created_by: hashids.encode(enrollment.course.created_by)
      },
      enrollmentstatus: {
        ...enrollment.enrollmentstatus,
        status_id: hashids.encode(enrollment.enrollmentstatus.status_id)
      },
      batch: enrollment.batch ? {
        ...enrollment.batch,
        batch_id: hashids.encode(enrollment.batch.batch_id),
        course_id: hashids.encode(enrollment.batch.course_id),
      } : null,
      fee_structure: {
        ...enrollment.fee_structure,
        fee_structure_id: hashids.encode(enrollment.fee_structure.fee_structure_id),
        course_id: hashids.encode(enrollment.fee_structure.course_id),
        created_by: hashids.encode(enrollment.fee_structure.created_by)
      }
    };
    // Send enrollment confirmation email
    const emailContent = emailTemplates.enrollmentConfirmation(
      student.full_name,
      course.course_name,
      current_semester
    );
    await sendEmail({
      to: student.email,
      ...emailContent,
    });
    return res.status(201).json({
      success: true,
      message: "Student enrolled successfully",
      data: hashedEnrollment,
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    return res.status(500).json({
      success: false,
      message: "Error enrolling student",
      error: error.message
    });
  }
};

// Get all students enrolled in a course
export const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    // Validate and decode courseId
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required"
      });
    }
    const decodedCourseId = hashids.decode(courseId);
    if (decodedCourseId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }
    const parsedCourseId = decodedCourseId[0];
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const enrollments = await prisma.enrollment.findMany({
      where: {
        course_id: parseInt(parsedCourseId)
      },
      include: {
        user: true,
        enrollmentstatus: {
          select: {
            status_id: true,
            name: true,
            description: true
          }
        },
        batch: {
          select: {
            batch_id: true,
            course_id: true,
            batch_year: true,
            batch_name: true,
            is_active: true
          }
        },
        fee_structure: {
          select: {
            fee_structure_id: true,
            course_id: true,
            batch_year: true,
            total_amount: true,
            duration_years: true,
            total_semesters: true,
            created_by: true,
            is_active: true
          }
        },
        course: {
          select: {
            course_id: true,
            course_code: true,
            course_name: true,
            college_id: true,
            description: true,
            created_by: true,
            image: true,
            semesters: {
              select: {
                semester_id: true,
                course_id: true,
                semester_number: true,
                semester_name: true,
                user_id: true
              }
            }
          }
        },
      },
    });
    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payment records found."
      });
    }

    const enrollmentsWithSemester = enrollments.map((enrollment) => {
      const semester = enrollment.course.semesters.find(
        (sem) => sem.semester_id === enrollment.current_semester
      );
      return {
        ...enrollment,
        enrollment_id: hashids.encode(enrollment.enrollment_id),
        student_id: hashids.encode(enrollment.student_id),
        course_id: hashids.encode(enrollment.course_id),
        batch_id: enrollment.batch_id ? hashids.encode(enrollment.batch_id) : null,
        batchBatch_id: enrollment.batchBatch_id ? hashids.encode(enrollment.batchBatch_id) : null,
        fee_structure_id: hashids.encode(enrollment.fee_structure_id),
        status_id: hashids.encode(enrollment.status_id),
        user: {
          ...enrollment.user,
          user_id: hashids.encode(enrollment.user.user_id),
          role_id: hashids.encode(enrollment.user.role_id),
          created_by: hashids.encode(enrollment.user.created_by),
        },
        enrollmentstatus: {
          ...enrollment.enrollmentstatus,
          status_id: hashids.encode(enrollment.enrollmentstatus.status_id)
        },
        course: {
          ...enrollment.course,
          course_id: hashids.encode(enrollment.course.course_id),
          created_by: hashids.encode(enrollment.course.created_by),
          semesters: enrollment.course.semesters.map(sem => ({
            ...sem,
            semester_id: hashids.encode(sem.semester_id),
            course_id: hashids.encode(sem.course_id),
            user_id: hashids.encode(sem.user_id),
          }))
        },
        batch: enrollment.batch ? {
          ...enrollment.batch,
          batch_id: hashids.encode(enrollment.batch.batch_id),
          course_id: hashids.encode(enrollment.batch.course_id),
        } : null,
        fee_structure: {
          ...enrollment.fee_structure,
          fee_structure_id: hashids.encode(enrollment.fee_structure.fee_structure_id),
          course_id: hashids.encode(enrollment.fee_structure.course_id),
          created_by: hashids.encode(enrollment.fee_structure.created_by),
        }
      };
    });
    return res.status(200).json({
      success: true,
      data: {
        total_students: enrollments.length,
        students: enrollmentsWithSemester,
      },
    });
  } catch (error) {
    console.error("Error getting course enrollments:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching course enrollments",
      error: error.message
    });
  }
};

// Get students by semester in a course
export const getStudentsBySemester = async (req, res) => {
  try {
    const { courseId, current_semester } = req.params;
    // Validate and decode courseId
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required"
      });
    }
    const decodedCourseId = hashids.decode(courseId);
    if (decodedCourseId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }
    const parsedCourseId = decodedCourseId[0];
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const enrollments = await prisma.enrollment.findMany({
      where: {
        course_id: parseInt(parsedCourseId),
        current_semester: parseInt(current_semester),
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        batch: {
          select: {
            batch_id: true,
            course_id: true,
            batch_year: true,
            batch_name: true,
            is_active: true
          }
        },
        fee_structure: {
          select: {
            fee_structure_id: true,
            course_id: true,
            batch_year: true,
            total_amount: true,
            duration_years: true,
            total_semesters: true,
            created_by: true,
            is_active: true
          }
        },
      },
    });
     if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payment records found."
      });
    }
    // Hash the response data
    const hashedEnrollments = enrollments.map(enrollment => ({
      ...enrollment,
      enrollment_id: hashids.encode(enrollment.enrollment_id),
      student_id: hashids.encode(enrollment.student_id),
      course_id: hashids.encode(enrollment.course_id),
      batch_id: enrollment.batch_id ? hashids.encode(enrollment.batch_id) : null,
      batchBatch_id: enrollment.batchBatch_id ? hashids.encode(enrollment.batchBatch_id) : null,
      fee_structure_id: hashids.encode(enrollment.fee_structure_id),
      status_id: hashids.encode(enrollment.status_id),
      user: {
        ...enrollment.user,
        user_id: hashids.encode(enrollment.user.user_id)
      },
      batch: enrollment.batch ? {
        ...enrollment.batch,
        batch_id: hashids.encode(enrollment.batch.batch_id),
        course_id: hashids.encode(enrollment.batch.course_id)
      } : null,
      fee_structure: {
        ...enrollment.fee_structure,
        fee_structure_id: hashids.encode(enrollment.fee_structure.fee_structure_id),
        course_id: hashids.encode(enrollment.fee_structure.course_id),
        created_by: hashids.encode(enrollment.fee_structure.created_by),
      }
    }));
    return res.status(200).json({
      success: true,
      data: {
        course_id: courseId,
        semester: current_semester,
        total_students: enrollments.length,
        students: hashedEnrollments,
      },
    });
  } catch (error) {
    console.error("Error getting students by semester:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching students by semester",
      error: error.message
    });
  }
};

// Get semester-wise student distribution for a course
export const getSemesterDistribution = async (req, res) => {
  try {
    const { courseId } = req.params;
    // Validate and decode courseId
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is required"
      });
    }
    const decodedCourseId = hashids.decode(courseId);
    if (decodedCourseId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }
    const parsedCourseId = decodedCourseId[0];
    // Get all semesters in the course
    const semesters = await prisma.semester.findMany({
      where: {
        course_id: parseInt(parsedCourseId)
      },
      orderBy: {
        semester_number: "asc"
      },
    });
     if (!semesters || semesters.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payment records found."
      });
    }
    // Get enrollments for each semester
    const distribution = await Promise.all(
      semesters.map(async (semester) => {
        const enrollments = await prisma.enrollment.findMany({
          where: {
            course_id: parseInt(parsedCourseId),
            current_semester: semester.semester_number,
          },
          include: {
            user: {
              select: {
                user_id: true,
                full_name: true,
                email: true,
              },
            },
          },
        });
        const hashedEnrollments = enrollments.map(enrollment => ({
          ...enrollment,
          enrollment_id: hashids.encode(enrollment.enrollment_id),
          student_id: hashids.encode(enrollment.student_id),
          course_id: hashids.encode(enrollment.course_id),
          batch_id: enrollment.batch_id ? hashids.encode(enrollment.batch_id) : null,
          batchBatch_id: enrollment.batchBatch_id ? hashids.encode(enrollment.batchBatch_id) : null,
          fee_structure_id: hashids.encode(enrollment.fee_structure_id),
          status_id: hashids.encode(enrollment.status_id),
          user: {
            ...enrollment.user,
            user_id: hashids.encode(enrollment.user.user_id)
          }
        }));
        return {
          semester_id: hashids.encode(semester.semester_id),
          semester_number: semester.semester_number,
          semester_name: semester.semester_name,
          total_students: enrollments.length,
          students: hashedEnrollments,
        };
      })
    );
    return res.status(200).json({
      success: true,
      data: {
        course_id: courseId,
        total_semesters: semesters.length,
        semester_distribution: distribution,
      },
    });
  } catch (error) {
    console.error("Error getting semester distribution:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching semester distribution",
      error: error.message
    });
  }
};

// Self-enroll in a course
export const selfEnroll = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing."
      });
    }
    const { courseId, current_semester, batch_id, fee_structure_id } = req.body;
    const studentId = req.user.user_id;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Validate input
    if (!courseId || !current_semester || !fee_structure_id) {
      return res.status(400).json({
        success: false,
        message: "Course ID, current semester, and fee structure ID are required",
      });
    }
    // Decode course_id
    const decodedCourseId = hashids.decode(courseId);
    if (decodedCourseId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID"
      });
    }
    const parsedCourseId = decodedCourseId[0];
    // Decode fee_structure_id
    const decodedFeeStructureId = hashids.decode(fee_structure_id);
    if (decodedFeeStructureId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee structure ID"
      });
    }
    const parsedFeeStructureId = decodedFeeStructureId[0];
    // Decode batch_id if provided
    let parsedBatchId = null;
    if (batch_id) {
      const decodedBatchId = hashids.decode(batch_id);
      if (decodedBatchId.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch ID"
        });
      }
      parsedBatchId = decodedBatchId[0];
    }
    // Check if student is already enrolled in this course
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: parseInt(parsedCourseId)
        }
      },
    });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
        current_course: hashids.encode(existingEnrollment.course_id),
      });
    }
    // Check if course exists and get semesters
    const course = await prisma.course.findUnique({
      where: {
        course_id: parseInt(parsedCourseId)
      },
      include: {
        semesters: true,
      },
    });
    if (!course || !course.semesters.some(sem => sem.semester_number === parseInt(current_semester))) {
      return res.status(404).json({
        success: false,
        message: "Course not found or semester mismatch",
      });
    }

    // Check if fee structure exists
    const feeStructure = await prisma.fee_structure.findUnique({
      where: {
        fee_structure_id: parseInt(parsedFeeStructureId)
      }
    });
    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found"
      });
    }
    // Get Pending status ID
    const pendingStatus = await prisma.enrollmentstatus.findUnique({
      where: {
        name: "Pending"
      },
    });
    if (!pendingStatus) {
      return res.status(500).json({
        success: false,
        message: "Error: Pending status not found",
      });
    }
    // Create enrollment with pending status
    const enrollment = await prisma.enrollment.create({
      data: {
        student_id: studentId,
        course_id: parseInt(parsedCourseId),
        current_semester: parseInt(current_semester),
        status_id: pendingStatus.status_id,
        batch_id: parsedBatchId ? parseInt(parsedBatchId) : null,
        fee_structure_id: parseInt(parsedFeeStructureId),
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        },
        course: {
          select: {
            course_id: true,
            course_code: true,
            course_name: true,
            college_id: true,
            description: true,
            created_by: true,
            image: true
          }
        },
        enrollmentstatus: {
          select: {
            status_id: true,
            name: true,
            description: true
          }
        },
        batch: {
          select: {
            batch_id: true,
            course_id: true,
            batch_year: true,
            batch_name: true,
            is_active: true
          }
        },
        fee_structure: {
          select: {
            fee_structure_id: true,
            course_id: true,
            batch_year: true,
            total_amount: true,
            duration_years: true,
            total_semesters: true,
            created_by: true,
            is_active: true
          }
        },
      },
    });

    // Hash the response data
    const hashedEnrollment = {
      ...enrollment,
      enrollment_id: hashids.encode(enrollment.enrollment_id),
      student_id: hashids.encode(enrollment.student_id),
      course_id: hashids.encode(enrollment.course_id),
      batch_id: enrollment.batch_id ? hashids.encode(enrollment.batch_id) : null,
      batchBatch_id: enrollment.batchBatch_id ? hashids.encode(enrollment.batchBatch_id) : null,
      fee_structure_id: hashids.encode(enrollment.fee_structure_id),
      status_id: hashids.encode(enrollment.status_id),
      user: {
        ...enrollment.user,
        user_id: hashids.encode(enrollment.user.user_id)
      },
      course: {
        ...enrollment.course,
        course_id: hashids.encode(enrollment.course.course_id),
        created_by: hashids.encode(enrollment.course.created_by)
      },
      enrollmentstatus: {
        ...enrollment.enrollmentstatus,
        status_id: hashids.encode(enrollment.enrollmentstatus.status_id)
      },
      batch: enrollment.batch ? {
        ...enrollment.batch,
        batch_id: hashids.encode(enrollment.batch.batch_id),
        course_id: hashids.encode(enrollment.batch.course_id),
      } : null,
      fee_structure: {
        ...enrollment.fee_structure,
        fee_structure_id: hashids.encode(enrollment.fee_structure.fee_structure_id),
        course_id: hashids.encode(enrollment.fee_structure.course_id),
        created_by: hashids.encode(enrollment.fee_structure.created_by)
      }
    };
    // Send enrollment confirmation email
    const emailContent = emailTemplates.enrollmentPending(
      enrollment.user.full_name,
      enrollment.course.course_name,
      enrollment.current_semester
    );
    await sendEmail({
      to: enrollment.user.email,
      ...emailContent,
    });
    res.status(201).json({
      success: true,
      message: "Enrollment request submitted successfully. Waiting for admin approval.",
      data: hashedEnrollment,
    });
  } catch (error) {
    console.error("Error in self-enrollment:", error);
    res.status(500).json({
      success: false,
      message: "Error submitting enrollment request",
      error: error.message
    });
  }
};

// Update enrollment status (admin only)
export const updateEnrollmentStatus = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing."
      });
    }
    const { enrollmentId } = req.params;
    // Validate enrollmentId
    if (!enrollmentId) {
      return res.status(400).json({
        success: false,
        message: "Enrollment ID is required",
      });
    }
    const { status } = req.body;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Decode enrollmentId
    const decodedEnrollmentId = hashids.decode(enrollmentId);
    if (decodedEnrollmentId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment ID"
      });
    }
    const parsedEnrollmentId = decodedEnrollmentId[0];
    // Validate status
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be either 'Approved' or 'Rejected'",
      });
    }
    // Get the status ID
    const statusRecord = await prisma.enrollmentstatus.findUnique({
      where: {
        name: status
      },
    });
    if (!statusRecord) {
      return res.status(500).json({
        success: false,
        message: `Error: ${status} status not found`,
      });
    }
    // Check if enrollment exists and is pending
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        enrollment_id: parseInt(parsedEnrollmentId)
      },
      include: {
        user: true,
        course: true,
        enrollmentstatus: true,
        batch: true,
        fee_structure: true,
      },
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }
    if (enrollment.enrollmentstatus.name !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Can only update pending enrollments",
      });
    }
    const updatedEnrollment = await prisma.enrollment.update({
      where: {
        enrollment_id: parseInt(parsedEnrollmentId)
      },
      data: {
        status_id: statusRecord.status_id,
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        course: {
          select: {
            course_id: true,
            course_code: true,
            course_name: true,
            college_id: true,
            description: true,
            created_by: true,
            image: true
          }
        },
        enrollmentstatus: {
          select: {
            status_id: true,
            name: true,
            description: true
          }
        },
        batch: {
          select: {
            batch_id: true,
            course_id: true,
            batch_year: true,
            batch_name: true,
            is_active: true
          }
        },
        fee_structure: {
          select: {
            fee_structure_id: true,
            course_id: true,
            batch_year: true,
            total_amount: true,
            duration_years: true,
            total_semesters: true,
            created_by: true,
            is_active: true
          }
        },
      },
    });
    // Hash the response data
    const hashedEnrollment = {
      ...updatedEnrollment,
      enrollment_id: hashids.encode(updatedEnrollment.enrollment_id),
      student_id: hashids.encode(updatedEnrollment.student_id),
      course_id: hashids.encode(updatedEnrollment.course_id),
      batch_id: updatedEnrollment.batch_id ? hashids.encode(updatedEnrollment.batch_id) : null,
      batchBatch_id: updatedEnrollment.batchBatch_id ? hashids.encode(updatedEnrollment.batchBatch_id) : null,
      fee_structure_id: hashids.encode(updatedEnrollment.fee_structure_id),
      status_id: hashids.encode(updatedEnrollment.status_id),
      user: {
        ...updatedEnrollment.user,
        user_id: hashids.encode(updatedEnrollment.user.user_id)
      },
      course: {
        ...enrollment.course,
        course_id: hashids.encode(enrollment.course.course_id),
        created_by: hashids.encode(enrollment.course.created_by)
      },
      enrollmentstatus: {
        ...enrollment.enrollmentstatus,
        status_id: hashids.encode(enrollment.enrollmentstatus.status_id)
      },
      batch: enrollment.batch ? {
        ...enrollment.batch,
        batch_id: hashids.encode(enrollment.batch.batch_id),
        course_id: hashids.encode(enrollment.batch.course_id),
      } : null,
      fee_structure: {
        ...enrollment.fee_structure,
        fee_structure_id: hashids.encode(enrollment.fee_structure.fee_structure_id),
        course_id: hashids.encode(enrollment.fee_structure.course_id),
        created_by: hashids.encode(enrollment.fee_structure.created_by)
      }
    };
    // Send email based on status
    const studentName = enrollment.user.full_name;
    const emailContent =
      status === "Approved"
        ? emailTemplates.enrollmentApproved(
          studentName,
          enrollment.course.course_name,
          enrollment.current_semester
        )
        : emailTemplates.enrollmentRejected(
          studentName,
          enrollment.course.course_name,
          enrollment.current_semester
        );
    await sendEmail({
      to: enrollment.user.email,
      ...emailContent,
    });
    return res.status(200).json({
      success: true,
      message: `Enrollment ${status.toLowerCase()} successfully`,
      data: hashedEnrollment,
    });
  } catch (error) {
    console.error("Error updating enrollment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating enrollment status",
      error: error.message
    });
  }
};

// Get pending enrollments (admin only)
export const getPendingEnrollments = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Get the Pending status ID
    const pendingStatus = await prisma.enrollmentstatus.findUnique({
      where: {
        name: "Pending"
      },
    });
    if (!pendingStatus) {
      return res.status(500).json({
        success: false,
        message: "Error: Pending status not found",
      });
    }
    // Get all pending enrollments
    const pendingEnrollments = await prisma.enrollment.findMany({
      where: {
        status_id: pendingStatus.status_id,
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            phone: true,
          },
        },
        course: {
          select: {
            course_id: true,
            course_code: true,
            course_name: true,
            college_id: true,
            description: true,
            created_by: true,
            image: true
          }
        },
        enrollmentstatus: {
          select: {
            status_id: true,
            name: true,
            description: true
          }
        },
        batch: {
          select: {
            batch_id: true,
            course_id: true,
            batch_year: true,
            batch_name: true,
            is_active: true
          }
        },
        fee_structure: {
          select: {
            fee_structure_id: true,
            course_id: true,
            batch_year: true,
            total_amount: true,
            duration_years: true,
            total_semesters: true,
            created_by: true,
            is_active: true
          }
        },
      },
      orderBy: {
        enrollment_date: 'desc'
      }
    });
     if (!pendingEnrollments || pendingEnrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No pendingEnrollments found."
      });
    }
    // Hash the response data
    const hashedEnrollments = pendingEnrollments.map(enrollment => ({
      ...enrollment,
      enrollment_id: hashids.encode(enrollment.enrollment_id),
      student_id: hashids.encode(enrollment.student_id),
      course_id: hashids.encode(enrollment.course_id),
      batch_id: enrollment.batch_id ? hashids.encode(enrollment.batch_id) : null,
      batchBatch_id: enrollment.batchBatch_id ? hashids.encode(enrollment.batchBatch_id) : null,
      fee_structure_id: hashids.encode(enrollment.fee_structure_id),
      status_id: hashids.encode(enrollment.status_id),
      user: {
        ...enrollment.user,
        user_id: hashids.encode(enrollment.user.user_id)
      },
      course: {
        ...enrollment.course,
        course_id: hashids.encode(enrollment.course.course_id),
        created_by: hashids.encode(enrollment.course.created_by)
      },
      enrollmentstatus: {
        ...enrollment.enrollmentstatus,
        status_id: hashids.encode(enrollment.enrollmentstatus.status_id)
      },
      batch: enrollment.batch ? {
        ...enrollment.batch,
        batch_id: hashids.encode(enrollment.batch.batch_id),
        course_id: hashids.encode(enrollment.batch.course_id),
      } : null,
      fee_structure: {
        ...enrollment.fee_structure,
        fee_structure_id: hashids.encode(enrollment.fee_structure.fee_structure_id),
        course_id: hashids.encode(enrollment.fee_structure.course_id),
        created_by: hashids.encode(enrollment.fee_structure.created_by)
      }
    }));
    return res.status(200).json({
      success: true,
      message: `Found ${hashedEnrollments.length} pending enrollments`,
      data: hashedEnrollments,
    });
  } catch (error) {
    console.error("Error getting pending enrollments:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting pending enrollments",
      error: error.message
    });
  }
};

// Get user's enrollment status
export const getUserEnrollmentStatus = async (req, res) => {
  try {
    const userId = req.user.user_id;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const enrollments = await prisma.enrollment.findMany({
      where: {
        student_id: parseInt(userId)
      },
      include: {
        course: {
          select: {
            course_id: true,
            course_code: true,
            course_name: true,
            college_id: true,
            description: true,
            created_by: true,
            image: true
          }
        },
        enrollmentstatus: {
          select: {
            status_id: true,
            name: true,
            description: true
          }
        },
        batch: {
          select: {
            batch_id: true,
            course_id: true,
            batch_year: true,
            batch_name: true,
            is_active: true
          }
        },
        fee_structure: {
          select: {
            fee_structure_id: true,
            course_id: true,
            batch_year: true,
            total_amount: true,
            duration_years: true,
            total_semesters: true,
            created_by: true,
            is_active: true
          }
        },
      },
    });
    if (enrollments.length == 0) {
      return res.status(404).json({
        success: false,
        message: "No enrollment found",
      });
    }
    // Hash the response data
    const hashedEnrollments = enrollments.map(enrollment => ({
      enrollment_id: hashids.encode(enrollment.enrollment_id),
      student_id: hashids.encode(enrollment.student_id),
      course_id: hashids.encode(enrollment.course_id),
      batch_id: enrollment.batch_id ? hashids.encode(enrollment.batch_id) : null,
      fee_structure_id: hashids.encode(enrollment.fee_structure_id),
      status_id: hashids.encode(enrollment.status_id),
      status: enrollment.enrollmentstatus.name,
      course: enrollment.course.course_name,
      current_semester: enrollment.current_semester,
      enrollment_date: enrollment.enrollment_date,
      course: {
        ...enrollment.course,
        course_id: hashids.encode(enrollment.course.course_id),
        created_by: hashids.encode(enrollment.course.created_by)
      },
      enrollmentstatus: {
        ...enrollment.enrollmentstatus,
        status_id: hashids.encode(enrollment.enrollmentstatus.status_id)
      },
      batch: enrollment.batch ? {
        ...enrollment.batch,
        batch_id: hashids.encode(enrollment.batch.batch_id),
        course_id: hashids.encode(enrollment.batch.course_id),
      } : null,
      fee_structure: {
        ...enrollment.fee_structure,
        fee_structure_id: hashids.encode(enrollment.fee_structure.fee_structure_id),
        course_id: hashids.encode(enrollment.fee_structure.course_id),
        created_by: hashids.encode(enrollment.fee_structure.created_by)
      }
    }));
    return res.status(200).json({
      success: true,
      data: hashedEnrollments,
    });
  } catch (error) {
    console.error("Error getting user enrollment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching enrollment status",
      error: error.message
    });
  }
};

// Upgrade student's semester (admin only)
export const upgradeStudentSemester = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { newSemester } = req.body;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Validate input
    if (!enrollmentId || !newSemester) {
      return res.status(400).json({
        success: false,
        message: "Enrollment ID and new semester are required",
      });
    }
    // Decode enrollmentId
    const decodedEnrollmentId = hashids.decode(enrollmentId);
    if (decodedEnrollmentId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment ID"
      });
    }
    const parsedEnrollmentId = decodedEnrollmentId[0];
    // Get enrollment with course details
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        enrollment_id: parseInt(parsedEnrollmentId)
      },
      include: {
        user: true,
        course: {
          include: {
            semesters: true,
          },
        },
        batch: true,
        fee_structure: true,
        enrollmentstatus: true,
      },
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }
    // Check if new semester is greater than current semester
    if (newSemester <= enrollment.current_semester) {
      return res.status(400).json({
        success: false,
        message: "New semester must be greater than current semester",
      });
    }
    // Validate new semester exists in course
    if (!enrollment.course.semesters.some(sem => sem.semester_number === newSemester)) {
      return res.status(400).json({
        success: false,
        message: "New semester not found in this course",
      });
    }
    if (enrollment.enrollmentstatus.name !== "Approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved students can upgrade their semester.",
      });
    }
    // Update student's semester
    const updatedEnrollment = await prisma.enrollment.update({
      where: {
        enrollment_id: parseInt(parsedEnrollmentId)
      },
      data: {
        current_semester: parseInt(newSemester),
      },
      include: {
        user: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
          },
        },
        course: {
          select: {
            course_id: true,
            course_code: true,
            course_name: true,
            college_id: true,
            description: true,
            created_by: true,
            image: true
          }
        },
        enrollmentstatus: {
          select: {
            status_id: true,
            name: true,
            description: true
          }
        },
        batch: {
          select: {
            batch_id: true,
            course_id: true,
            batch_year: true,
            batch_name: true,
            is_active: true
          }
        },
        fee_structure: {
          select: {
            fee_structure_id: true,
            course_id: true,
            batch_year: true,
            total_amount: true,
            duration_years: true,
            total_semesters: true,
            created_by: true,
            is_active: true
          }
        },
      },
    });
    // Hash the response data
    const hashedEnrollment = {
      ...updatedEnrollment,
      enrollment_id: hashids.encode(updatedEnrollment.enrollment_id),
      student_id: hashids.encode(updatedEnrollment.student_id),
      course_id: hashids.encode(updatedEnrollment.course_id),
      batch_id: updatedEnrollment.batch_id ? hashids.encode(updatedEnrollment.batch_id) : null,
      batchBatch_id: updatedEnrollment.batchBatch_id ? hashids.encode(updatedEnrollment.batchBatch_id) : null,
      fee_structure_id: hashids.encode(updatedEnrollment.fee_structure_id),
      status_id: hashids.encode(updatedEnrollment.status_id),
      user: {
        ...updatedEnrollment.user,
        user_id: hashids.encode(updatedEnrollment.user.user_id)
      },
      course: {
        ...updatedEnrollment.course,
        course_id: hashids.encode(updatedEnrollment.course.course_id),
        created_by: hashids.encode(updatedEnrollment.course.created_by)
      },
      enrollmentstatus: {
        ...updatedEnrollment.enrollmentstatus,
        status_id: hashids.encode(updatedEnrollment.enrollmentstatus.status_id)
      },
      batch: enrollment.batch ? {
        ...updatedEnrollment.batch,
        batch_id: hashids.encode(updatedEnrollment.batch.batch_id),
        course_id: hashids.encode(updatedEnrollment.batch.course_id),
      } : null,
      fee_structure: {
        ...updatedEnrollment.fee_structure,
        fee_structure_id: hashids.encode(updatedEnrollment.fee_structure.fee_structure_id),
        course_id: hashids.encode(updatedEnrollment.fee_structure.course_id),
        created_by: hashids.encode(updatedEnrollment.fee_structure.created_by)
      }
    };
    // Send semester upgrade email
    const studentName = enrollment.user.full_name;
    const emailContent = emailTemplates.semesterUpgrade(
      studentName,
      enrollment.course.course_name,
      newSemester
    );
    await sendEmail({
      to: enrollment.user.email,
      ...emailContent,
    });
    return res.status(200).json({
      success: true,
      message: `Student's semester upgraded successfully to semester ${newSemester}`,
      data: hashedEnrollment,
    });
  } catch (error) {
    console.error("Error upgrading student semester:", error);
    return res.status(500).json({
      success: false,
      message: "Error upgrading student semester",
      error: error.message
    });
  }
};

export const checkEnrollmentStatus = async (req, res) => {
  try {
    const studentId = req.user.user_id;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const enrollments = await prisma.enrollment.findMany({
      where: {
        student_id: parseInt(studentId)
      },
      include: {
        course: {
          include: {
            semesters: true,
          },
        },
        enrollmentstatus: true,
      },
    });
    if (!enrollments.length) {
      return res.status(200).json({
        success: true,
        enrolled: false,
      });
    }
    // Hash the response data
    const hashedEnrollments = enrollments.map(enrollment => {
      const currentSemesterDetails = enrollment.course.semesters.find(
        semester => semester.semester_number = enrollment.current_semester
      );
      return {
        enrollment_id: hashids.encode(enrollment.enrollment_id),
        enrolled: true,
        course_id: hashids.encode(enrollment.course_id),
        status_id: hashids.encode(enrollment.status_id),
        status_name: enrollment.enrollmentstatus.name,
        course_name: enrollment.course.course_name,
        current_semester: enrollment.current_semester,
        current_semester_number: currentSemesterDetails?.semester_number || null,
        current_semester_name: currentSemesterDetails?.semester_name || null,
      };
    });
    return res.status(200).json({
      success: true,
      data: hashedEnrollments,
    });
  } catch (error) {
    console.error("Error checking enrollment status:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking enrollment status",
      error: error.message
    });
  }
};

// Get all enrollments (admin only)
export const getAllEnrollments = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const { page = 1, limit = 10, status, course_id } = req.query;
    if (!status || !course_id) {
      return res.status(401).json({
        success: false,
        message: "Status and course_id are not provided."
      });
    }
    const where = {};
    // Filter by status if provided
    if (status) {
      const statusRecord = await prisma.enrollmentstatus.findUnique({
        where: {
          name: status
        }
      });
      if (statusRecord) {
        where.status_id = statusRecord.status_id;
      }
    }
    // Filter by course if provided
    if (course_id) {
      const decodedCourseId = hashids.decode(course_id);
      if (decodedCourseId.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID"
        });
      }
      where.course_id = parseInt(decodedCourseId[0]);
    }
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        user: true,
        course: {
          select: {
            course_id: true,
            course_code: true,
            course_name: true,
            college_id: true,
            description: true,
            created_by: true,
            image: true,
            semesters: {
              select: {
                semester_id: true,
                course_id: true,
                semester_number: true,
                semester_name: true,
                user_id: true
              }
            }
          }
        },
        enrollmentstatus: {
          select: {
            status_id: true,
            name: true,
            description: true
          }
        },
        batch: {
          select: {
            batch_id: true,
            course_id: true,
            batch_year: true,
            batch_name: true,
            is_active: true
          }
        },
        fee_structure: {
          select: {
            fee_structure_id: true,
            course_id: true,
            batch_year: true,
            total_amount: true,
            duration_years: true,
            total_semesters: true,
            created_by: true,
            is_active: true
          }
        },
      },
      orderBy: {
        enrollment_date: 'desc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });
     if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payment records found."
      });
    }
    const totalCount = await prisma.enrollment.count({ where });
    // Attach current semester details and hash IDs
    const enrollmentsWithSemester = enrollments.map((enrollment) => {
      const semester = enrollment.course.semesters.find(
        (sem) => sem.semester_number === enrollment.current_semester
      );
      return {
        ...enrollment,
        enrollment_id: hashids.encode(enrollment.enrollment_id),
        student_id: hashids.encode(enrollment.student_id),
        course_id: hashids.encode(enrollment.course_id),
        batch_id: enrollment.batch_id ? hashids.encode(enrollment.batch_id) : null,
        batchBatch_id: enrollment.batchBatch_id ? hashids.encode(enrollment.batchBatch_id) : null,
        fee_structure_id: hashids.encode(enrollment.fee_structure_id),
        status_id: hashids.encode(enrollment.status_id),
        semester: semester ? {
          ...semester,
          semester_id: hashids.encode(semester.semester_id),
          course_id: hashids.encode(semester.course_id),
          user_id: hashids.encode(semester.user_id),
        } : null,
        user: {
          ...enrollment.user,
          user_id: hashids.encode(enrollment.user.user_id),
          role_id: hashids.encode(enrollment.user.role_id),
          created_by: hashids.encode(enrollment.user.created_by),
        },
        course: {
          ...enrollment.course,
          course_id: hashids.encode(enrollment.course.course_id),
          created_by: hashids.encode(enrollment.course.created_by),
          semesters: enrollment.course.semesters.map(sem => ({
            ...sem,
            semester_id: hashids.encode(sem.semester_id),
            course_id: hashids.encode(sem.course_id),
            user_id: hashids.encode(sem.user_id)
          }))
        },
        enrollmentstatus: {
          ...enrollment.enrollmentstatus,
          status_id: hashids.encode(enrollment.enrollmentstatus.status_id)
        },
        batch: enrollment.batch ? {
          ...enrollment.batch,
          batch_id: hashids.encode(enrollment.batch.batch_id),
          course_id: hashids.encode(enrollment.batch.course_id),
        } : null,
        fee_structure: {
          ...enrollment.fee_structure,
          fee_structure_id: hashids.encode(enrollment.fee_structure.fee_structure_id),
          course_id: hashids.encode(enrollment.fee_structure.course_id),
          created_by: hashids.encode(enrollment.fee_structure.created_by),
        }
      };
    });
    return res.status(200).json({
      success: true,
      message: "Enrollments fetched successfully",
      data: enrollmentsWithSemester,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error("Error getting all enrollments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching enrollments",
      error: error.message
    });
  }
};

// Get enrollment by user (by user_id, email, or username)
export const getEnrollmentByUser = async (req, res) => {
  try {
    const { query } = req.query;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required (user_id, email, or username)",
      });
    }
    // Try to find user by hashed user_id first
    let user = null;
    // Try decoding only if query is numeric hashid
    if (/^[A-Za-z0-9]+$/.test(query)) {
      const decodedUserId = hashids.decode(query);
      if (decodedUserId.length > 0) {
        user = await prisma.user.findUnique({
          where: {
            user_id: parseInt(decodedUserId[0])
          }
        });
      }
    }
    // Try email if not found
    if (!user && query.includes('@')) {
      user = await prisma.user.findUnique({
        where: {
          email: query
        }
      });
    }
    // Try username if still not found
    if (!user) {
      user = await prisma.user.findUnique({
        where: {
          username: query
        }
      });
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Get enrollment(s) for this user
    const enrollments = await prisma.enrollment.findMany({
      where: {
        student_id: parseInt(user.user_id)
      },
      include: {
        user: true,
        course: {
          select: {
            course_id: true,
            course_code: true,
            course_name: true,
            college_id: true,
            description: true,
            created_by: true,
            image: true,
            semesters: {
              select: {
                semester_id: true,
                course_id: true,
                semester_number: true,
                semester_name: true,
                user_id: true
              }
            }
          }
        },
        enrollmentstatus: {
          select: {
            status_id: true,
            name: true,
            description: true
          }
        },
        batch: {
          select: {
            batch_id: true,
            course_id: true,
            batch_year: true,
            batch_name: true,
            is_active: true
          }
        },
        fee_structure: {
          select: {
            fee_structure_id: true,
            course_id: true,
            batch_year: true,
            total_amount: true,
            duration_years: true,
            total_semesters: true,
            created_by: true,
            is_active: true
          }
        },
      },
    });
    if (enrollments.length == 0) {
      return res.status(404).json({
        success: false,
        message: "No enrollments found for this user",
      });
    }
    // Attach current semester details and hash IDs
    const enrollmentsWithSemester = enrollments.map((enrollment) => {
      const semester = enrollment.course.semesters.find(
        (sem) => sem.semester_number === enrollment.current_semester
      );
      return {
        ...enrollment,
        enrollment_id: hashids.encode(enrollment.enrollment_id),
        student_id: hashids.encode(enrollment.student_id),
        course_id: hashids.encode(enrollment.course_id),
        batch_id: enrollment.batch_id ? hashids.encode(enrollment.batch_id) : null,
        batchBatch_id: enrollment.batchBatch_id ? hashids.encode(enrollment.batchBatch_id) : null,
        fee_structure_id: hashids.encode(enrollment.fee_structure_id),
        status_id: hashids.encode(enrollment.status_id),
        semester: semester ? {
          ...semester,
          semester_id: hashids.encode(semester.semester_id),
          course_id: hashids.encode(semester.course_id),
          user_id: hashids.encode(semester.user_id),
        } : null,
        user: {
          ...enrollment.user,
          user_id: hashids.encode(enrollment.user.user_id),
          role_id: hashids.encode(enrollment.user.role_id),
          created_by: hashids.encode(enrollment.user.created_by),
        },
        course: {
          ...enrollment.course,
          course_id: hashids.encode(enrollment.course.course_id),
          created_by: hashids.encode(enrollment.course.created_by),
          semesters: enrollment.course.semesters.map(sem => ({
            ...sem,
            semester_id: hashids.encode(sem.semester_id),
            course_id: hashids.encode(sem.course_id),
            user_id: hashids.encode(sem.user_id)
          }))
        },
        enrollmentstatus: {
          ...enrollment.enrollmentstatus,
          status_id: hashids.encode(enrollment.enrollmentstatus.status_id)
        },
        batch: enrollment.batch ? {
          ...enrollment.batch,
          batch_id: hashids.encode(enrollment.batch.batch_id),
          course_id: hashids.encode(enrollment.batch.course_id),
        } : null,
        fee_structure: {
          ...enrollment.fee_structure,
          fee_structure_id: hashids.encode(enrollment.fee_structure.fee_structure_id),
          course_id: hashids.encode(enrollment.fee_structure.course_id),
          created_by: hashids.encode(enrollment.fee_structure.created_by),
        }
      };
    });
    return res.status(200).json({
      success: true,
      data: enrollmentsWithSemester,
    });
  } catch (error) {
    console.error("Error getting enrollment by user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching enrollment by user",
      error: error.message
    });
  }
};

export const withdrawEnrollment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const userId = req.user.user_id;
    const { enrollmentId } = req.params;
    // Validate enrollmentId
    if (!enrollmentId) {
      return res.status(400).json({
        success: false,
        message: "Enrollment ID is required",
      });
    }
    // Decode enrollmentId
    const decodedEnrollmentId = hashids.decode(enrollmentId);
    if (decodedEnrollmentId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment ID"
      });
    }
    const parsedEnrollmentId = decodedEnrollmentId[0];
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        enrollment_id: parseInt(parsedEnrollmentId)
      },
      include: {
        enrollmentstatus: true,
      },
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }
    // Verify that this enrollment belongs to the user
    if (parseInt(enrollment.student_id) !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to withdraw this enrollment",
      });
    }
    // Optional: Only allow withdrawal if status is Pending
    if (enrollment.enrollmentstatus.name !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "You can only withdraw applications with a pending status"
      });
    }
    await prisma.enrollment.delete({
      where: {
        enrollment_id: parseInt(parsedEnrollmentId)
      },
    });
    return res.status(200).json({
      success: true,
      message: "Your enrollment application has been successfully withdrawn",
    });
  } catch (error) {
    console.error("Error withdrawing enrollment:", error);
    return res.status(500).json({
      success: false,
      message: "Error withdrawing enrollment application",
      error: error.message
    });
  }
};

// Cancel a student's enrollment (admin only)
export const cancelEnrollment = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const { enrollmentId } = req.params;
    // Validate enrollmentId
    if (!enrollmentId) {
      return res.status(400).json({
        success: false,
        message: "Enrollment ID is required",
      });
    }
    // Decode enrollmentId
    const decodedEnrollmentId = hashids.decode(enrollmentId);
    if (decodedEnrollmentId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment ID"
      });
    }
    const parsedEnrollmentId = decodedEnrollmentId[0];
    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        enrollment_id: parseInt(parsedEnrollmentId)
      },
      include: {
        user: true,
        course: true,
      }
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }
    // Delete the enrollment
    await prisma.enrollment.delete({
      where: {
        enrollment_id: parseInt(parsedEnrollmentId)
      },
    });
    res.status(200).json({
      success: true,
      message: "Enrollment cancelled successfully",
      data: {
        student_name: enrollment.user.full_name,
        course_name: enrollment.course.course_name,
      }
    });
  } catch (error) {
    console.error("Error cancelling enrollment:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling enrollment",
      error: error.message
    });
  }
};

{
  enrollStudent,
    getCourseEnrollments,
    getStudentsBySemester,
    getSemesterDistribution,
    selfEnroll,
    updateEnrollmentStatus,
    getPendingEnrollments,
    getUserEnrollmentStatus,
    upgradeStudentSemester,
    checkEnrollmentStatus,
    withdrawEnrollment,
    cancelEnrollment,
    getAllEnrollments,
    getEnrollmentByUser
}