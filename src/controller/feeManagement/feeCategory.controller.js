import { PrismaClient } from "@prisma/client";
import hashids from "../../services/hashids.js";

const prisma = new PrismaClient();

// Helper to decode hashed ID
const decodeId = (hashedId, name = "ID") => {
  const decoded = hashids.decode(hashedId);
  if (decoded.length === 0) throw new Error(`Invalid ${name}`);
  return decoded[0];
}

// CREATE a fee category
const createFeeCategory = async (req, res) => {
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
    const { category_name, description } = req.body;
    const userId = req.user?.user_id;
    if (!category_name || !userId) {
      return res.status(400).json({
        success: false,
        message: "Category name and authenticated user required"
      });
    }
    // Check for duplicate category
    const existingCategory = await prisma.fee_category.findFirst({
      where: {
        category_name
      },
    });
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: `Fee category '${category_name}' already exists.`,
      });
    }
    const category = await prisma.fee_category.create({
      data: {
        category_name,
        description,
        created_by: userId
      },
      include: {
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        }
      }
    });
    const hashed = {
      ...category,
      category_id: hashids.encode(category.category_id),
      created_by: hashids.encode(category.created_by),
      creator: {
        ...category.creator,
        user_id: hashids.encode(category.creator.user_id)
      }
    };
    return res.status(201).json({
      success: true,
      message: "Fee category created successfully",
      data: hashed
    });
  } catch (error) {
    console.error("Error creating fee category:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create fee category",
      error: error.message
    });
  }
};

// UPDATE a fee category
const updateFeeCategory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const { id: hashedId } = req.params;
    const category_id = decodeId(hashedId, "category ID");
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { category_name, description, is_active } = req.body;
    const category = await prisma.fee_category.findUnique({
      where: {
        category_id
      }
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Fee category not found"
      });
    }
    const updateData = {};
    if (category_name) updateData.category_name = category_name;
    if (description) updateData.description = description;
    if (typeof is_active === "boolean") updateData.is_active = is_active;

    const updated = await prisma.fee_category.update({
      where: {
        category_id
      },
      data: updateData
    });
    const hashed = {
      ...updated,
      category_id: hashids.encode(updated.category_id),
      created_by: hashids.encode(updated.created_by)
    };
    return res.status(200).json({
      success: true,
      message: "Fee category updated successfully",
      data: hashed
    });
  } catch (error) {
    console.error("Error updating fee category:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update fee category",
      error: error.message
    });
  }
};

// DELETE a fee category (soft delete)
const deleteFeeCategory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const { id: hashedId } = req.params;
    const category_id = decodeId(hashedId, "category ID");
    const category = await prisma.fee_category.findUnique({
      where: {
        category_id
      }
    });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Fee category not found"
      });
    }
    //soft delete
    await prisma.fee_category.update({
      where: {
        category_id
      },
      data: {
        is_active: false
      }
    });
    // // Hard delete
    // await prisma.fee_category.delete({
    //   where: { category_id }
    // });
    return res.status(200).json({
      success: true,
      message: "Fee category deactivated successfully"
    });
  } catch (error) {
    console.error("Error deleting fee category:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete fee category",
      error: error.message
    });
  }
};

// GET all fee categories
const getAllFeeCategories = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const categories = await prisma.fee_category.findMany({
      include: {
        creator: {
          select: {
            user_id: true,
            full_name: true,
            email: true
          }
        }
      },
      orderBy: {
        category_name: "asc"
      },
    });
    const hashed = categories.map(cat => ({
      ...cat,
      category_id: hashids.encode(cat.category_id),
      created_by: hashids.encode(cat.created_by),
      creator: cat.creator ? {
        ...cat.creator,
        user_id: hashids.encode(cat.creator.user_id)
      } : null,
    }));
    return res.status(200).json({
      success: true,
      data: hashed
    });
  } catch (error) {
    console.error("Error fetching fee categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch fee categories",
      error: error.message
    });
  }
};

export {
  getAllFeeCategories,
  createFeeCategory,
  updateFeeCategory,
  deleteFeeCategory
};
