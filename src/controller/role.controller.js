import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";
const prisma = new PrismaClient();

const createRole = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { name } = req.body;
    // Validate authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      })
    }
    // Validate input
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Role name is required.",
      });
    }  // Check for duplicate
    const existingRole = await prisma.role.findFirst({
      where: { name: name.trim() },
    });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: "Role name already exists.",
      });
    }
    const role = await prisma.role.create({
      data: {
        name: name.trim()
      },
    });
    const hashedRole = {
      ...role,
      role_id: hashids.encode(role.role_id),
    };
    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: hashedRole,
    });
  } catch (error) {
    console.log("Error in the createRole controller:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating role",
      error: error.message,

    })
  }
}

const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const decodedId = hashids.decode(roleId);
    if (decodedId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }
    const parsedRoleId = decodedId[0];
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { name } = req.body;
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    // Validate
    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Role name is required.",
      });
    }
    const existingRole = await prisma.role.findUnique({
      where: { role_id: parsedRoleId },
    });
    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }
    const updatedRole = await prisma.role.update({
      where: { role_id: parsedRoleId },
      data: { name: name.trim() },
    });
    const hashedRole = {
      ...updatedRole,
      role_id: hashids.encode(updatedRole.role_id),
    };
    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: hashedRole,
    });
  } catch (error) {
    console.error("Error in the update role controller:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating role",
      error: error.message,
    })
  }
}

const getAllRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      select: {
        role_id: true,
        name: true
      }
    });
    const hashedRoles = roles.map((role) => ({
      ...role,
      role_id: hashids.encode(role.role_id),
    }));
    return res.status(200).json({
      success: true,
      data: hashedRoles,
    });
  } catch (error) {
    console.error("Error in the getAllRoles controller:", error);
    return res.status(500).json({
      success: false,
      message: "Error in fetching roles",
      error: error.message,
    })
  }
}

const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const decodedId = hashids.decode(roleId);
    if (decodedId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }
    const parsedRoleId = decodedId[0];
    // Authentication check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const existingRole = await prisma.role.findUnique({
      where: { role_id: parsedRoleId },
    });
    if (!existingRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }
    const role = await prisma.role.delete({
      where: { role_id: parsedRoleId }
    });
    return res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Error in the deleteRole controller:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting role",
      error: error.message,
    });
  }
}

export { 
  createRole,
  updateRole,
  getAllRoles,
  deleteRole
};
