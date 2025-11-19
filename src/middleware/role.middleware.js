import hashids from "../services/hashids.js";

const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role || !req.user.role.name) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Role not found.",
        });
      }
      const userRole = req.user.role.name.toLowerCase();
      if (allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: `Access denied. Allowed roles: ${allowedRoles.join(", ")}`,
      });
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Error checking user role",
      });
    }
  };
};

// Roles + Self middleware
const allowRolesOrSelf = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: "User not authenticated.",
        });
      }
      // Only check userId if it exists
      let paramId = null;
      if (req.params.userId) {
        const decodedParam = hashids.decode(req.params.userId);
        paramId = decodedParam.length > 0 ? decodedParam[0] : null;
        if (!paramId) {
          return res.status(400).json({
            success: false,
            message: "Invalid user ID",
          });
        }
      }
      const userRole = req.user.role.name.toLowerCase();
      const userId = req.user.user_id;
      // If userId exists, allow self or allowed roles
      if ((paramId && userId === paramId) || allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
        return next();
      }
      // If no userId, just check role
      if (!paramId && allowedRoles.length && allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: allowedRoles.length
          ? `Access denied. Only ${allowedRoles.join(", ")} or the user themselves can perform this action.`
          : "Access denied. Users can only access their own data.",
      });
    } catch (error) {
      console.error("allowRolesOrSelf middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Error checking user access",
      });
    }
  };
};

// Specific middlewares for single roles
const isSuperAdmin = allowRoles("superadmin");
const isAdmin = allowRoles("admin");
const isCoordinator = allowRoles("coordinator");
const isAccountant = allowRoles("accountant");
const isTeacher = allowRoles("teacher");
const isStudent = allowRoles("student");

//Double Combinations
const isAdminOrTeacher = allowRoles("admin", "teacher");
const isAdminOrCoordinator = allowRoles("admin", "coordinator");
const isAdminOrAccountant = allowRoles("admin", "accountant");
const isSuperAdminOrAdmin = allowRoles("superadmin", "admin");
const isSuperAdminOrTeacher = allowRoles("superadmin", "teacher");

//Triple Combination
const isSuperAdminOrAdminOrCoordinator = allowRoles("superadmin", "admin", "coordinator");
const isSuperAdminOrAdminOrTeacher = allowRoles("superadmin", "admin", "teacher");
const isSuperAdminOrAdminOrAccountant = allowRoles("superadmin", "admin", "accountant");

//quadruple Combinations
const isSuperAdminOrAdminOrCoordinatorOrTeacher = allowRoles("superadmin", "admin", "coordinator", "teacher")
const isSuperAdminOrAdminOrCoordinatorOrAccountant = allowRoles("superadmin", "admin", "coordinator", "accountant")
const isSuperAdminOrAdminOrAccountantOrStudent = allowRoles("superadmin", "admin", "student", "accountant")

//quintuple Combinations
const isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent = allowRoles("superadmin", "admin", "coordinator", "teacher", "student")
const isSuperAdminOrAdminOrCoordinatorOrAccountantOrTeacher = allowRoles("superadmin", "admin", "coordinator", "teacher", "accountant")
const isSuperAdminOrAdminOrCoordinatorOrAccountantOrStudent = allowRoles("superadmin", "admin", "coordinator", "student", "accountant")

//self + role combinations 
const isSuperAdminOrAdminOrSelf = allowRolesOrSelf("superadmin", "admin");
const isSuperAdminOrAdminOrCoordinatorOrSelf = allowRolesOrSelf("superadmin", "admin", "coordinator");

// Self only
const isSelf = allowRolesOrSelf();

export {
  isSuperAdmin,
  isAdmin,
  isCoordinator,
  isAccountant,
  isTeacher,
  isStudent,
  isAdminOrTeacher,
  isAdminOrCoordinator,
  isAdminOrAccountant,
  isSuperAdminOrAdmin,
  isSuperAdminOrTeacher,
  isSuperAdminOrAdminOrCoordinator,
  isSuperAdminOrAdminOrTeacher,
  isSuperAdminOrAdminOrAccountant,
  isSuperAdminOrAdminOrCoordinatorOrTeacher,
  isSuperAdminOrAdminOrCoordinatorOrAccountant,
  isSuperAdminOrAdminOrAccountantOrStudent,
  isSuperAdminOrAdminOrSelf,
  isSuperAdminOrAdminOrCoordinatorOrSelf,
  isSuperAdminOrAdminOrCoordinatorOrTeacherOrStudent,
  isSuperAdminOrAdminOrCoordinatorOrAccountantOrTeacher,
  isSuperAdminOrAdminOrCoordinatorOrAccountantOrStudent,
  isSelf
};
