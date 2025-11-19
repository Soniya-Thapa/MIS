import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";
const prisma = new PrismaClient();

const createSemester = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course_id = hashids.decode(courseId);
    if (course_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester ID",
      });
    }
    const parsedCourse_id = course_id[0]
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { semester_name, semester_number } = req.body;
    if (!semester_name || !semester_number) {
      return res.status(400).json({
        success: false,
        message: "Please provide semester_number and semester_name ."
      })
    }
    const userId = req.user.user_id; // Get the authenticated user's ID
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    // First check if the course exists
    const course = await prisma.course.findUnique({
      where: {
        course_id: parseInt(parsedCourse_id)
      }
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    // Before creating a semester, check whether it exists
    const existingSemester = await prisma.semester.findFirst({
      where: {
        course_id: parseInt(parsedCourse_id),
        semester_number: parseInt(semester_number),
      },
    });

    if (existingSemester) {
      return res.status(409).json({
        success: false,
        message: `Semester ${semester_number} already exists for this course`,
      });
    }

    const semester = await prisma.semester.create({
      data: {
        semester_name,
        semester_number: parseInt(semester_number),
        course: {
          connect: {
            course_id: parseInt(parsedCourse_id)
          }
        },
        user: {
          connect: {
            user_id: userId
          }
        },
        updated_at: new Date()
      },
      include: {
        course: {
          select: {
            course_id: true,
            course_name: true
          }
        },
        user: {
          select: {
            user_id: true,
            username: true
          }
        }
      }
    });
    const hashedSemester = {
      ...semester,
      semester_id: hashids.encode(semester.semester_id),
      course_id: hashids.encode(semester.course_id),
      user_id: hashids.encode(semester.user_id),
      course: {
        ...semester.course,
        course_id: hashids.encode(semester.course.course_id)
      },
      user: {
        ...semester.user,
        user_id: hashids.encode(semester.user.user_id)
      }
    }
    return res.status(201).json({
      success: true,
      message: "Semester created successfully",
      data: hashedSemester
    });
  } catch (error) {
    console.error("Error in createSemester:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating semester",
      error: error.message
    });
  }
};

const updateSemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const semester_id = hashids.decode(semesterId);
    if (semester_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester ID",
      });
    }
    const parsedSemester_id = semester_id[0]
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { semester_name, semester_number } = req.body;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    // Check if semester exists
    const existingSemester = await prisma.semester.findUnique({
      where: {
        semester_id: parseInt(parsedSemester_id)
      },
      include: { user: true }, // To check ownership
    });

    if (!existingSemester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }
    const updateData = {};
    if (semester_name) updateData.semester_name = semester_name;
    if (semester_number) updateData.semester_number = parseInt(semester_number);
    updateData.updated_at = new Date();

    const updatedSemester = await prisma.semester.update({
      where: {
        semester_id: parseInt(parsedSemester_id)
      },
      data: updateData,
      include: {
        course: {
          select: {
            course_id: true,
            course_name: true,
          },
        },
        user: {
          select: {
            user_id: true,
            username: true,
          },
        },
      }
    });
    const hashedSemester = {
      ...updatedSemester,
      semester_id: hashids.encode(updatedSemester.semester_id),
      course_id: hashids.encode(updatedSemester.course_id),
      user_id: hashids.encode(updatedSemester.user_id),
      course: {
        ...updatedSemester.course,
        course_id: hashids.encode(updatedSemester.course.course_id),
      },
      user: {
        ...updatedSemester.user,
        user_id: hashids.encode(updatedSemester.user.user_id),
      },
    };
    return res.status(200).json({
      success: true,
      message: "Semester updated successfully",
      data: hashedSemester,
    });
  } catch (error) {
    console.error("Error in updateSemester:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating semester",
      error: error.message
    });
  }
};

const deleteSemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const semester_id = hashids.decode(semesterId);
    if (semester_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester ID",
      });
    }
    const parsedSemester_id = semester_id[0]
    await prisma.semester.delete({
      where: {
        semester_id: parseInt(parsedSemester_id)
      }
    });
    return res.status(200).json({
      success: true,
      message: "Semester deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteSemester:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting semester",
      error: error.message
    });
  }
};

const getSemestersByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course_id = hashids.decode(courseId);
    if (course_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }
    const parsedCourse_id = course_id[0]
    const semesters = await prisma.semester.findMany({
      where: {
        course_id: parseInt(parsedCourse_id)
      },
      include: {
        subjects: {
          include: {
            chapter: {
              include: {
                topic: true
              }
            }
          }
        }
      }
    });
    if (!semesters.length) {
      return res.status(404).json({
        success: false,
        message: "Semesters not found"
      });
    }
    const hashedsemesters = semesters.map(semester => ({
      ...semester,
      semester_id: hashids.encode(semester.semester_id),
      course_id: hashids.encode(semester.course_id),
      user_id: hashids.encode(semester.user_id)
    }))
    return res.status(200).json({
      success: true,
      data: hashedsemesters
    });
  } catch (error) {
    console.error("Error in getSemesters:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching semesters",
      error: error.message
    });
  }
};

const getAllSemesters = async (req, res) => {
  try {
    // Fetch all semesters from the database
    const semesters = await prisma.semester.findMany({
      include: {
        course: {
          select: {
            course_code: true,
            course_name: true,
          },
        }, // Include course details if needed
        subjects: {
          include: {
            chapter: {
              include: {
                topic: true, // Include topics if needed
              },
            },
          },
        },
      },
    });
    const hashedsemesters = semesters.map(semester => ({
      ...semester,
      semester_id: hashids.encode(semester.semester_id),
      course_id: hashids.encode(semester.course_id),
      user_id: hashids.encode(semester.user_id)
    }))
    return res.status(200).json({
      success: true,
      data: hashedsemesters,
    });
  } catch (error) {
    console.error("Error in getAllSemesters:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching all semesters",
      error: error.message,
    });
  }
};

const getSemesterById = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const semester_id = hashids.decode(semesterId);
    if (semester_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester ID",
      });
    }
    const parsedSemester_id = semester_id[0]
    const semester = await prisma.semester.findUnique({
      where: {
        semester_id: parseInt(parsedSemester_id)
      },
      include: {
        course: true,
        subjects: {
          include: {
            chapter: {
              include: {
                topic: true
              }
            }
          }
        }
      }
    });
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found"
      });
    }
    const hashedsemesters = {
      ...semester,
      semester_id: hashids.encode(semester.semester_id),
      course_id: hashids.encode(semester.course_id),
      user_id: hashids.encode(semester.user_id),
      course: {
        ...semester.course,
        course_id: hashids.encode(semester.course.course_id),
        created_by: hashids.encode(semester.course.created_by)
      }
    }
    return res.status(200).json({
      success: true,
      data: hashedsemesters
    });
  } catch (error) {
    console.error("Error in getSemesterById:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching semester",
      error: error.message
    });
  }
};

const getSemesterTitles = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { semesterIds } = req.body; // Expect an array of semester IDs in the request body
    if (!semesterIds) {
      return res.status(400).json({
        success: false,
        message: "SemesterIds are required"
      });
    }
    if (!Array.isArray(semesterIds) || semesterIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty semesterIds array",
      });
    }
    // Decode each hashed ID
    const decodedIds = semesterIds
      .map(id => hashids.decode(id)[0])
      .filter(id => id); // remove any undefined/null
    if (decodedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester IDs",
      });
    }
    // Fetch course titles for the given course IDs
    const semesterTitles = await prisma.semester.findMany({
      where: {
        semester_id: {
          in: decodedIds, // Use the `in` operator to filter by multiple IDs
        },
      },
      select: {
        semester_id: true, // Include course_id for reference
        semester_name: true, // Fetch only the course_name
      },
    });
    // Re-encode the course IDs before sending back
    const encodedResult = semesterTitles.map(semester => ({
      semester_id: hashids.encode(semester.semester_id),
      semester_name: semester.semester_name,
    }));
    return res.status(200).json({
      success: true,
      data: encodedResult,
    });
  } catch (error) {
    console.error("Error in getSemesterTitles:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching semester titles",
      error: error.message,
    });
  }
};


//need to work here 


// Upgrade student's semester
const upgradeSemester = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { studentId, newSemester } = req.body;
    // Validate input
    if (!studentId || !newSemester) {
      return res.status(400).json({
        success: false,
        message: "Student ID and new semester are required"
      });
    }
    // Decode student ID
    const decodedStudent = hashids.decode(studentId);
    if (decodedStudent.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }
    const parsedStudent_id = decodedStudent[0];
    // Get student's current enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id: parseInt(parsedStudent_id) },
      include: { course: true }
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Student not found or not enrolled in any course"
      });
    }
    // Get total semesters in the course
    const totalSemesters = await prisma.semester.count({
      where: { course_id: enrollment.course_id }
    });
    // Validate new semester
    if (newSemester > totalSemesters) {
      return res.status(400).json({
        success: false,
        message: `Invalid semester. Course has only ${totalSemesters} semesters`
      });
    }
    // Update student's semester
    const updatedEnrollment = await prisma.enrollment.update({
      where: { student_id: parseInt(parsedStudent_id) },
      data: { current_semester: newSemester }
    });
    // Encode IDs before sending response
    return res.status(200).json({
      success: true,
      message: "Student semester upgraded successfully",
      data: {
        student_id: hashids.encode(parsedStudent_id),
        course_name: enrollment.course.course_name,
        old_semester: enrollment.current_semester,
        new_semester: newSemester,
      },
    });
  } catch (error) {
    console.error('Error upgrading semester:', error);
    return res.status(500).json({
      success: false,
      message: "Error upgrading student semester",
      error: error.message,
    });
  }
};

// Get student's current semester and access information
const getStudentSemesterInfo = async (req, res) => {
  try {
    const { studentId } = req.params;
    // Decode student ID
    const decodedStudent = hashids.decode(studentId);
    if (decodedStudent.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }
    const parsedStudent_id = decodedStudent[0];
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id: parseInt(parsedStudent_id) },
      include: {
        course: true,
        student: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Student not found or not enrolled in any course"
      });
    }
    // Get total semesters in the course
    const totalSemesters = await prisma.semester.count({
      where: { course_id: enrollment.course_id }
    });
    return res.status(200).json({
      success: true,
      data: {
        student: {
          id: hashids.encode(parsedStudent_id),
          name: `${enrollment.student.first_name} ${enrollment.student.last_name}`,
          email: enrollment.student.email,
        },
        course: enrollment.course.course_name,
        current_semester: enrollment.current_semester,
        total_semesters: totalSemesters,
        accessible_semesters: Array.from(
          { length: enrollment.current_semester },
          (_, i) => i + 1
        ),
      },
    });
  } catch (error) {
    console.error('Error getting student semester info:', error);
    return res.status(500).json({
      success: false,
      message: "Error getting student semester information",
      error: error.message,
    });
  }
};

// GET ACCESSIBLE SEMESTERS FOR A STUDENT
const getAccessibleSemesters = async (req, res) => {
  try {
    const { studentId } = req.params;
    // Decode student ID
    const decodedStudent = hashids.decode(studentId);
    if (decodedStudent.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }
    const parsedStudent_id = decodedStudent[0];
    // Get student's enrollment information
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id: parseInt(parsedStudent_id) },
      include: {
        course: {
          include: {
            semesters: true // Include semesters to get semester details
          }
        }
      }
    });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Student not found or not enrolled in any course"
      });
    }
    // Find the current semester details to get the semester number
    const currentSemesterDetails = enrollment.course.semesters.find(
      semester => semester.semester_id === enrollment.current_semester
    );

    if (!currentSemesterDetails) {
      return res.status(404).json({
        success: false,
        message: "Current semester not found"
      });
    }
    // Fetch all semesters with number less than or equal to current semester
    const accessibleSemesters = await prisma.semester.findMany({
      where: {
        course_id: enrollment.course_id,
        semester_number: {
          lte: currentSemesterDetails.semester_number // Use the semester number from current semester details
        }
      },
      include: {
        subjects: {
          include: {
            chapter: {
              include: {
                topic: true
              }
            }
          }
        }
      },
      orderBy: {
        semester_number: 'asc' // Order by semester number ascending
      }
    });
    // Encode IDs in response
    const encodedSemesters = accessibleSemesters.map((sem) => ({
      ...sem,
      semester_id: hashids.encode(sem.semester_id),
      course_id: hashids.encode(sem.course_id),
      user_id: hashids.encode(sem.user_id),
    }));
    return res.status(200).json({
      success: true,
      data: {
        student_info: {
          student_id: hashids.encode(parsedStudent_id),
          course_name: enrollment.course.course_name,
          current_semester: hashids.encode(enrollment.current_semester),
          current_semester_number: currentSemesterDetails.semester_number,
        },
        accessible_semesters: encodedSemesters,
      },
    });
  } catch (error) {
    console.error("Error in getAccessibleSemesters:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching accessible semesters",
      error: error.message
    });
  }
};

export {
  createSemester,
  updateSemester,
  deleteSemester,
  getSemestersByCourse,
  getAllSemesters,
  getSemesterById,
  getSemesterTitles,
  upgradeSemester,
  getStudentSemesterInfo,
  getAccessibleSemesters,
}