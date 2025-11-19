import { PrismaClient } from "@prisma/client";
import hashids from "../../services/hashids.js";

const prisma = new PrismaClient();

// Helper to decode hashed ID
const decodeId = (hashedId, name = "ID") => {
  const decoded = hashids.decode(hashedId);
  if (decoded.length === 0)
    throw new Error(`Invalid ${name}`);
  return decoded[0];
};

// Create new fee structure
const createFeeStructure = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { course_id: hashedCourseId, batch_year, total_amount, duration_years, total_semesters, categories } = req.body;
    //categories:  Array of { category_id, amount, per_semester }
    if (!hashedCourseId || !batch_year || !total_amount || !duration_years || !total_semesters || !categories) {
      return res.status(400).json({
        success: false,
        message: "Please provide course_id, batch_year, total_amount, duration_years, total_semesters, and categories",
      });
    }
    const course_id = decodeId(hashedCourseId, "course ID");
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const userId = req.user?.user_id;
    // Check course existence
    const course = await prisma.course.findUnique({
      where: {
        course_id
      }
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    // Check if fee structure already exists
    const existing = await prisma.fee_structure.findUnique({
      where: {
        course_id_batch_year: {
          course_id,
          batch_year: parseInt(batch_year)
        }
      },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Fee structure already exists for this batch",
      });
    }
    const feeStructure = await prisma.fee_structure.create({
      data: {
        course_id: parseInt(course_id),
        batch_year: parseInt(batch_year),
        total_amount: parseFloat(total_amount),
        duration_years: parseInt(duration_years),
        total_semesters: parseInt(total_semesters),
        created_by: userId,
        fee_structure_categories: {
          create: categories.map(cat => ({
            category_id: decodeId(cat.category_id, "category ID"),
            amount: parseFloat(cat.amount),
            per_semester: cat.per_semester !== false,
          })),
        },
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
        fee_structure_categories: {
          include: {
            category: {
              select: {
                category_id: true,
                category_name: true,
                description: true,
                created_by: true,
                is_active: true
              }
            }
          }
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        },
      },
    });

    // Hash IDs in response
    const hashedFeeStructure = {
      ...feeStructure,
      fee_structure_id: hashids.encode(feeStructure.fee_structure_id),
      course_id: hashids.encode(feeStructure.course_id),
      created_by: hashids.encode(feeStructure.created_by),
      course: {
        ...feeStructure.course,
        course_id: hashids.encode(feeStructure.course.course_id),
        created_by: hashids.encode(feeStructure.course.created_by),
      },
      fee_structure_categories: feeStructure.fee_structure_categories.map(cat => ({
        ...cat,
        id: hashids.encode(cat.id),
        fee_structure_id: hashids.encode(cat.fee_structure_id),
        category_id: hashids.encode(cat.category_id),
        category: {
          ...cat.category,
          category_id: hashids.encode(cat.category.category_id),
          created_by: hashids.encode(cat.category.created_by)
        }
      })),
      creator: {
        ...feeStructure.creator,
        user_id: hashids.encode(feeStructure.creator.user_id),
      },
    };
    return res.status(201).json({
      success: true,
      message: "Fee structure created successfully",
      data: hashedFeeStructure,
    });
  } catch (error) {
    console.error("Error creating fee structure:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create fee structure",
      error: error.message,
    });
  }
};

// Update fee structure
const updateFeeStructure = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    //herd id and id in route must be same , then the id value is stored in hashedId
    const { feeStructureId: hashedId } = req.params;
    if (!hashedId) {
      return res.status(400).json({
        success: false,
        message: "feeStructureId is missing.",
      });
    }
    const fee_structure_id = decodeId(hashedId, "fee structure ID");
    const { total_amount, duration_years, total_semesters, is_active, categories, } = req.body;
    const feeStructure = await prisma.fee_structure.findUnique({
      where: {
        fee_structure_id: parseInt(fee_structure_id)
      },
      include: {
        fee_structure_categories: true
      },
    });
    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found"
      });
    }
    const updateData = {};
    if (total_amount !== undefined) updateData.total_amount = parseFloat(total_amount);
    if (duration_years !== undefined) updateData.duration_years = parseInt(duration_years);
    if (total_semesters !== undefined) updateData.total_semesters = parseInt(total_semesters);
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update categories if provided
    if (categories && categories.length > 0) {
      await prisma.fee_structure_category.deleteMany({
        where: {
          fee_structure_id
        }
      });
      updateData.fee_structure_categories = {
        create: categories.map(cat => ({
          category_id: decodeId(cat.category_id, "category ID"),
          amount: parseFloat(cat.amount),
          per_semester: cat.per_semester !== false,
        })),
      };
    }
    const updated = await prisma.fee_structure.update({
      where: {
        fee_structure_id
      },
      data: updateData,
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
        fee_structure_categories: {
          include: {
            category: {
              select: {
                category_id: true,
                category_name: true,
                description: true,
                created_by: true,
                is_active: true
              }
            }
          }
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        },
      },
    });
    const hashedUpdated = {
      ...updated,
      fee_structure_id: hashids.encode(updated.fee_structure_id),
      course_id: hashids.encode(updated.course_id),
      created_by: hashids.encode(updated.created_by),
      course: {
        ...updated.course,
        course_id: hashids.encode(updated.course.course_id),
        created_by: hashids.encode(updated.course.created_by),
      },
      fee_structure_categories: updated.fee_structure_categories.map(cat => ({
        ...cat,
        id: hashids.encode(cat.id),
        fee_structure_id: hashids.encode(cat.fee_structure_id),
        category_id: hashids.encode(cat.category_id),
        category: {
          ...cat.category,
          category_id: hashids.encode(cat.category.category_id),
          created_by: hashids.encode(cat.category.created_by)
        }
      })),
      creator: {
        ...updated.creator,
        user_id: hashids.encode(updated.creator.user_id),
      },
    };
    return res.status(200).json({
      success: true,
      message: "Fee structure updated successfully",
      data: hashedUpdated,
    });
  } catch (error) {
    console.error("Error updating fee structure:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update fee structure",
      error: error.message,
    });
  }
};

// Get fee structure by ID
const getFeeStructureById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const { feeStructureId: hashedId } = req.params;
    if (!hashedId) {
      return res.status(400).json({
        success: false,
        message: "feeStructureId is missing.",
      });
    }
    const fee_structure_id = decodeId(hashedId, "fee structure ID");
    const feeStructure = await prisma.fee_structure.findUnique({
      where: { fee_structure_id },
      include: {
        course: {
          select: {
            course_id: true,
            course_code: true,
            course_name: true,
            college_id: true,
            description: true,
            created_by: true,
            image: true,
            college: true
          },
        },
        fee_structure_categories: {
          include: {
            category: {
              select: {
                category_id: true,
                category_name: true,
                description: true,
                created_by: true,
                is_active: true
              }
            }
          }
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        },
      },
    });

    if (!feeStructure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found"
      });
    }
    const hashed = {
      ...feeStructure,
      fee_structure_id: hashids.encode(feeStructure.fee_structure_id),
      course_id: hashids.encode(feeStructure.course_id),
      created_by: hashids.encode(feeStructure.created_by),
      course: {
        ...feeStructure.course,
        course_id: hashids.encode(feeStructure.course.course_id),
        created_by: hashids.encode(feeStructure.course.created_by),
      },
      fee_structure_categories: feeStructure.fee_structure_categories.map(cat => ({
        ...cat,
        id: hashids.encode(cat.id),
        fee_structure_id: hashids.encode(cat.fee_structure_id),
        category_id: hashids.encode(cat.category_id),
        category: {
          ...cat.category,
          category_id: hashids.encode(cat.category.category_id),
          created_by: hashids.encode(cat.category.created_by)
        }
      })),
      creator: {
        ...feeStructure.creator,
        user_id: hashids.encode(feeStructure.creator.user_id),
      },
    };
    return res.status(200).json({
      success: true,
      data: hashed
    });
  } catch (error) {
    console.error("Error fetching fee structure:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee structure",
      error: error.message,
    });
  }
};

// Get all fee structures
const getAllFeeStructures = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const feeStructures = await prisma.fee_structure.findMany({
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
        fee_structure_categories: {
          include: {
            category: {
              select: {
                category_id: true,
                category_name: true,
                description: true,
                created_by: true,
                is_active: true
              }
            }
          }
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        },
      },
      orderBy: [
        { course_id: "asc" },
        { batch_year: "desc" }
      ],
    });
    const hashedAll = feeStructures.map(fee => ({
      ...fee,
      fee_structure_id: hashids.encode(fee.fee_structure_id),
      course_id: hashids.encode(fee.course_id),
      created_by: hashids.encode(fee.created_by),
      course: {
        ...fee.course,
        course_id: hashids.encode(fee.course.course_id),
        created_by: hashids.encode(fee.course.created_by),
      },
      fee_structure_categories: fee.fee_structure_categories.map(cat => ({
        ...cat,
        id: hashids.encode(cat.id),
        fee_structure_id: hashids.encode(cat.fee_structure_id),
        category_id: hashids.encode(cat.category_id),
        category: {
          ...cat.category,
          category_id: hashids.encode(cat.category.category_id),
          created_by: hashids.encode(cat.category.created_by)
        }
      })),
      creator: {
        ...fee.creator,
        user_id: hashids.encode(fee.creator.user_id),
      },
    }));
    return res.status(200).json({
      success: true,
      data: hashedAll
    });
  } catch (error) {
    console.error("Error fetching fee structures:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee structures",
      error: error.message,
    });
  }
};

// Delete fee structure (soft delete)
const deleteFeeStructure = async (req, res) => {
  try {
     if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const { feeStructureId: hashedId } = req.params;
    const fee_structure_id = decodeId(hashedId, "fee structure ID");
    const feeStructure = await prisma.fee_structure.findUnique({
      where: { 
        fee_structure_id
       },
      include: {
         enrollments: true 
        },
    });
    if (!feeStructure) {
      return res.status(404).json({ 
        success: false,
         message: "Fee structure not found" 
        });
    }
    if (feeStructure.enrollments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete fee structure with active enrollments. Set to inactive instead.",
      });
    }
    await prisma.fee_structure.update({
      where: { 
        fee_structure_id 
      },
      data: {
         is_active: false 
        },
    });
    return res.status(200).json({
      success: true,
      message: "Fee structure deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting fee structure:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete fee structure",
      error: error.message,
    });
  }
};

// Get all fee structures for a specific course
const getFeeStructuresByCourse = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const { courseId: hashedCourseId } = req.params;
    if (!hashedCourseId) {
      return res.status(400).json({
        success: false,
        message: "Course ID is missing.",
      });
    }
    const course_id = decodeId(hashedCourseId, "course ID");
    const feeStructures = await prisma.fee_structure.findMany({
      where: {
        course_id: parseInt(course_id)
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
        fee_structure_categories: {
          include: {
            category: {
              select: {
                category_id: true,
                category_name: true,
                description: true,
                created_by: true,
                is_active: true
              }
            }
          }
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        },
      },
      orderBy: {
        batch_year: "desc"
      },
    });
    const hashedFeeStructures = feeStructures.map(fee => ({
      ...fee,
      fee_structure_id: hashids.encode(fee.fee_structure_id),
      course_id: hashids.encode(fee.course_id),
      created_by: hashids.encode(fee.created_by),
      course: {
        ...fee.course,
        course_id: hashids.encode(fee.course.course_id),
        created_by: hashids.encode(fee.course.created_by),
      },
      fee_structure_categories: fee.fee_structure_categories.map(cat => ({
        ...cat,
        id: hashids.encode(cat.id),
        fee_structure_id: hashids.encode(cat.fee_structure_id),
        category_id: hashids.encode(cat.category_id),
        category: {
          ...cat.category,
          category_id: hashids.encode(cat.category.category_id),
          created_by: hashids.encode(cat.category.created_by)
        }
      })),
      creator: {
        ...fee.creator,
        user_id: hashids.encode(fee.creator.user_id),
      },
    }));
    return res.status(200).json({
      success: true,
      data: hashedFeeStructures,
    });
  } catch (error) {
    console.error("Error fetching fee structures by course:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee structures",
      error: error.message,
    });
  }
};

// Get all active fee structures
const getActiveFeeStructures = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const feeStructures = await prisma.fee_structure.findMany({
      where: {
        is_active: true
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
            image: true,
            college: true
          }
        },
        fee_structure_categories: {
          include: {
            category: {
              select: {
                category_id: true,
                category_name: true,
                description: true,
                created_by: true,
                is_active: true
              }
            }
          }
        },
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        },
      },
      orderBy: [
        { course_id: "asc" },
        { batch_year: "desc" }
      ],
    });
   const hashedActive = feeStructures.map(fee => ({
      ...fee,
      fee_structure_id: hashids.encode(fee.fee_structure_id),
      course_id: hashids.encode(fee.course_id),
      created_by: hashids.encode(fee.created_by),
      course: {
        ...fee.course,
        course_id: hashids.encode(fee.course.course_id),
        created_by: hashids.encode(fee.course.created_by),
      },
      fee_structure_categories: fee.fee_structure_categories.map(cat => ({
        ...cat,
        id: hashids.encode(cat.id),
        fee_structure_id: hashids.encode(cat.fee_structure_id),
        category_id: hashids.encode(cat.category_id),
        category: {
          ...cat.category,
          category_id: hashids.encode(cat.category.category_id),
          created_by: hashids.encode(cat.category.created_by)
        }
      })),
      creator: {
        ...fee.creator,
        user_id: hashids.encode(fee.creator.user_id),
      },
    }));
    return res.status(200).json({
      success: true,
      data: hashedActive,
    });
  } catch (error) {
    console.error("Error fetching active fee structures:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch active fee structures",
      error: error.message,
    });
  }
};


export {
  createFeeStructure,
  updateFeeStructure,
  getFeeStructureById,
  getAllFeeStructures,
  deleteFeeStructure,
  getFeeStructuresByCourse,
  getActiveFeeStructures
};
