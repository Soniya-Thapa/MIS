import { PrismaClient } from "@prisma/client";
import { cloudinary } from "../services/cloudinary.config.js";
import hashids from "../services/hashids.js";
import fs from "fs";

const prisma = new PrismaClient();

const createSubject = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const semester_id = hashids.decode(semesterId);
    if (semester_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester ID",
      });
    }
    const parsedSemester_id = semester_id[0];
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { subject_name, subject_code, description } = req.body;
    if (!subject_name || !subject_code || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide subject_name, subject_code and description.",
      });
    }
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const userId = req.user.user_id; // Get the authenticated user's ID
    // Check semester existence
    const semester = await prisma.semester.findUnique({
      where: {
        semester_id: parseInt(parsedSemester_id)
      },
    });
    if (!semester) {
      return res.status(404).json({
        success: false,
        message: "Semester not found",
      });
    }
    let image = null
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "MIS/subject_image",
          resource_type: "auto",
        });
        image = result.secure_url;
      } catch (uploadError) {
        console.error("Failed to upload image:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image",
        });
      }
    }
    // Create subject
    const subject = await prisma.subject.create({
      data: {
        subject_name,
        subject_code,
        description,
        image,
        semester: { connect: { semester_id: parseInt(parsedSemester_id) } },
        creator: { connect: { user_id: userId } },
        updated_at: new Date(),
      },
      include: {
        semester: {
          select: {
            semester_id: true,
            course_id: true,
            semester_number: true,
            semester_name: true,
            user_id: true,
            course: { // ✅ nested select
              select: {
                course_id: true,
                course_name: true,
              },
            },
          },
        },
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
    const hashedSubject = {
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
          course_id: hashids.encode(subject.semester.course.course_id),

        }
      }
    };
    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: hashedSubject,
    });
  } catch (error) {
    console.error("Error in createSubject:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating subject",
      error: error.message,
    });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject_id = hashids.decode(subjectId);
    if (subject_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }
    const parsedSubject_id = subject_id[0];
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { subject_name, subject_code, description } = req.body;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const existingSubject = await prisma.subject.findUnique({
      where: { subject_id: parsedSubject_id },
    });

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }
  
    let image = existingSubject.image
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "MIS/subject_image",
          resource_type: "auto",
        });
        image = result.secure_url;
        fs.unlinkSync(req.file.path);
        // Delete old image if it exists
        if (existingSubject.image) {
          try {
            // Extract public_id from the Cloudinary URL
            const publicId = existingSubject.image
              .split('/')
              .slice(-2)
              .join('/')
              .split('.')[0]; // e.g., "MIS/course_image/f9xayve8hojnpqtbjl0z"
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error('Error deleting old Cloudinary image:', err);
          }
        }
      } catch (uploadError) {
        console.error("Failed to upload image:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image",
        });
      }
    }
    const updateData = {};
    if (subject_name) updateData.subject_name = subject_name;
    if (subject_code) updateData.subject_code = parseInt(subject_code);
    if (description) updateData.description = description;
    if (image) updateData.image = image;
    updateData.updated_at = new Date();

    const subject = await prisma.subject.update({
      where: {
        subject_id: parseInt(parsedSubject_id)
      },
      data: updateData,
      include: {
        semester: {
          select: {
            semester_id: true,
            course_id: true,
            semester_number: true,
            semester_name: true,
            user_id: true,
            course: { // ✅ nested select
              select: {
                course_id: true,
                course_name: true,
              },
            },
          },
        },
        creator: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
    const hashedSubject = {
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
          course_id: hashids.encode(subject.semester.course.course_id),

        }
      }
    };
    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: hashedSubject,
    });
  } catch (error) {
    console.error("Error in updateSubject:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: "Error updating subject",
      error: error.message,
    });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject_id = hashids.decode(subjectId);
    if (subject_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }
    const parsedSubject_id = subject_id[0];

    const existingSubject = await prisma.subject.findUnique({
      where: { subject_id: parsedSubject_id },
    });

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (existingSubject.image) {
      try {
        // Extract public_id from the Cloudinary URL
        const publicId = existingSubject.image
          .split('/')
          .slice(-2)
          .join('/')
          .split('.')[0]; // e.g., "MIS/course_image/f9xayve8hojnpqtbjl0z"
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Error deleting old Cloudinary image:', err);
      }
    }

    await prisma.subject.delete({
      where: {
        subject_id: parseInt(parsedSubject_id)
      },
    });
    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteSubject:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting subject",
      error: error.message,
    });
  }
};

const getSubjectsBySemester = async (req, res) => {
  try {
    const { semesterId } = req.params;
    const semester_id = hashids.decode(semesterId);
    if (semester_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester ID",
      });
    }
    const parsedSemester_id = semester_id[0];
    const subjects = await prisma.subject.findMany({
      where: {
        semester_id: parseInt(parsedSemester_id)
      },
      include: {
        chapter: {
          include: { topic: true },
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            username: true,
          },
        },
      },
    });
    if (!subjects.length) {
      return res.status(404).json({
        success: false,
        message: "Subjects not found"
      });
    }
    const hashedSubjects = subjects.map((subject) => ({
      ...subject,
      subject_id: hashids.encode(subject.subject_id),
      semester_id: hashids.encode(subject.semester_id),
      created_by: hashids.encode(subject.created_by),
      creator: {
        ...subject.creator,
        user_id: hashids.encode(subject.creator.user_id)
      }
    }));
    return res.status(200).json({
      success: true,
      data: hashedSubjects,
    });
  } catch (error) {
    console.error("Error in getSubjects:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subjects",
      error: error.message,
    });
  }
};

const getSubjectById = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject_id = hashids.decode(subjectId);
    if (subject_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }
    const parsedSubject_id = subject_id[0];
    const subject = await prisma.subject.findUnique({
      where: {
        subject_id: parseInt(parsedSubject_id)
      },
      include: {
        semester: {
          select: {
            semester_id: true,
            course_id: true,
            semester_number: true,
            semester_name: true,
            user_id: true,
            course: { // ✅ nested select
              select: {
                course_id: true,
                course_code: true,
                course_name: true,
                college_id: true,
                description: true,
                created_by: true,
                image: true
              },
            },
          }
        },
        chapter: {
          include: { topic: true },
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true,
            username: true,
          },
        },
      },
    });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }
    const hashedSubject = {
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
          course_id: hashids.encode(subject.semester.course.course_id),
          created_by: hashids.encode(subject.semester.course.created_by),
        }
      }
    };
    return res.status(200).json({
      success: true,
      data: hashedSubject,
    });
  } catch (error) {
    console.error("Error in getSubjectById:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subject",
      error: error.message,
    });
  }
};

const getAllSubjects = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        semester: {
          select: {
            semester_id: true,
            course_id: true,
            semester_number: true,
            semester_name: true,
            user_id: true,
            course: { // ✅ nested select
              select: {
                course_id: true,
                course_code: true,
                course_name: true,
                college_id: true,
                description: true,
                created_by: true,
                image: true
              },
            },
          }
        },
        chapter: true,
      },
    });
    // Map the course_id to the subject level for easier access in the frontend
    const subjectsWithCourseId = subjects.map((subject) => ({
      ...subject,
      course_id: hashids.encode(subject.semester.course.course_id), // Add course_id to the subject object
    }));
    const hashedSubjects = subjectsWithCourseId.map((subject) => ({
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
          course_id: hashids.encode(subject.semester.course.course_id),
          created_by: hashids.encode(subject.semester.course.created_by),
        }
      }
    }));

    return res.status(200).json({
      success: true,
      count: hashedSubjects.length,
      data: hashedSubjects,
    });
  } catch (error) {
    console.error("Error in getAllSubjects:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subjects",
      error: error.message,
    });
  }
};

const getSubjectTitles = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { subjectIds } = req.body; // Expect an array of course IDs in the request body
    if (!subjectIds) {
      return res.status(400).json({
        success: false,
        message: "SubjectIds are required"
      });
    }
    if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty subjectIds array",
      });
    }
    // Decode each hashed ID
    const decodedIds = subjectIds
      .map((id) => hashids.decode(id)[0])
      .filter((id) => id);

    if (decodedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject IDs",
      });
    }
    // Fetch subject titles for the given course IDs
    const subjectTitles = await prisma.subject.findMany({
      where: {
        subject_id: {
          in: decodedIds
        },
      },
      select: {
        subject_id: true,
        subject_name: true,
      },
    });
    // Re-encode the subject IDs before sending back
    const encodedResult = subjectTitles.map((subject) => ({
      subject_id: hashids.encode(subject.subject_id),
      subject_name: subject.subject_name,
    }));
    return res.status(200).json({
      success: true,
      data: encodedResult,
    });
  } catch (error) {
    console.error("Error in getSubjectTitles:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching subject titles",
      error: error.message,
    });
  }
};

export {
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectsBySemester,
  getSubjectById,
  getAllSubjects,
  getSubjectTitles
}