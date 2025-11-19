import express from "express";
const router = express.Router();

import {getAllProvinces,getProvinceById,getAllDistricts,getDistrictsByProvince,getAllCities,getCitiesByDistrict,getAllAreas,getAreasByCity} from "../controller/location.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

// Anyone logged in can view
// ✅ Provinces
router.route("/provinces").get(verifyToken, getAllProvinces); // Anyone logged in can view
router.route("/provinces/:provinceId").get(verifyToken, getProvinceById);

// ✅ Districts
router.route("/districts").get(verifyToken, getAllDistricts);
router.route("/districts/province/:provinceId").get(verifyToken, getDistrictsByProvince);

// ✅ Cities
router.route("/cities").get(verifyToken, getAllCities);
router.route("/cities/district/:districtId").get(verifyToken, getCitiesByDistrict);

// ✅ Areas
router.route("/areas").get(verifyToken, getAllAreas);
router.route("/areas/city/:cityId").get(verifyToken, getAreasByCity);

export default router;
  