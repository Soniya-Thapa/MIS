import { PrismaClient } from "@prisma/client";
import hashids from "../services/hashids.js";

const prisma = new PrismaClient();

// ✅ Get all provinces (for dropdown)
const getAllProvinces = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const provinces = await prisma.provinces.findMany();
    if (!provinces || provinces.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No provinces found."
      });
    }
    const hashedProvinces = provinces.map(province => ({
      ...province,
      id: hashids.encode(province.id),
    }));
    return res.status(200).json({
      success: true,
      data: hashedProvinces,
    });
  } catch (error) {
    console.error("Error in getAllProvinces:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching provinces",
      error: error.message,
    });
  }
};

// ✅ Get province by ID (optional)
const getProvinceById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const { provinceId } = req.params;
    const decodedId = hashids.decode(provinceId)[0];
    if (!decodedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid province ID",
      });
    }
    const province = await prisma.provinces.findUnique({
      where: {
        id: parseInt(decodedId)
      },
    });
    if (!province) {
      return res.status(404).json({
        success: false,
        message: "Province not found",
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        ...province,
        id: hashids.encode(province.id)
      },
    });
  } catch (error) {
    console.error("Error in getProvinceById:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching province",
      error: error.message,
    });
  }
};

// ✅ Get districts by province (cascading dropdown)
const getDistrictsByProvince = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const { provinceId } = req.params;
    const decodedId = hashids.decode(provinceId)[0];
    if (!decodedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid province ID",
      });
    }
    const districts = await prisma.districts.findMany({
      where: {
        province_id: parseInt(decodedId)
      },
    });
    if (!districts || districts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No districts found."
      });
    }
    const hashedDistricts = districts.map(district => ({
      ...district,
      id: hashids.encode(district.id),
      province_id: hashids.encode(district.province_id),
    }));
    return res.status(200).json({
      success: true,
      data: hashedDistricts,
    });
  } catch (error) {
    console.error("Error in getDistrictsByProvince:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching districts",
      error: error.message,
    });
  }
};

// ✅ Get all districts (optional)
const getAllDistricts = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const districts = await prisma.districts.findMany();
    if (!districts || districts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No districts found."
      });
    }
    const hashedDistricts = districts.map(district => ({
      ...district,
      id: hashids.encode(district.id),
      province_id: hashids.encode(district.province_id),
    }));
    return res.status(200).json({
      success: true,
      data: hashedDistricts,
    });
  } catch (error) {
    console.error("Error in getAllDistricts:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching districts",
      error: error.message,
    });
  }
};

// ✅ Get cities by district (cascading dropdown)
const getCitiesByDistrict = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const { districtId } = req.params;
    const decodedId = hashids.decode(districtId)[0];
    if (!decodedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid district ID",
      });
    }
    const cities = await prisma.cities.findMany({
      where: {
        district_id: parseInt(decodedId)
      },
    });
    if (!cities || cities.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No cities found."
      });
    }
    const hashedCities = cities.map(city => ({
      ...city,
      id: hashids.encode(city.id),
      district_id: hashids.encode(city.district_id),
    }));
    return res.status(200).json({
      success: true,
      data: hashedCities,
    });
  } catch (error) {
    console.error("Error in getCitiesByDistrict:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching cities",
      error: error.message,
    });
  }
};

// ✅ Get all cities
const getAllCities = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const cities = await prisma.cities.findMany();
    if (!cities || cities.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No cities found."
      });
    }
    const hashedCities = cities.map(city => ({
      ...city,
      id: hashids.encode(city.id),
      district_id: hashids.encode(city.district_id),
    }));
    return res.status(200).json({
      success: true,
      data: hashedCities,
    });
  } catch (error) {
    console.error("Error in getAllCities:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching cities",
      error: error.message,
    });
  }
};

// ✅ Get areas by city (final dropdown for address)
const getAreasByCity = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const { cityId } = req.params;
    const decodedId = hashids.decode(cityId)[0];
    if (!decodedId) {
      return res.status(400).json({
        success: false,
        message: "Invalid city ID",
      });
    }
    const areas = await prisma.areas.findMany({
      where: {
        city_id: parseInt(decodedId)
      },
    });
    if (!areas || areas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No areas found."
      });
    }
    const hashedAreas = areas.map(area => ({
      ...area,
      id: hashids.encode(area.id),
      city_id: hashids.encode(area.city_id),
    }));
    return res.status(200).json({
      success: true,
      data: hashedAreas,
    });
  } catch (error) {
    console.error("Error in getAreasByCity:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching areas",
      error: error.message,
    });
  }
};

// ✅ Get all areas
const getAllAreas = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    const areas = await prisma.areas.findMany();
    if (!areas || areas.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No areas found."
      });
    }
    const hashedAreas = areas.map(area => ({
      ...area,
      id: hashids.encode(area.id),
      city_id: hashids.encode(area.city_id),
    }));
    return res.status(200).json({
      success: true,
      data: hashedAreas,
    });
  } catch (error) {
    console.error("Error in getAllAreas:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching areas",
      error: error.message,
    });
  }
};

export {
  getAllProvinces,
  getProvinceById,
  getDistrictsByProvince,
  getAllDistricts,
  getCitiesByDistrict,
  getAllCities,
  getAreasByCity,
  getAllAreas,
};
