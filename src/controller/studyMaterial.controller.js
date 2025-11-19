import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";
import { cloudinary } from "../services/cloudinary.config.js";
import fs from "fs";

const prisma = new PrismaClient();

// Helper function to validate material relationships
const validateMaterialRelations = async (subject_id, chapter_id, topic_id) => {
  if (topic_id) {
    const topic = await prisma.topic.findUnique({
      where: { topic_id },
      include: { chapter: true }
    });

    if (!topic || topic.chapter_id !== chapter_id || topic.chapter.subject_id !== subject_id) {
      throw new Error('Topic does not belong to the specified chapter and subject');
    }
  }
  if (chapter_id) {
    const chapter = await prisma.chapter.findUnique({
      where: { chapter_id },
      include: { subjects: true }
    });

    if (!chapter || chapter.subject_id !== subject_id) {
      throw new Error('Chapter does not belong to the specified subject');
    }
  }
  const subject = await prisma.subject.findUnique({
    where: { subject_id },
    include: { semester: true }
  });
  if (!subject) {
    throw new Error('Subject not found');
  }
  return subject.semester.semester_id;
};

// Helper function to check if user can access material
const canAccessMaterial = async (userId, semesterId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: {
        role: true,
      },
    });
    if (!user) {
      return false;
    }
    const role = user.role.name.toLowerCase();
    // Superadmin, Admin, Coordinator, and Teacher can access all materials
    if (["superadmin", "admin", "coordinator", "teacher"].includes(role)) {
      return true;
    }
    // Only students need semester-based restriction
    if (role === "student") {
      const enrollment = await prisma.enrollment.findFirst({
        where: { student_id: userId },
      });
      if (!enrollment) {
        return false;
      }
      const materialSemester = await prisma.semester.findUnique({
        where: {
          semester_id: semesterId
        },
      });
      if (!materialSemester) {
        return false;
      }
      return materialSemester.semester_number <= enrollment.current_semester;
    }
    return false;
  } catch (error) {
    console.error("Error checking material access:", error);
    return false;
  }
};

// Helper function to hash study material response
const hashStudyMaterial = (material) => {
  return {
    ...material,
    material_id: hashids.encode(material.material_id),
    subject_id: material.subject_id ? hashids.encode(material.subject_id) : null,
    chapter_id: material.chapter_id ? hashids.encode(material.chapter_id) : null,
    topic_id: material.topic_id ? hashids.encode(material.topic_id) : null,
    semester_id: material.semester_id ? hashids.encode(material.semester_id) : null,
    material_type_id: material.material_type_id ? hashids.encode(material.material_type_id) : null,
    uploaded_by: material.uploaded_by ? hashids.encode(material.uploaded_by) : null,
    subjects: material.subjects ? {
      ...material.subjects,
      subject_id: hashids.encode(material.subjects.subject_id),
      semester_id: material.subjects.semester_id ? hashids.encode(material.subjects.semester_id) : null,
      created_by: material.subjects.created_by ? hashids.encode(material.subjects.created_by) : null
    } : null,
    chapter: material.chapter ? {
      ...material.chapter,
      chapter_id: hashids.encode(material.chapter.chapter_id),
      subject_id: material.chapter.subject_id ? hashids.encode(material.chapter.subject_id) : null,
      created_by: material.chapter.created_by ? hashids.encode(material.chapter.created_by) : null
    } : null,
    topic: material.topic ? {
      ...material.topic,
      topic_id: hashids.encode(material.topic.topic_id),
      chapter_id: material.topic.chapter_id ? hashids.encode(material.topic.chapter_id) : null,
      created_by: material.topic.created_by ? hashids.encode(material.topic.created_by) : null
    } : null,
    semester: material.semester ? {
      ...material.semester,
      semester_id: hashids.encode(material.semester.semester_id),
      course_id: material.semester.course_id ? hashids.encode(material.semester.course_id) : null,
      user_id: material.semester.user_id ? hashids.encode(material.semester.user_id) : null
    } : null,
    materialtype: material.materialtype ? {
      ...material.materialtype,
      material_type_id: hashids.encode(material.materialtype.material_type_id)
    } : null,
    user: material.user ? {
      ...material.user,
      user_id: material.user.user_id ? hashids.encode(material.user.user_id) : null
    } : null
  };
};

// Upload study material
const uploadStudyMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
    if (!req.body || !req.user) {
      return res.status(400).json({
        success: false,
        message: "Request body or user missing"
      });
    }
    const { title, description, subject_id, chapter_id, topic_id, material_type_id } = req.body;
    const userId = req.user.user_id;
    if (!title || !description || !subject_id || !material_type_id) {
      return res.status(400).json({
        success: false,
        message: "Title, description, material_type_id and subject_id are required"
      });
    }
    const subjectId = hashids.decode(subject_id);
    const chapterId = hashids.decode(chapter_id);
    const topicId = hashids.decode(topic_id);
    const materialTypeId = hashids.decode(material_type_id);
    if (subjectId.length === 0 || chapterId.length === 0 || topicId.length === 0 || materialTypeId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID, chapter id , topic id or material type id.",
      });
    }
    const parsedSubject_id = subjectId[0];
    const parsedChapter_id = chapterId[0];
    const parsedTopic_id = topicId[0];
    const parsedMaterialType_id = materialTypeId[0];
    // Validate relationships
    const semester_id = await validateMaterialRelations(
      parseInt(parsedSubject_id),
      chapter_id ? parseInt(parsedChapter_id) : null,
      topic_id ? parseInt(parsedTopic_id) : null
    );
    //file handling 
    let file_url = null;
    let file_type = null;
    let file_size = null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "MIS/study_materials",
          resource_type: "auto"
        });
        file_url = result.secure_url;
        file_type = req.file.mimetype;
        file_size = req.file.size;
        fs.unlinkSync(req.file.path); // remove local temp file
      } catch (uploadError) {
        console.error("Failed to upload document:", uploadError);
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
          success: false,
          message: "Failed to upload document",
        });
      }
    }
    // Create study material in database
    const studyMaterial = await prisma.studymaterial.create({
      data: {
        title,
        description,
        file_url,
        // file_url: `http://localhost:5000/uploads/study_materials/${req.file.filename}`,
        // file_url: `${req.protocol}://${req.get('host')}/uploads/study_materials/${req.file.filename}`,
        file_type,
        file_size,
        updated_at: new Date(),
        subjects: {
          connect: { subject_id: parseInt(parsedSubject_id) }
        },
        semester: {
          connect: { semester_id }
        },
        chapter: chapter_id ? {
          connect: { chapter_id: parseInt(parsedChapter_id) }
        } : undefined,
        topic: topic_id ? {
          connect: { topic_id: parseInt(parsedTopic_id) }
        } : undefined,
        materialtype: {
          connect: { material_type_id: parsedMaterialType_id ? parseInt(parsedMaterialType_id) : 1 }
        },
        user: {
          connect: { user_id: userId }
        }
      },
      include: {
        subjects: true,
        chapter: true,
        topic: true,
        semester: true,
        materialtype: true,
        user: {
          select: {
            username: true,
            email: true,
            full_name: true,
          }
        }
      }
    });
    const hashedMaterial = hashStudyMaterial(studyMaterial);
    return res.status(201).json({
      success: true,
      message: "Study material uploaded successfully",
      data: hashedMaterial
    });
  } catch (error) {
    console.error("Error uploading study material:", error);
    // If there's an error, delete the uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: "Error uploading study material",
      error: error.message

    });
  }
};

// Get all study materials
const getAllStudyMaterials = async (req, res) => {
  try {
    // Fetch all study materials from the database
    const studyMaterials = await prisma.studymaterial.findMany({
      include: {
        subjects: {
          select: {
            subject_id: true,
            subject_name: true,
            subject_code: true,
            semester_id: true,
            created_by: true
          }
        },
        chapter: {
          select: {
            chapter_id: true,
            chapter_name: true,
            subject_id: true,
            created_by: true
          }
        },
        topic: {
          select: {
            topic_id: true,
            topic_name: true,
            chapter_id: true,
            created_by: true
          }
        },
        semester: {
          select: {
            semester_id: true,
            semester_name: true,
            course_id: true,
            user_id: true
          }
        },
        materialtype: {
          select: {
            material_type_id: true,
            type_name: true
          }
        },
        user: {
          select: {
            user_id: true,
            full_name: true,
            username: true,
            email: true
          }
        }
      }
    });

    const hashedStudyMaterial = studyMaterials.map(
      material => hashStudyMaterial(material)
    )
    // Return the study materials in the response
    return res.status(200).json({
      success: true,
      message: "All study materials fetched successfully",
      data: hashedStudyMaterial,
    });
  } catch (error) {
    console.error("Error fetching study materials:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching study materials",
      error: error.message,
    });
  }
};

// Delete study material
const deleteStudyMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    if (!materialId) {
      return res.status(400).json({
        success: false,
        message: "Material ID is required"
      });
    }

    const material_id = hashids.decode(materialId);
    if (material_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid material id.",
      });
    }
    const parsedMaterial_id = material_id[0];
    const material = await prisma.studymaterial.findUnique({
      where: {
        material_id: parseInt(parsedMaterial_id)
      }
    });
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found"
      });
    }
    if (material.file_url) {
      try {
        // Extract public_id from the Cloudinary URL
        const publicId = material.file_url
          .split('/')
          .slice(-2)
          .join('/')
          .split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Error deleting file from cloudinary:", err);
      }
    }
    // Delete from database
    await prisma.studymaterial.delete({
      where: {
        material_id: parseInt(parsedMaterial_id)
      }
    });
    return res.status(200).json({
      success: true,
      message: "Study material deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting study material:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting study material"
    });
  }
};

// Update study material
const updateStudyMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    if (!materialId) {
      return res.status(400).json({
        success: false,
        message: "Material ID is required"
      });
    }
    const material_id = hashids.decode(materialId);
    if (material_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid material id.",
      });
    }
    const parsedMaterial_id = material_id[0];
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing"
      });
    }
    const { title, description, subject_id, chapter_id, topic_id, material_type_id } = req.body;
    const subjectId = hashids.decode(subject_id);
    const chapterId = hashids.decode(chapter_id);
    const topicId = hashids.decode(topic_id);
    const materialTypeId = hashids.decode(material_type_id);
    if (subjectId.length === 0 || chapterId.length === 0 || topicId.length === 0 || materialTypeId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID, chapter id , topic id or material type id.",
      });
    }
    const parsedSubject_id = subjectId[0];
    const parsedChapter_id = chapterId[0];
    const parsedTopic_id = topicId[0];
    const parsedMaterialType_id = materialTypeId[0];
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Check if the study material exists
    const material = await prisma.studymaterial.findUnique({
      where: {
        material_id: parseInt(parsedMaterial_id)
      },
    });
    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Study material not found",
      });
    }
    //file handling
    let file_url = material.file_url;
    let file_type = material.file_type;
    let file_size = material.file_size;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "MIS/study_materials",
          resource_type: "auto"
        });
        file_url = result.secure_url;
        file_type = req.file.mimetype;
        file_size = req.file.size;
        fs.unlinkSync(req.file.path); // remove local temp file
        // Delete old file from Cloudinary if it exists
        if (material.file_url) {
          try {
            const publicId = material.file_url
              .split('/')
              .slice(-2)
              .join('/')
              .split('.')[0]; // e.g., "MIS/study_materials/abcd1234"
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error("Error deleting old file from Cloudinary:", err);
          }
        }
      } catch (uploadError) {
        console.error("Failed to upload document:", uploadError);
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
          success: false,
          message: "Failed to upload document",
        });
      }
    }
    const updateData = {
      updated_at: new Date()
    };
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (file_url) updateData.file_url = file_url;
    if (file_type) updateData.file_type = file_type;
    if (file_size) updateData.file_size = file_size;
    if (parsedSubject_id) updateData.subject_id = parseInt(parsedSubject_id);
    if (parsedChapter_id) updateData.chapter_id = parseInt(parsedChapter_id);
    if (parsedTopic_id) updateData.topic_id = parseInt(parsedTopic_id);
    if (materialTypeId) updateData.material_type_id = parseInt(materialTypeId);
    // Update the study material in the database
    const updatedMaterial = await prisma.studymaterial.update({
      where: {
        material_id: parseInt(parsedMaterial_id)
      },
      data: updateData,
      include: {
        subjects: true,
        chapter: true,
        topic: true,
        semester: true,
        materialtype: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            full_name: true,
          },
        },
      },
    });
    const hashedMaterial = hashStudyMaterial(updatedMaterial);
    return res.status(200).json({
      success: true,
      message: "Study material updated successfully",
      data: hashedMaterial,
    });
  } catch (error) {
    console.error("Error updating study material:", error);
    // If there's an error, delete the uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: "Error updating study material",
      error: error.message,
    });
  }
};

// Get study materials by subject
const getStudyMaterialsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Validate and decode subject_id
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Subject ID is required"
      });
    }
    const user_id = req.user.user_id;
    const subject_id = hashids.decode(subjectId);
    if (subject_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID.",
      });
    }
    const parsedSubject_id = subject_id[0];
    // Get all materials for the subject
    const materials = await prisma.studymaterial.findMany({
      where: {
        subject_id: parseInt(parsedSubject_id)
      },
      include: {
        subjects: true,
        chapter: true,
        topic: true,
        semester: true,
        materialtype: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            full_name: true,
          }
        }
      }
    });
    // Filter materials based on user's semester access
    const accessibleMaterials = await Promise.all(
      materials.map(async (material) => {
        const canAccess = await canAccessMaterial(user_id, material.semester_id);
        return canAccess ? material : null;
      })
    );
    // Remove null values (materials user can't access)
    const filteredMaterials = accessibleMaterials
      .filter(material => material !== null)
      .map(material => hashStudyMaterial(material));
    return res.status(200).json({
      success: true,
      message: `Found ${filteredMaterials.length} study materials for subject`,
      data: filteredMaterials
    });
  } catch (error) {
    console.error("Error getting study materials:", error);
    res.status(500).json({
      success: false,
      message: "Error getting study materials",
      error: error.message
    });
  }
};

// Get study materials by chapter
const getStudyMaterialsByChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Validate and decode chapter_id
    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: "Chapter ID is required"
      });
    }
    const user_id = req.user.user_id;
    const chapter_id = hashids.decode(chapterId);
    if (chapter_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid chapter id.",
      });
    }
    const parsedChapter_id = chapter_id[0];
    // Get all materials for the chapter
    const materials = await prisma.studymaterial.findMany({
      where: {
        chapter_id: parseInt(parsedChapter_id)
      },
      include: {
        subjects: true,
        chapter: true,
        topic: true,
        semester: true,
        materialtype: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            full_name: true,
          }
        }
      }
    });
    // Filter materials based on user's semester access
    const accessibleMaterials = await Promise.all(
      materials.map(async (material) => {
        const canAccess = await canAccessMaterial(user_id, material.semester_id);
        return canAccess ? material : null;
      })
    );
    // Remove null values (materials user can't access)
    const filteredMaterials = accessibleMaterials
      .filter(material => material !== null)
      .map(material => hashStudyMaterial(material));
    return res.status(200).json({
      success: true,
      message: `Found ${filteredMaterials.length} chapter-only study materials`,
      data: filteredMaterials
    });
  } catch (error) {
    console.error("Error getting study materials:", error);
    res.status(500).json({
      success: false,
      message: "Error getting study materials",
      error: error.message
    });
  }
};

// Get study materials by topic
const getStudyMaterialsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Validate and decode topic_id
    if (!topicId) {
      return res.status(400).json({
        success: false,
        message: "Topic ID is required"
      });
    }
    const user_id = req.user.user_id;
    const topic_id = hashids.decode(topicId);
    if (topic_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid topic id.",
      });
    }
    const parsedTopic_id = topic_id[0];
    // Get all materials for the topic
    const materials = await prisma.studymaterial.findMany({
      where: {
        topic_id: parseInt(parsedTopic_id)
      },
      include: {
        subjects: true,
        chapter: true,
        topic: true,
        semester: true,
        materialtype: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            full_name: true,
          }
        }
      }
    });
    // Filter materials based on user's semester access
    const accessibleMaterials = await Promise.all(
      materials.map(async (material) => {
        const canAccess = await canAccessMaterial(user_id, material.semester_id);
        return canAccess ? material : null;
      })
    );
    // Remove null values (materials user can't access)
    const filteredMaterials = accessibleMaterials
      .filter(material => material !== null)
      .map(material => hashStudyMaterial(material));
    return res.status(200).json({
      success: true,
      message: `Found ${filteredMaterials.length} study materials for topic`,
      data: filteredMaterials
    });
  } catch (error) {
    console.error("Error getting study materials:", error);
    res.status(500).json({
      success: false,
      message: "Error getting study materials",
      error: error.message
    });
  }
};

// Add this new controller function
const getChapterOnlyMaterials = async (req, res) => {
  try {
    const { chapterId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Validate and decode chapter_id
    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: "Chapter ID is required"
      });
    }
    const chapter_id = hashids.decode(chapterId);
    if (chapter_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid chapter ID",
      });
    }
    const parsedChapter_id = chapter_id[0]
    const user_id = req.user.user_id;
    // Get materials that have chapter_id but no topic_id
    const materials = await prisma.studymaterial.findMany({
      where: {
        chapter_id: parseInt(parsedChapter_id),
        topic_id: null
      },
      include: {
        subjects: true,
        chapter: true,
        materialtype: true,
        user: {
          select: {
            username: true,
            email: true,
            full_name: true,
          }
        }
      }
    });
    // Filter materials based on user's semester access
    const accessibleMaterials = await Promise.all(
      materials.map(async (material) => {
        const canAccess = await canAccessMaterial(user_id, material.semester_id);
        return canAccess ? material : null;
      })
    );
    // Remove null values and hash IDs
    const filteredMaterials = accessibleMaterials
      .filter(material => material !== null)
      .map(material => hashStudyMaterial(material));
    return res.status(200).json({
      success: true,
      message: `Found ${filteredMaterials.length} study materials for chapter`,
      data: filteredMaterials
    });
  } catch (error) {
    console.error("Error getting study materials:", error);
    res.status(500).json({
      success: false,
      message: "Error getting study materials",
      error: error.message
    });
  }
};

// Add this new controller function
const getSubjectOnlyMaterials = async (req, res) => {
  try {
    const { subjectId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Validate and decode subject_id
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Subject ID is required"
      });
    }
    const subject_id = hashids.decode(subjectId);
    if (subject_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester ID",
      });
    }
    const parsedSubject_id = subject_id[0]
    const user_id = req.user.user_id;
    // Get materials that only have subject_id (no chapter_id or topic_id)
    const materials = await prisma.studymaterial.findMany({
      where: {
        subject_id: parseInt(parsedSubject_id),
        chapter_id: null,
        topic_id: null
      },
      include: {
        subjects: true,
        semester: true,
        materialtype: true,
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
            full_name: true,
          }
        }
      }
    });
    // Filter materials based on user's semester access
    const accessibleMaterials = await Promise.all(
      materials.map(async (material) => {
        const canAccess = await canAccessMaterial(user_id, material.semester_id);
        return canAccess ? material : null;
      })
    );
    // Remove null values and hash IDs
    const filteredMaterials = accessibleMaterials
      .filter(material => material !== null)
      .map(material => hashStudyMaterial(material));

    return res.status(200).json({
      success: true,
      message: `Found ${filteredMaterials.length} subject-only study materials`,
      data: filteredMaterials
    });
  } catch (error) {
    console.error("Error getting subject materials:", error);
    return res.status(500).json({
      success: false,
      message: "Error getting subject materials",
      error: error.message
    });
  }
};

export {
  uploadStudyMaterial,
  getAllStudyMaterials,
  getStudyMaterialsBySubject,
  getStudyMaterialsByChapter,
  getStudyMaterialsByTopic,
  deleteStudyMaterial,
  updateStudyMaterial,
  getChapterOnlyMaterials,
  getSubjectOnlyMaterials
}