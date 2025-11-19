import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";

const prisma = new PrismaClient();

// Create University
const createUniversity = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    const { university_name, university_type, address, established_year, website, contact_email, contact_phone, description } = req.body;
    // Required fields
    if (!university_name || !university_type || !address || !established_year) {
      return res.status(400).json({
        success: false,
        message: "Please provide university_name, university_type, address, and established_year",
      });
    }
    const address_id = hashids.decode(address);
    if (address_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid address_id",
      });
    }
    const parsedAddress_id = address_id[0]
    // Validate enum
    const allowedTypes = ["PUBLIC", "PRIVATE", "DEEMED", "CENTRAL", "STATE", "AUTONOMOUS"];
    if (!allowedTypes.includes(university_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid university_type"
      });
    }
    // Validate area exists
    const area = await prisma.areas.findUnique({
      where: {
        id: parseInt(parsedAddress_id)
      }
    });
    if (!area) {
      return res.status(400).json({
        success: false,
        message: "Invalid area_id"
      });
    }
    // Check duplicate
    const existing = await prisma.university.findFirst({
      where: {
        university_name
      }
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "University already exists"
      });
    }
    // Generate university code
    const university_code = "UNI" + Date.now();
    const university = await prisma.university.create({
      data: {
        university_name,
        university_type,
        established_year,
        university_code,
        website,
        contact_email,
        contact_phone,
        description,
        created_at: new Date(),
        // ✅ Connect to areas relation
        areas: {
          connect: { id: parsedAddress_id }
        }
      },
    });
    return res.status(201).json({
      success: true,
      message: "University created successfully",
      data: {
        ...university,
        university_id: hashids.encode(university.university_id),
        address: hashids.encode(university.address),
      },
    });
  } catch (error) {
    console.error("Error in createUniversity:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update University
const updateUniversity = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    const { universityId } = req.params;
    if (!universityId) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID"
      });
    }
    const university_id = hashids.decode(universityId);
    if (university_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid university_id",
      });
    }
    const decodedUniversityId = university_id[0]
    const { university_name, university_type, address, established_year, website, contact_email, contact_phone, description } = req.body;

    const updateData = {};
    if (university_name) updateData.university_name = university_name;
    if (university_type) updateData.university_type = university_type;
    if (address) updateData.address = address; // fixed: use 'address' not 'location'
    if (established_year) updateData.established_year = established_year;
    if (website) updateData.website = website;
    if (contact_email) updateData.contact_email = contact_email;
    if (contact_phone) updateData.contact_phone = contact_phone;
    if (description) updateData.description = description;
    updateData.updated_at = new Date();

    const university = await prisma.university.update({
      where: {
        university_id: decodedUniversityId
      },
      data: updateData,
    });
    return res.status(200).json({
      success: true,
      message: "University updated successfully",
      data: {
        ...university,
        university_id: hashids.encode(university.university_id),
        address: hashids.encode(university.address),
      },
    });
  } catch (error) {
    console.error("Error in updateUniversity:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Universities (Dropdown)
const getAllUniversities = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const universities = await prisma.university.findMany({
      select: {
        university_id: true,
        university_name: true
      },
    });
    if (universities.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No universities found"
      });
    }
    const hashed = universities.map(u => ({
      ...u,
      university_id: hashids.encode(u.university_id)
    }));
    return res.status(200).json({
      success: true,
      data: hashed
    });
  } catch (error) {
    console.error("Error in getAllUniversities:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get University By ID
const getUniversityById = async (req, res) => {
  try {
    const { universityId } = req.params;
    if (!universityId) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID"
      });
    }
    const university_id = hashids.decode(universityId);
    if (university_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid university_id",
      });
    }
    const decodedUniversityId = university_id[0]
    const university = await prisma.university.findUnique({
      where: {
        university_id: decodedUniversityId
      }
    });
    if (!university) {
      return res.status(404).json({
        success: false,
        message: "University not found"
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        ...university,
        university_id: hashids.encode(university.university_id),
        address: hashids.encode(university.address)
      },
    });
  } catch (error) {
    console.error("Error in getUniversityById:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    }
    );
  }
};

// Get Universities by Type (PUBLIC/PRIVATE)
const getUniversitiesByType = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    const { type } = req.params;
    const validTypes = ["PUBLIC", "PRIVATE", "DEEMED", "CENTRAL", "STATE", "AUTONOMOUS"];
    if (!type || !validTypes.includes(type.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid university type. Valid types are: " + validTypes.join(", ")
      });
    }
    const universities = await prisma.university.findMany({
      where: {
        university_type: type.toUpperCase(),
      },
    });
    if (universities.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No universities found"
      });
    }
    const hashedUniversity = universities.map(university => ({
      ...university,
      university_id: hashids.encode(university.university_id),
      address: hashids.encode(university.address)
    }));
    return res.status(200).json({
      success: true,
      data: hashedUniversity,
    });
  } catch (error) {
    console.error("Error in getUniversitiesByType:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete University
const deleteUniversity = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    const { universityId } = req.params;
    const university_id = hashids.decode(universityId);
    if (university_id.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid university_id",
      });
    }
    const decodedUniversityId = university_id[0]
    await prisma.university.delete({
      where: {
        university_id: parseInt(decodedUniversityId)
      }
    });
    return res.status(200).json({
      success: true,
      message: "University deleted successfully"
    });
  } catch (error) {
    console.error("Error in deleteUniversity:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
  createUniversity,
  updateUniversity,
  getAllUniversities,
  getUniversityById,
  getUniversitiesByType,
  deleteUniversity,
};
