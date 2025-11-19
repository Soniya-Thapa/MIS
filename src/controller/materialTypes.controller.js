import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";
const prisma = new PrismaClient();

const getAllMaterialTypes = async (req, res) => {
  try {
    const types = await prisma.materialtype.findMany({
      include: {
        studymaterial: true,
      },
    });
    const hashedTypes = types.map(type => ({
      ...type,
      material_type_id: hashids.encode(type.material_type_id)

    }))
    return res.status(200).json({
      success: true,
      message: "Material Type fetched successfully",
      data: hashedTypes,
    });
  } catch (error) {
    console.error("Error fetching types:", error);
    return res.status(500).json({
      error: "Failed to fetch types"
    });
  }
};
export {
  getAllMaterialTypes
}