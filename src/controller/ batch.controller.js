import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";

const prisma = new PrismaClient();

// CREATE BATCH
const createBatch = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { course_id, batch_name, batch_year, start_date, end_date } = req.body;
    if (!course_id || !batch_name || !batch_year || !start_date) {
      return res.status(400).json({
        success: false,
        message: "Please provide course_id, batch_name, batch_year, and start_date",
      });
    }
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const courseId = hashids.decode(course_id);
    if (courseId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }
    const parsedCourseId = courseId[0]
    const course = await prisma.course.findUnique({
      where: {
        course_id: parseInt(parsedCourseId)
      },
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }
    // Check if batch already exists for this course and year
    const existingBatch = await prisma.batch.findFirst({
      where: {
        course_id: parseInt(parsedCourseId),
        batch_year: parseInt(batch_year)
      },
    });
    if (existingBatch) {
      return res.status(409).json({
        success: false,
        message: `Batch for year ${batch_year} already exists for this course`,
      });
    }
    const batch = await prisma.batch.create({
      data: {
        course_id: parseInt(parsedCourseId),
        batch_name,
        batch_year: parseInt(batch_year),
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        is_active: true,
        updated_at: new Date(),
      },
    });
    const hashedBatch = {
      ...batch,
      batch_id: hashids.encode(batch.batch_id),
      course_id: hashids.encode(batch.course_id),
      updated_at: batch.updated_at,
    };
    return res.status(201).json({
      success: true,
      message: "Batch created successfully",
      data: hashedBatch,
    });
  } catch (error) {
    console.error("Error in createBatch:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating batch",
      error: error.message,
    });
  }
};

// UPDATE BATCH
const updateBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch_id = hashids.decode(batchId);
    if (batch_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }
    const parsedBatchId = batch_id[0];
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { batch_name, start_date, end_date, is_active } = req.body;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const existingBatch = await prisma.batch.findUnique({
      where: {
        batch_id: parseInt(parsedBatchId)
      },
    });
    if (!existingBatch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }
    const updateData = {};
    if (batch_name) updateData.batch_name = batch_name;
    if (start_date) updateData.start_date = new Date(start_date);
    if (end_date) updateData.end_date = new Date(end_date);
    if (typeof is_active === "boolean") updateData.is_active = is_active;
    updateData.updated_at = new Date();
    
    const batch = await prisma.batch.update({
      where: {
        batch_id: parseInt(parsedBatchId)
      },
      data: updateData,
    });
    const hashedBatch = {
      ...batch,
      batch_id: hashids.encode(batch.batch_id),
      course_id: hashids.encode(batch.course_id),
    };
    return res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      data: hashedBatch,
    });
  } catch (error) {
    console.error("Error in updateBatch:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating batch",
      error: error.message,
    });
  }
};

// DELETE BATCH (Soft Delete)
const deleteBatch = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const { batchId } = req.params;
    // Decode Hash ID
    const batch_id = hashids.decode(batchId);
    if (batch_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }
    const parsedBatchId = batch_id[0];
    const existingBatch = await prisma.batch.findUnique({
      where: {
        batch_id: parseInt(parsedBatchId)
      },
    });
    if (!existingBatch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }
    // ✅ Check if already inactive
    if (!existingBatch.is_active) {
      return res.status(400).json({
        success: false,
        message: "This batch is already inactive",
        data: {
          batch_id: hashids.encode(existingBatch.batch_id),
          course_id: hashids.encode(existingBatch.course_id),
          batch_name: existingBatch.batch_name,
          batch_year: existingBatch.batch_year,
          is_active: existingBatch.is_active,
        },
      });
    }
    const batch = await prisma.batch.update({
      where: {
        batch_id: parseInt(parsedBatchId)
      },
      data: {
        is_active: false,
        updated_at: new Date()
      },
    });
    return res.status(200).json({
      success: true,
      message: "Batch marked as inactive",
      data: {
        ...batch,
        batch_id: hashids.encode(batch.batch_id),
        course_id: hashids.encode(batch.course_id),
      },
    });
  } catch (error) {
    console.error("Error in deleteBatch:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting batch",
      error: error.message,
    });
  }
};

// GET BATCH BY ID
const getBatchById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const { batchId } = req.params;
    const batch_id = hashids.decode(batchId);
    if (batch_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid batch ID",
      });
    }
    const parsedBatchId = batch_id[0];
    const batch = await prisma.batch.findUnique({
      where: {
        batch_id: parseInt(parsedBatchId)
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
        }
      },
    });
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }
    const hashedBatch = {
      ...batch,
      batch_id: hashids.encode(batch.batch_id),
      course_id: hashids.encode(batch.course_id),
      course: {
        ...batch.course,
        course_id: hashids.encode(batch.course.course_id),
        created_by: hashids.encode(batch.course.created_by),
      }
    };
    return res.status(200).json({
      success: true,
      data: hashedBatch,
    });
  } catch (error) {
    console.error("Error in getBatchById:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching batch",
      error: error.message,
    });
  }
};

// GET ALL BATCHES
const getAllBatches = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const batches = await prisma.batch.findMany({
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
        }
      },
      orderBy: {
        batch_year: "desc"
      },
    });
    const hashedBatches = batches.map(batch => ({
      ...batch,
      batch_id: hashids.encode(batch.batch_id),
      course_id: hashids.encode(batch.course_id),
      course: {
        ...batch.course,
        course_id: hashids.encode(batch.course.course_id),
        created_by: hashids.encode(batch.course.created_by),
      }
    }));
    return res.status(200).json({
      success: true,
      data: hashedBatches,
    });
  } catch (error) {
    console.error("Error in getAllBatches:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching batches",
      error: error.message,
    });
  }
};

// GET BATCHES BY COURSE
const getBatchesByCourse = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const { courseId } = req.params;
    const course_id = hashids.decode(courseId);
    if (course_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }
    const decodedCourseId = course_id[0]
    const batches = await prisma.batch.findMany({
      where: {
        course_id: parseInt(decodedCourseId)
      },
      orderBy: {
        batch_year: "desc"
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
        }
      },
    });
    const hashedBatches = batches.map(batch => ({
      ...batch,
      batch_id: hashids.encode(batch.batch_id),
      course_id: hashids.encode(batch.course_id),
      course: {
        ...batch.course,
        course_id: hashids.encode(batch.course.course_id),
        created_by: hashids.encode(batch.course.created_by),
      }
    }));
    return res.status(200).json({
      success: true,
      data: hashedBatches,
    });
  } catch (error) {
    console.error("Error in getBatchesByCourse:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching batches by course",
      error: error.message,
    });
  }
};

// GET ACTIVE BATCHES
const getActiveBatches = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const batches = await prisma.batch.findMany({
      where: {
        is_active: true
      },
      orderBy: {
        batch_year: "desc"
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
        }
      },
    });
    const hashedBatches = batches.map(batch => ({
      ...batch,
      batch_id: hashids.encode(batch.batch_id),
      course_id: hashids.encode(batch.course_id),
      course: {
        ...batch.course,
        course_id: hashids.encode(batch.course.course_id),
        created_by: hashids.encode(batch.course.created_by),
      }
    }));
    return res.status(200).json({
      success: true,
      data: hashedBatches,
    });
  } catch (error) {
    console.error("Error in getActiveBatches:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching active batches",
      error: error.message,
    });
  }
};

export {
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchById,
  getAllBatches,
  getBatchesByCourse,
  getActiveBatches,
};
