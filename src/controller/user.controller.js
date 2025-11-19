import { PrismaClient } from "@prisma/client";
import { cloudinary } from "../services/cloudinary.config.js";
import hashids from "../services/hashids.js";
import bcrypt from "bcrypt";
import fs from "fs";
import { emailTemplates, sendEmail } from "../services/email.config.js";
import generateTemporaryPassword from "../services/generate.random.password.js";

const prisma = new PrismaClient();

const createUser = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is missing.",
      });
    }
    const { username, email, full_name, phone, role_id, gender } = req.body;
    const decodedId = hashids.decode(role_id);
    if (decodedId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid role ID",
      });
    }
    const parsedRoleId = decodedId[0];
    // Validate required fields
    if (!username || (!email && !phone) || !role_id || !full_name) {
      return res.status(400).json({
        success: false,
        message: "Username, email or phone, full_name, and role_id are required",
      });
    }
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this username or email already exists",
      });
    }
    // 🔹 Validate target role existence
    const targetRole = await prisma.role.findUnique({
      where: { role_id: parsedRoleId },
    });
    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: "Invalid role_id provided",
      });
    }
    // Define hierarchical role creation permissions
    const roleCreationMap = {
      superadmin: ["admin"],
      admin: ["coordinator", "accountant"],
      coordinator: ["teacher", "student"],
    };
    const creatorRole = req.user.role.name?.toLowerCase().trim();
    const targetRoleName = targetRole.name?.toLowerCase().trim();
    if (!roleCreationMap[creatorRole]) {
      return res.status(403).json({
        success: false,
        message: `${creatorRole} does not have any creation permissions`,
      });
    }
    if (!roleCreationMap[creatorRole].includes(targetRoleName)) {
      return res.status(403).json({
        success: false,
        message: `${creatorRole} is not allowed to create ${targetRoleName}`,
      });
    }
    // Generate & hash temporary password
    const temporaryPassword = generateTemporaryPassword(12);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    // Handle image upload (optional)
    let image = null;
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "MIS/user_profiles",
          resource_type: "auto",
        });
        image = result.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image",
        });
      }
    }
    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        full_name,
        phone,
        image,
        gender,
        role_id: parsedRoleId,
        isTemporaryPassword: true,
        created_by: req.user.user_id,
        updated_at: new Date(),
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        gender: true,
        phone: true,
        role_id: true,
        isTemporaryPassword: true,
        image: true,
        updated_at: true,
        date_of_birth: true,
        father_name: true,
        created_by: true,
        contact_address: true,
        permanent_address: true,
        role: {
          select: {
            role_id: true,
            name: true,
          },
        },
      },
    });
    // Encode IDs
    const hashedUser = {
      ...newUser,
      user_id: hashids.encode(newUser.user_id),
      role_id: hashids.encode(newUser.role_id),
      created_by: hashids.encode(newUser.created_by),
      role: {
        ...newUser.role,
        role_id: hashids.encode(newUser.role.role_id),
      },
    };
    //Prepare login link & email
    const loginUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/admin/login`;
    const emailTemplate = emailTemplates.authorRegistrationEmail(
      username,
      temporaryPassword,
      loginUrl,
      newUser.role.name
    );
    try {
      await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.htmlContent,
      });
    } catch (emailError) {
      console.error("Failed to send registration email:", emailError);
      // Continue anyway (user is created successfully)
    }
    return res.status(201).json({
      success: true,
      message: "User created successfully. Temporary credentials sent via email.",
      data: hashedUser,
    });
  } catch (error) {
    console.error("Error in createUser:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        phone_verified: true,
        is_blocked: true,
        blocked_until: true,
        created_at: true,
        image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    const usersWithHashedId = users.map(user => ({
      ...user,
      user_id: hashids.encode(user.user_id),
    }));
    res.json({
      success: true,
      data: usersWithHashedId
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

//still have to work on these
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const decodedId = hashids.decode(userId);
    if (decodedId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const parsedUserId = decodedId[0]

    await prisma.$transaction(async (prisma) => {
      // Delete enrollments
      await prisma.enrollment.deleteMany({
        where: { student_id: parseInt(parsedUserId) },
      });

      // Delete study materials
      await prisma.studymaterial.deleteMany({
        where: { user_id: parseInt(parsedUserId) },
      });

      // Delete subjects created by this user
      await prisma.subject.deleteMany({
        where: { created_by: parseInt(parsedUserId) },
      });

      // Delete chapters created by this user
      await prisma.chapter.deleteMany({
        where: { created_by: parseInt(parsedUserId) },
      });

      // Delete topics created by this user
      await prisma.topic.deleteMany({
        where: { created_by: parseInt(parsedUserId) },
      });

      // Finally, delete the user
      await prisma.user.delete({
        where: { user_id: parseInt(parsedUserId) },
      });
    });
    res.json({
      success: true,
      message: "User and all related records deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteUser controller:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user and related records",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    // Decode hashed ID
    const decodedId = hashids.decode(userId);
    if (decodedId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const parseduserId = decodedId[0]
    const user = await prisma.user.findUnique({
      where: {
        user_id: parseduserId
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        role: true,
        isTemporaryPassword: true,
        created_at: true,
        updated_at: true,
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      data: {
        user_id: hashids.encode(user.user_id),
        username: user.username,
        email: user.email,
        role: {
          role_id: hashids.encode(user.role.role_id),
          name: user.role.name
        },
        isTemporaryPassword: user.isTemporaryPassword,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    // Decode hashed ID
    const decodedId = hashids.decode(userId);
    if (decodedId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const parseduserId = decodedId[0]
    if (!req.body && !req.file) {
      return res.status(400).json({
        success: false,
        message: "No data sent"
      });
    }
    const { username, email, ...otherFields } = req.body;
    // Convert date string to Date
    if (otherFields.date_of_birth) {
      otherFields.date_of_birth = new Date(otherFields.date_of_birth); // JS Date object
    }
    // Fetch current user
    const user = await prisma.user.findUnique({
      where: {
        user_id: parseduserId
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Optional: Prevent email/username duplication
    if (email && email !== user.email) {
      const existingEmailUser = await prisma.user.findFirst({
        where: {
          email, user_id: { not: parseduserId }
        },
      });
      if (existingEmailUser) {
        return res.status(409).json({
          success: false,
          message: "Email already in use by another user",
        });
      }
    }
    if (username && username !== user.username) {
      const existingUsernameUser = await prisma.user.findFirst({
        where: {
          username, user_id: { not: parseduserId }
        },
      });
      if (existingUsernameUser) {
        return res.status(409).json({
          success: false,
          message: "Username already taken",
        });
      }
    }
    // Handle image upload
    let image = user.image; // keep old image by default
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "MIS/user_images",
        resource_type: "auto",
      });
      image = result.secure_url;
      fs.unlinkSync(req.file.path);
      // Delete old image from Cloudinary
      if (user.image) {
        try {
          const publicId = user.image
            .split('/')
            .slice(-2)
            .join('/')
            .split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Error deleting old Cloudinary image:", err);
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: {
        user_id: parseduserId
      },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...otherFields,
        image,
        updated_at: new Date()
      },
      include: { role: true },
    });
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user_id: hashids.encode(updatedUser.user_id),
        username: updatedUser.username,
        email: updatedUser.email,
        role: {
          role_id: hashids.encode(updatedUser.role.role_id),
          name: updatedUser.role.name
        },
        updatedAt: updatedUser.updated_at,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Error updating user",
    });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params; // this user_id is the id of the user which is going to be blocked
    const decodedId = hashids.decode(userId);
    if (decodedId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const parsedUserId = decodedId[0];
    const { blockDuration } = req.body; // e.g., "7days"
    if (!blockDuration) {
      return res.status(400).json({
        success: false,
        message: "Block duration is required",
      });
    }
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(parsedUserId) },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Calculate the blocked_until date
    const now = new Date();
    let blockedUntil = null;
    if (blockDuration === "7days") {
      blockedUntil = new Date(now.setDate(now.getDate() + 7));
    } else if (blockDuration === "30days") {
      blockedUntil = new Date(now.setDate(now.getDate() + 30));
    } else if (blockDuration === "permanent") {
      blockedUntil = null;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid block duration value",
      });
    }
    // Update the user's block status
    const updatedUser = await prisma.user.update({
      where: { user_id: parseInt(parsedUserId) },
      data: {
        is_blocked: true,
        blocked_until: blockedUntil,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        is_blocked: true,
        blocked_until: true,
      },
    });
    const hashedUser = {
      ...updatedUser,
      user_id: hashids.encode(updatedUser.user_id),
    };
    return res.status(200).json({
      success: true,
      message: `User blocked successfully ${blockedUntil ? `until ${blockedUntil.toISOString()}` : "permanently"}`,
      data: hashedUser,
    });
  } catch (error) {
    console.error("Error in blockUser:", error);
    return res.status(500).json({
      success: false,
      message: "Error blocking user",
      error: error.message,
    });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const decodedId = hashids.decode(userId);
    if (decodedId.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const parsedUserId = decodedId[0];
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(parsedUserId) },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Update user's block status
    const updatedUser = await prisma.user.update({
      where: { user_id: parseInt(parsedUserId) },
      data: {
        is_blocked: false,
        blocked_until: null,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        is_blocked: true,
      },
    });
    const hashedUser = {
      ...updatedUser,
      user_id: hashids.encode(updatedUser.user_id),
    };
    return res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: hashedUser,
    });
  } catch (error) {
    console.error("Error in unblockUser:", error);
    return res.status(500).json({
      success: false,
      message: "Error unblocking user",
      error: error.message,
    });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const blockedUsers = await prisma.user.findMany({
      where: {
        is_blocked: true,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        blocked_until: true,
        image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    const hashedUsers = blockedUsers.map((blockedUser) => ({
      ...blockedUser,
      user_id: hashids.encode(blockedUser.user_id),
    }));
    return res.status(200).json({
      success: true,
      count: hashedUsers.length,
      data: hashedUsers,
    });
  } catch (error) {
    console.error("Error in getBlockedUsers:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching blocked users",
      error: error.message,
    });
  }
};

const getAllTeachers = async (req, res) => {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: {
          name: "teacher",
        },
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        is_blocked: true,
        blocked_until: true,
        created_at: true,
        image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    if (teachers.length === 0) {
      return res.status(200).json({
        success: false,
        message: "There are no teachers registered.",
      });
    }
    const hashedTeachers = teachers.map((teacher) => ({
      ...teacher,
      user_id: hashids.encode(teacher.user_id),
    }));
    return res.status(200).json({
      success: true,
      count: hashedTeachers.length,
      data: hashedTeachers,
    });
  } catch (error) {
    console.error("Error in getAllTeachers:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching teachers",
      error: error.message,
    });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: {
        role: {
          name: "student",
        },
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        is_blocked: true,
        blocked_until: true,
        created_at: true,
        image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    if (students.length === 0) {
      return res.status(200).json({
        success: false,
        message: "There are no students registered.",
      });
    }
    const hashedStudents = students.map((student) => ({
      ...student,
      user_id: hashids.encode(student.user_id),
    }));
    return res.status(200).json({
      success: true,
      count: hashedStudents.length,
      data: hashedStudents,
    });
  } catch (error) {
    console.error("Error in getAllStudents:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching students",
      error: error.message,
    });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: {
          name: "admin",
        },
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        is_blocked: true,
        blocked_until: true,
        created_at: true,
        image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    if (admins.length === 0) {
      return res.status(200).json({
        success: false,
        message: "There are no admins registered.",
      });
    }
    const hashedAdmins = admins.map((admin) => ({
      ...admin,
      user_id: hashids.encode(admin.user_id),
    }));
    return res.status(200).json({
      success: true,
      count: hashedAdmins.length,
      data: hashedAdmins,
    });
  } catch (error) {
    console.error("Error in getAllAdmins:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching admins",
      error: error.message,
    });
  }
};

const getAllCoordinators = async (req, res) => {
  try {
    const coordinators = await prisma.user.findMany({
      where: {
        role: {
          name: "coordinator",
        },
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        is_blocked: true,
        blocked_until: true,
        created_at: true,
        image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    if (coordinators.length === 0) {
      return res.status(200).json({
        success: false,
        message: "There are no coordinators registered.",
      });
    }
    const hashedCoordinators = coordinators.map((coordinator) => ({
      ...coordinator,
      user_id: hashids.encode(coordinator.user_id),
    }));
    return res.status(200).json({
      success: true,
      count: hashedCoordinators.length,
      data: hashedCoordinators,
    });
  } catch (error) {
    console.error("Error in getAllCoordinators:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching coordinators",
      error: error.message,
    });
  }
};

const getAllAccountants = async (req, res) => {
  try {
    const accountants = await prisma.user.findMany({
      where: {
        role: {
          name: "accountant",
        },
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        is_blocked: true,
        blocked_until: true,
        created_at: true,
        image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    if (accountants.length === 0) {
      return res.status(200).json({
        success: false,
        message: "There are no accountants registered.",
      });
    }
    const hashedAccountants = accountants.map((accountant) => ({
      ...accountant,
      user_id: hashids.encode(accountant.user_id),
    }));
    return res.status(200).json({
      success: true,
      count: hashedAccountants.length,
      data: hashedAccountants,
    });
  } catch (error) {
    console.error("Error in getAllAccountants:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching accountants",
      error: error.message,
    });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        phone_verified: true,
        is_blocked: true,
        blocked_until: true,
        created_at: true,
        image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const hashedUser = {
      ...user,
      user_id: hashids.encode(user.user_id),
    };
    return res.status(200).json({
      success: true,
      data: hashedUser,
    });
  } catch (error) {
    console.error("Error in getUserByEmail:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        phone_verified: true,
        is_blocked: true,
        blocked_until: true,
        created_at: true,
        image: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const hashedUser = {
      ...user,
      user_id: hashids.encode(user.user_id),
    };
    return res.status(200).json({
      success: true,
      data: hashedUser,
    });
  } catch (error) {
    console.error("Error in getUserByUsername:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
    // ✅ Validate user authentication
    if (!req.user || !req.user.user_id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const userId = req.user.user_id;
    let imageUrl = null;
    // ✅ Upload to Cloudinary
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "MIS/profile_pictures",
        resource_type: "auto",
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    } catch (uploadError) {
      console.error("Failed to upload image:", uploadError);
      return res.status(500).json({
        success: false,
        message: "Failed to upload profile picture",
        error: uploadError.message,
      });
    }
    // Update user's profile picture
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: { image: imageUrl },
      select: {
        user_id: true,
        username: true,
        email: true,
        image: true,
        full_name: true,
        role: {
          select: {
            role_id: true,
            name: true,
          },
        },
      },
    });
    // ✅ Hash IDs
    const hashedUser = {
      ...updatedUser,
      user_id: hashids.encode(updatedUser.user_id),
      role: {
        ...updatedUser.role,
        role_id: hashids.encode(updatedUser.role.role_id),
      },
    };
    // ✅ Send success response
    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: hashedUser,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      message: "Error uploading profile picture"
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        is_blocked: false
      }
    });
    const blockedUsers = await prisma.user.count({
      where: {
        is_blocked: true
      }
    });
    const newUsers = await prisma.user.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    return res.status(200).json({
      success: true,
      message: "User statistics fetched successfully",
      data: { totalUsers, activeUsers, blockedUsers, newUsers },
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: error.message,
    });
  }
};

export {
  createUser,
  getAllUsers,
  deleteUser,
  getUserById,
  updateUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getAllTeachers,
  getAllStudents,
  getAllAdmins,
  getAllCoordinators,
  getAllAccountants,
  getUserByEmail,
  getUserByUsername,
  uploadProfilePicture,
  getUserStats
}