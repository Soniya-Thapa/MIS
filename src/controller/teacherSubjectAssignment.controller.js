import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";

const prisma = new PrismaClient();

// Assign subjects to teacher
const assignSubjectsToTeacher = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing."
      });
    }
    const { teacher_id, subject_ids } = req.body; // subject_ids should be an array
    // Check if user is authenticated and is admin
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Validate input
    if (!teacher_id || !Array.isArray(subject_ids) || subject_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID and subject IDs array are required"
      });
    }
    // Decode teacher_id
    const decodedTeacherId = hashids.decode(teacher_id);
    if (decodedTeacherId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID"
      });
    }
    const parsedTeacherId = decodedTeacherId[0];
    // Decode subject_ids
    const decodedSubjectIds = subject_ids
      .map(id => hashids.decode(id)[0])
      .filter(id => id !== undefined);
    if (decodedSubjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject IDs"
      });
    }
    if (decodedSubjectIds.length !== subject_ids.length) {
      return res.status(400).json({
        success: false,
        message: "One or more subject IDs are invalid"
      });
    }
    // Check if teacher exists and has teacher role
    const teacher = await prisma.user.findUnique({
      where: { user_id: parseInt(parsedTeacherId) },
      include: { role: true }
    });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }
    // Check if subjects exist
    const subjects = await prisma.subject.findMany({
      where: {
        subject_id: {
          in: decodedSubjectIds.map(id => parseInt(id))
        }
      }
    });
    if (subjects.length !== subject_ids.length) {
      return res.status(404).json({
        success: false,
        message: "One or more subjects not found"
      });
    }
    // Check for existing assignments
    const existingAssignments = await prisma.teacherSubjectAssignment.findMany({
      where: {
        teacher_id: parseInt(parsedTeacherId),
        subject_id: {
          in: decodedSubjectIds.map(id => parseInt(id))
        },
      }
    });
    const newAssignments = [];
    const reactivatedAssignments = [];
    for (const subject_id of decodedSubjectIds) {
      const existing = existingAssignments.find(assignment => assignment.subject_id === parseInt(subject_id));
      if (existing) {
        if (!existing.is_active) {
          reactivatedAssignments.push(subject_id);
        }
      } else {
        newAssignments.push(subject_id);
      }
    }
    // Reactivate previously removed assignments
    if (reactivatedAssignments.length > 0) {
      await Promise.all(
        reactivatedAssignments.map(subject_id =>
          prisma.teacherSubjectAssignment.update({
            where: {
              teacher_id_subject_id: {
                teacher_id: parseInt(parsedTeacherId),
                subject_id: parseInt(subject_id)
              }
            },
            data: {
              is_active: true,
              assigned_by: req.user.user_id,
              assigned_at: new Date()
            }
          })
        )
      );
    }
    // Create new assignments
    if (newAssignments.length > 0) {
      await prisma.teacherSubjectAssignment.createMany({
        data: newAssignments.map(subject_id => ({
          teacher_id: parseInt(parsedTeacherId),
          subject_id: parseInt(subject_id),
          assigned_by: req.user.user_id,
          is_active: true
        }))
      });
    }
    if (newAssignments.length === 0 && reactivatedAssignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All subjects are already assigned to this teacher"
      });
    }
    // Fetch created/reactivated assignments with details
    const processedSubjectIds = [...newAssignments, ...reactivatedAssignments];
    const createdAssignments = await prisma.teacherSubjectAssignment.findMany({
      where: {
        teacher_id: parseInt(parsedTeacherId),
        subject_id: {
          in: processedSubjectIds.map(id => parseInt(id))
        },
        is_active: true
      },
      include: {
        teacher: {
          select: {
            user_id: true,
            username: true,
            email: true,
            full_name: true
          }
        },
        subject: {
          select: {
            subject_id: true,
            subject_code: true,
            subject_name: true,
            semester: {
              select: {
                semester_id: true,
                semester_name: true,
                course: {
                  select: {
                    course_id: true,
                    course_name: true
                  }
                }
              }
            }
          }
        },
        admin: {
          select: {
            user_id: true,
            username: true,
            full_name: true
          }
        }
      }
    });
    // Hash the response data
    const hashedAssignments = createdAssignments.map(assignment => ({
      ...assignment,
      assignment_id: hashids.encode(assignment.assignment_id),
      teacher_id: hashids.encode(assignment.teacher_id),
      subject_id: hashids.encode(assignment.subject_id),
      assigned_by: hashids.encode(assignment.assigned_by),
      teacher: {
        ...assignment.teacher,
        user_id: hashids.encode(assignment.teacher.user_id)
      },
      subject: {
        ...assignment.subject,
        subject_id: hashids.encode(assignment.subject.subject_id),
        semester: {
          ...assignment.subject.semester,
          semester_id: hashids.encode(assignment.subject.semester.semester_id),
          course: {
            ...assignment.subject.semester.course,
            course_id: hashids.encode(assignment.subject.semester.course.course_id)
          }
        }
      },
      admin: {
        ...assignment.admin,
        user_id: hashids.encode(assignment.admin.user_id)
      }
    }));

    res.status(201).json({
      success: true,
      message: `Processed ${processedSubjectIds.length} subject(s) for teacher`,
      data: hashedAssignments,
      skipped: existingAssignments.filter(a => a.is_active).length > 0
        ? `${existingAssignments.filter(a => a.is_active).length} subjects were already assigned`
        : null
    });
  } catch (error) {
    console.error("Error in assignSubjectsToTeacher:", error);
    res.status(500).json({
      success: false,
      message: "Error assigning subjects to teacher",
      error: error.message
    });
  }
};

// Remove subject assignment from teacher
const removeSubjectFromTeacher = async (req, res) => {
  try {
    const { teacher_id, subject_id } = req.params;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Validate and decode teacher_id
    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID is required"
      });
    }
    const decodedTeacherId = hashids.decode(teacher_id);
    if (decodedTeacherId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID"
      });
    }
    const parsedTeacherId = decodedTeacherId[0];
    // Validate and decode subject_id
    if (!subject_id) {
      return res.status(400).json({
        success: false,
        message: "Subject ID is required"
      });
    }
    const decodedSubjectId = hashids.decode(subject_id);
    if (decodedSubjectId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }
    const parsedSubjectId = decodedSubjectId[0];
    // Check if assignment exists
    const assignment = await prisma.teacherSubjectAssignment.findFirst({
      where: {
        teacher_id: parseInt(parsedTeacherId),
        subject_id: parseInt(parsedSubjectId),
        is_active: true
      },
      include: {
        teacher: {
          select: {
            user_id: true,
            username: true,
            full_name: true
          }
        },
        subject: {
          select: {
            subject_id: true,
            subject_code: true,
            subject_name: true
          }
        }
      }
    });
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found or already inactive"
      });
    }
    // Deactivate assignment instead of deleting
    await prisma.teacherSubjectAssignment.update({
      where: {
        assignment_id: assignment.assignment_id
      },
      data: {
        is_active: false
      }
    });
    return res.status(200).json({
      success: true,
      message: "Subject assignment removed successfully",
      data: {
        teacher: {
          ...assignment.teacher,
          user_id: hashids.encode(assignment.teacher.user_id)
        },
        subject: {
          ...assignment.subject,
          subject_id: hashids.encode(assignment.subject.subject_id)
        }
      }
    });
  } catch (error) {
    console.error("Error in removeSubjectFromTeacher:", error);
    res.status(500).json({
      success: false,
      message: "Error removing subject assignment",
      error: error.message
    });
  }
};

// Get all assignments for a teacher
const getTeacherAssignments = async (req, res) => {
  try {
    const { teacher_id } = req.params;
    // Validate and decode teacher_id
    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID is required"
      });
    }
    const decodedTeacherId = hashids.decode(teacher_id);
    if (decodedTeacherId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID"
      });
    }
    const parsedTeacherId = decodedTeacherId[0];
    const assignments = await prisma.teacherSubjectAssignment.findMany({
      where: {
        teacher_id: parseInt(parsedTeacherId),
        is_active: true
      },
      include: {
        subject: {
          select: {
            subject_id: true,
            subject_code: true,
            subject_name: true,
            description: true,
            semester: {
              select: {
                semester_id: true,
                semester_name: true,
                semester_number: true,
                course: {
                  select: {
                    course_id: true,
                    course_name: true,
                    course_code: true
                  }
                }
              }
            }
          }
        },
        admin: {
          select: {
            user_id: true,
            username: true,
            full_name: true
          }
        }
      },
      orderBy: {
        assigned_at: 'desc'
      }
    });
    // Hash the response data
    const hashedAssignments = assignments.map(assignment => ({
      ...assignment,
      assignment_id: hashids.encode(assignment.assignment_id),
      teacher_id: hashids.encode(assignment.teacher_id),
      subject_id: hashids.encode(assignment.subject_id),
      assigned_by: hashids.encode(assignment.assigned_by),
      subject: {
        ...assignment.subject,
        subject_id: hashids.encode(assignment.subject.subject_id),
        semester: {
          ...assignment.subject.semester,
          semester_id: hashids.encode(assignment.subject.semester.semester_id),
          course: {
            ...assignment.subject.semester.course,
            course_id: hashids.encode(assignment.subject.semester.course.course_id)
          }
        }
      },
      admin: {
        ...assignment.admin,
        user_id: hashids.encode(assignment.admin.user_id)
      }
    }));
    return res.status(200).json({
      success: true,
      message: `Found ${hashedAssignments.length} active assignments for teacher`,
      data: hashedAssignments
    });
  } catch (error) {
    console.error("Error in getTeacherAssignments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching teacher assignments",
      error: error.message
    });
  }
};

// Get all teachers assigned to a subject
const getSubjectTeachers = async (req, res) => {
  try {
    const { subject_id } = req.params;
    // Validate and decode subject_id
    if (!subject_id) {
      return res.status(400).json({
        success: false,
        message: "Subject ID is required"
      });
    }
    const decodedSubjectId = hashids.decode(subject_id);
    if (decodedSubjectId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }
    const parsedSubjectId = decodedSubjectId[0];
    const assignments = await prisma.teacherSubjectAssignment.findMany({
      where: {
        subject_id: parseInt(parsedSubjectId),
        is_active: true
      },
      include: {
        teacher: {
          select: {
            user_id: true,
            username: true,
            email: true,
            full_name: true,
            phone: true,
          }
        },
        admin: {
          select: {
            user_id: true,
            username: true,
            full_name: true
          }
        }
      },
      orderBy: {
        assigned_at: 'desc'
      }
    });
    // Hash the response data
    const hashedAssignments = assignments.map(assignment => ({
      ...assignment,
      assignment_id: hashids.encode(assignment.assignment_id),
      teacher_id: hashids.encode(assignment.teacher_id),
      subject_id: hashids.encode(assignment.subject_id),
      assigned_by: hashids.encode(assignment.assigned_by),
      teacher: {
        ...assignment.teacher,
        user_id: hashids.encode(assignment.teacher.user_id)
      },
      admin: {
        ...assignment.admin,
        user_id: hashids.encode(assignment.admin.user_id)
      }
    }));
    return res.status(200).json({
      success: true,
      message: `Found ${hashedAssignments.length} teachers assigned to this subject`,
      data: hashedAssignments
    });
  } catch (error) {
    console.error("Error in getSubjectTeachers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching subject teachers",
      error: error.message
    });
  }
};

// Get all assignments (admin view)
const getAllAssignments = async (req, res) => {
  try {
    const { page = 1, limit = 10, teacher_id, subject_id, course_id } = req.query;
    const where = {
      is_active: true
    };
    // Decode and validate teacher_id if provided
    if (teacher_id) {
      const decodedTeacherId = hashids.decode(teacher_id);
      if (decodedTeacherId.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher ID"
        });
      }
      where.teacher_id = parseInt(decodedTeacherId[0]);
    }
    // Decode and validate subject_id if provided
    if (subject_id) {
      const decodedSubjectId = hashids.decode(subject_id);
      if (decodedSubjectId.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid subject ID"
        });
      }
      where.subject_id = parseInt(decodedSubjectId[0]);
    }
    // Decode and validate course_id if provided
    if (course_id) {
      const decodedCourseId = hashids.decode(course_id);
      if (decodedCourseId.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID"
        });
      }
      where.subject = {
        semester: {
          course_id: parseInt(decodedCourseId[0])
        }
      };
    }
    const assignments = await prisma.teacherSubjectAssignment.findMany({
      where,
      include: {
        teacher: {
          select: {
            user_id: true,
            username: true,
            email: true,
            full_name: true
          }
        },
        subject: {
          select: {
            subject_id: true,
            subject_code: true,
            subject_name: true,
            semester: {
              select: {
                semester_id: true,
                semester_name: true,
                semester_number: true,
                course: {
                  select: {
                    course_id: true,
                    course_name: true,
                    course_code: true
                  }
                }
              }
            }
          }
        },
        admin: {
          select: {
            user_id: true,
            username: true,
            full_name: true
          }
        }
      },
      orderBy: {
        assigned_at: 'desc'
      },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });
    const totalCount = await prisma.teacherSubjectAssignment.count({
      where
    });
    // Hash the response data
    const hashedAssignments = assignments.map(assignment => ({
      ...assignment,
      assignment_id: hashids.encode(assignment.assignment_id),
      teacher_id: hashids.encode(assignment.teacher_id),
      subject_id: hashids.encode(assignment.subject_id),
      assigned_by: hashids.encode(assignment.assigned_by),
      teacher: {
        ...assignment.teacher,
        user_id: hashids.encode(assignment.teacher.user_id)
      },
      subject: {
        ...assignment.subject,
        subject_id: hashids.encode(assignment.subject.subject_id),
        semester: {
          ...assignment.subject.semester,
          semester_id: hashids.encode(assignment.subject.semester.semester_id),
          course: {
            ...assignment.subject.semester.course,
            course_id: hashids.encode(assignment.subject.semester.course.course_id)
          }
        }
      },
      admin: {
        ...assignment.admin,
        user_id: hashids.encode(assignment.admin.user_id)
      }
    }));
    return res.status(200).json({
      success: true,
      message: "Assignments fetched successfully",
      data: hashedAssignments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error("Error in getAllAssignments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching assignments",
      error: error.message
    });
  }
};

// Get available subjects for assignment (subjects not assigned to a teacher)
const getAvailableSubjectsForTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.params;
    // Validate and decode teacher_id
    if (!teacher_id) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID is required"
      });
    }
    const decodedTeacherId = hashids.decode(teacher_id);
    if (decodedTeacherId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID"
      });
    }
    const parsedTeacherId = decodedTeacherId[0];
    // Get all subjects
    const allSubjects = await prisma.subject.findMany({
      include: {
        semester: {
          include: {
            course: {
              select: {
                course_id: true,
                course_name: true,
                course_code: true
              }
            }
          }
        }
      }
    });
    // Get already assigned subjects for this teacher
    const assignedSubjects = await prisma.teacherSubjectAssignment.findMany({
      where: {
        teacher_id: parseInt(parsedTeacherId),
        is_active: true
      },
      select: {
        subject_id: true
      }
    });
    const assignedSubjectIds = assignedSubjects.map(assignment => assignment.subject_id);
    const availableSubjects = allSubjects.filter(subject => !assignedSubjectIds.includes(subject.subject_id));
    // Hash the response data
    const hashedSubjects = availableSubjects.map(subject => ({
      ...subject,
      subject_id: hashids.encode(subject.subject_id),
      semester_id: hashids.encode(subject.semester_id),
      created_by: hashids.encode(subject.created_by),
      semester: {
        ...subject.semester,
        semester_id: hashids.encode(subject.semester.semester_id),
        course_id: hashids.encode(subject.semester.course_id),
        user_id: hashids.encode(subject.semester.user_id),
        course: {
          ...subject.semester.course,
          course_id: hashids.encode(subject.semester.course.course_id)
        }
      }
    }));
    return res.status(200).json({
      success: true,
      message: `Found ${hashedSubjects.length} available subjects for assignment`,
      data: hashedSubjects
    });
  } catch (error) {
    console.error("Error in getAvailableSubjectsForTeacher:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available subjects",
      error: error.message
    });
  }
};

// Get teachers available for subject assignment
const getAvailableTeachersForSubject = async (req, res) => {
  try {
    const { subject_id } = req.params;
    // Validate and decode subject_id
    if (!subject_id) {
      return res.status(400).json({
        success: false,
        message: "Subject ID is required"
      });
    }
    const decodedSubjectId = hashids.decode(subject_id);
    if (decodedSubjectId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID"
      });
    }
    const parsedSubjectId = decodedSubjectId[0];
    // Get all teachers (users with teacher role)
    const allTeachers = await prisma.user.findMany({
      where: {
        role: {
          name: "Teacher"
        }
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
      }
    });
    // Get already assigned teachers for this subject
    const assignedTeachers = await prisma.teacherSubjectAssignment.findMany({
      where: {
        subject_id: parseInt(parsedSubjectId),
        is_active: true
      },
      select: {
        teacher_id: true
      }
    });
    const assignedTeacherIds = assignedTeachers.map(assignment => assignment.teacher_id);
    const availableTeachers = allTeachers.filter(teacher => !assignedTeacherIds.includes(teacher.user_id));
    // Hash the response data
    const hashedTeachers = availableTeachers.map(teacher => ({
      ...teacher,
      user_id: hashids.encode(teacher.user_id)
    }));
    return res.status(200).json({
      success: true,
      message: `Found ${hashedTeachers.length} available teachers for assignment`,
      data: hashedTeachers
    });
  } catch (error) {
    console.error("Error in getAvailableTeachersForSubject:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching available teachers",
      error: error.message
    });
  }
};

// Bulk assignment - assign multiple teachers to multiple subjects
const bulkAssignTeachersToSubjects = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing."
      });
    }
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const { assignments } = req.body;
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Assignments array is required and cannot be empty"
      });
    }
    // Validate assignment structure
    const invalidAssignments = assignments.filter(
      assignment => !assignment.teacher_id || !assignment.subject_id
    );
    if (invalidAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Each assignment must have teacher_id and subject_id"
      });
    }
    // Decode all teacher_ids and subject_ids
    const decodedAssignments = [];
    for (const assignment of assignments) {
      const decodedTeacherId = hashids.decode(assignment.teacher_id);
      const decodedSubjectId = hashids.decode(assignment.subject_id);
      if (decodedTeacherId.length === 0 || decodedSubjectId.length === 0) {
        return res.status(400).json({
          success: false,
          message: "One or more IDs are invalid"
        });
      }
      decodedAssignments.push({
        teacher_id: parseInt(decodedTeacherId[0]),
        subject_id: parseInt(decodedSubjectId[0])
      });
    }

    let createdCount = 0;
    let reactivatedCount = 0;
    let skippedCount = 0;
    // 4️⃣ Process assignments (create, reactivate, or skip)
    await Promise.all(
      decodedAssignments.map(async ({ teacher_id, subject_id }) => {
        const existing = await prisma.teacherSubjectAssignment.findUnique({
          where: {
            teacher_id_subject_id: { teacher_id, subject_id }
          }
        });

        if (existing) {
          if (!existing.is_active) {
            // Reactivate previously removed record
            await prisma.teacherSubjectAssignment.update({
              where: { teacher_id_subject_id: { teacher_id, subject_id } },
              data: {
                is_active: true,
                assigned_by: req.user.user_id,
                assigned_at: new Date()
              }
            });
            reactivatedCount++;
          } else {
            // Already active → skip
            skippedCount++;
          }
        } else {
          // New record → create
          await prisma.teacherSubjectAssignment.create({
            data: {
              teacher_id,
              subject_id,
              assigned_by: req.user.user_id,
              is_active: true
            }
          });
          createdCount++;
        }
      })
    );
    return res.status(201).json({
      success: true,
      message: "Teacher-subject assignments processed successfully.",
      data: {
        created: createdCount,
        reactivated: reactivatedCount,
        skipped: skippedCount,
        total_processed: createdCount + reactivatedCount + skippedCount
      }
    });

  } catch (error) {
    console.error("Error in bulkAssignTeachersToSubjects:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while assigning teachers.",
      error: error.message
    });
  }
};

export {
  assignSubjectsToTeacher,
  removeSubjectFromTeacher,
  getTeacherAssignments,
  getSubjectTeachers,
  getAllAssignments,
  getAvailableSubjectsForTeacher,
  getAvailableTeachersForSubject,
  bulkAssignTeachersToSubjects
}