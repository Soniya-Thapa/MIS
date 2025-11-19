import { PrismaClient } from "@prisma/client";
import { cloudinary } from "../services/cloudinary.config.js";
import hashids from "../services/hashids.js";
import fs from 'fs'; //built-in Node.js module.

const prisma = new PrismaClient();

const createCourse = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { course_code, course_name, description } = req.body;
    if (!course_code || !course_name || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide course_code, course_name and description."
      })
    }
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    let image = null
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "MIS/course_image",
          resource_type: "auto",
        });
        image = result.secure_url;
        fs.unlinkSync(req.file.path); // remove local temp file
      } catch (uploadError) {
        console.error("Failed to upload image:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image",
        });
      }
    }
    const course = await prisma.course.create({
      data: {
        course_code,
        course_name,
        description,
        image,
        created_by: req.user.user_id
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
    const hashedCourse = {
      ...course,
      course_id: hashids.encode(course.course_id),
      created_by: hashids.encode(course.created_by)
    }
    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: hashedCourse
    });
  } catch (error) {
    console.error("Error in createCourse:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: "Error creating course",
      error: error.message
    });
  }
};

const updateCourse = async (req, res) => {
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
    const { course_code, course_name, description } = req.body;
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: {
        course_id: parseInt(parsedCourse_id)
      }
    });
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    let image = existingCourse.image
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "MIS/course_image",
          resource_type: "auto",
        });
        image = result.secure_url;
        fs.unlinkSync(req.file.path); // remove local temp file
        // Delete old image if it exists
        if (existingCourse.image) {
          try {
            // Extract public_id from the Cloudinary URL
            const publicId = existingCourse.image
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
        // If there's an error, delete the uploaded file
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image",
        });
      }
    }
    const updateData = {
      course_code,
      course_name,
      description,
      image,
      updated_at: new Date(),
    };
    const course = await prisma.course.update({
      where: {
        course_id: parseInt(parsedCourse_id)
      },
      data: updateData,
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
    const hashedCourse = {
      ...course,
      course_id: hashids.encode(course.course_id),
      created_by: hashids.encode(course.created_by)
    }
    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: hashedCourse
    });
  } catch (error) {
    console.error("Error in updateCourse:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: "Error updating course",
      error: error.message
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course_id = hashids.decode(courseId);
    if (course_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const parsedCourse_id = course_id[0]
    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: {
        course_id: parseInt(parsedCourse_id)
      }
    });
    if (!existingCourse) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    if (existingCourse.image) {
      try {
        // Extract public_id from the Cloudinary URL
        const publicId = existingCourse.image
          .split('/')
          .slice(-2)
          .join('/')
          .split('.')[0]; // e.g., "MIS/course_image/f9xayve8hojnpqtbjl0z"
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Error deleting old Cloudinary image:', err);
      }
    }
    await prisma.course.delete({
      where: {
        course_id: parseInt(parsedCourse_id)
      }
    });
    res.status(200).json({
      success: true,
      message: "Course deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteCourse:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting course",
      error: error.message
    });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        semesters: {
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
        }
      }
    });
    const hashedCourse = courses.map(course => ({
      ...course,
      course_id: hashids.encode(course.course_id),
      created_by: hashids.encode(course.created_by)
    }))
    return res.status(200).json({
      success: true,
      count: hashedCourse.length,
      data: hashedCourse
    });
  } catch (error) {
    console.error("Error in getAllCourses:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching courses",
      error: error.message
    });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course_id = hashids.decode(courseId);
    if (course_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const parsedCourse_id = course_id[0]
    const course = await prisma.course.findUnique({
      where: {
        course_id: parseInt(parsedCourse_id)
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        },
        semesters: {
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
        }
      }
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    const hashedCourse = {
      ...course,
      course_id: hashids.encode(course.course_id),
      created_by: hashids.encode(course.created_by)
    }
    return res.status(200).json({
      success: true,
      data: hashedCourse
    });
  } catch (error) {
    console.error("Error in getCourseById:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching course",
      error: error.message
    });
  }
};

const getCourseTitles = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { courseIds } = req.body; // Expect an array of course IDs in the request body
    if (!courseIds) {
      return res.status(400).json({
        success: false,
        message: "CourseIds are required"
      });
    }
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty courseIds array",
      });
    }
    // Decode each hashed ID
    const decodedIds = courseIds
      .map(id => hashids.decode(id)[0])
      .filter(id => id); // remove any undefined/null
    if (decodedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course IDs",
      });
    }
    // Fetch course titles for the given course IDs
    const courseTitles = await prisma.course.findMany({
      where: {
        course_id: {
          in: decodedIds, // Use the `in` operator to filter by multiple IDs
        },
      },
      select: {
        course_id: true, // Include course_id for reference
        course_name: true, // Fetch only the course_name
      },
    });
    // Re-encode the course IDs before sending back
    const encodedResult = courseTitles.map(course => ({
      course_id: hashids.encode(course.course_id),
      course_name: course.course_name,
    }));
    return res.status(200).json({
      success: true,
      data: encodedResult,
    });
  } catch (error) {
    console.error("Error in getCourseTitles:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching course titles",
      error: error.message,
    });
  }
};

export {
  createCourse,
  updateCourse,
  deleteCourse,
  getAllCourses,
  getCourseById,
  getCourseTitles
}