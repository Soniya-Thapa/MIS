import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";

const prisma = new PrismaClient();

// 1️⃣ Create College
const createCollege = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { college_name, college_type, university_id, address, established_year, logo_url, description, website, contact_email, contact_phone } = req.body;
    if (!college_name || !college_type || !university_id || !address) {
      return res.status(400).json({
        success: false,
        message: "Please provide college_name, college_type, university_id, address",
      });
    }
    const decodedUniversityId = hashids.decode(university_id);
    const decodedAddressId = hashids.decode(address);
    if (decodedUniversityId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid university_id",
      });
    }
    if (decodedAddressId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid address_id",
      });
    }
    const parsedUniversityId = decodedUniversityId[0];
    const parsedAddressId = decodedAddressId[0];
    //  Validate enum (CollegeType)
    const allowedTypes = ["AFFILIATED", "AUTONOMOUS", "CONSTITUENT", "GOVERNMENT", "PRIVATE", "AIDED", "UNAIDED"];
    if (!allowedTypes.includes(college_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid college_type",
      });
    }
    const university = await prisma.university.findUnique({
      where: {
        university_id: parsedUniversityId
      },
    });
    if (!university) {
      return res.status(400).json({
        success: false,
        message: "Invalid university reference",
      });
    }
    // Validate referenced area exists
    const area = await prisma.areas.findUnique({
      where: {
        id: parseInt(parsedAddressId)
      },
    });
    if (!area) {
      return res.status(400).json({
        success: false,
        message: "Invalid area_id",
      });
    }
    // Check duplicate
    const existing = await prisma.college.findFirst({
      where: {
        college_name
      },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "College already exists",
      });
    }
    // Generate college_code
    const college_code = "COL" + Date.now();
    const college = await prisma.college.create({
      data: {
        college_code,
        college_name,
        college_type,
        established_year: parseInt(established_year),
        description,
        website,
        contact_email,
        contact_phone,
        logo_url,
        university: {
          connect: { university_id: parsedUniversityId },
        },
        areas: {
          connect: { id: parsedAddressId },
        },
      },
    });
    return res.status(201).json({
      success: true,
      message: "College created successfully",
      data: {
        ...college,
        college_id: hashids.encode(college.college_id),
        university_id: hashids.encode(college.university_id),
        address: hashids.encode(college.address),
      },
    });
  } catch (error) {
    console.error("Error in createCollege:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating college...",
      message: error.message
    });
  }
};


export {
  createCollege
};
