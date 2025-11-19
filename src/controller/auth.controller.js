import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import fs from "fs";
import { redis } from "../../src/services/redis.js";
import generateTemporaryPassword from "../services/generate.random.password.js";
import { cloudinary } from "../services/cloudinary.config.js";
import hashids from "../services/hashids.js";
import { emailTemplates, sendEmail } from "../services/email.config.js";

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const registerUser = async (req, res, next) => {
  try {
    if (req.body == undefined) {
      res.status(400).json({
        error: "No data was sent"
      })
      return
    }
    const { username, email, role_id, phone, full_name, gender } = req.body
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
        message: "Username, email or phone, full_name, and role_id are required"
      });
    }
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email or username already exists",
      });
    }
    // ✅ Fetch role for role name
    const role = await prisma.role.findUnique({
      where: {
        role_id: parseInt(parsedRoleId)
      },
    });
    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Invalid role_id provided",
      });
    }
    //password
    const temporaryPassword = generateTemporaryPassword(12);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    let image = null
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "MIS/user_profiles",
          resource_type: "auto",
        });
        image = result.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        console.error("Failed to upload image:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image",
        });
      }
    }
    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        full_name,
        phone,
        role_id: parseInt(parsedRoleId),
        image,
        gender,
        updated_at: new Date(),
        isTemporaryPassword: true,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        full_name: true,
        phone: true,
        image: true,
        role: {
          select: {
            role_id: true,
            name: true
          }
        }
      },
    });
    // Hash the IDs
    const hashedUser = {
      ...user,
      user_id: hashids.encode(user.user_id),
      role: {
        ...user.role,
        role_id: hashids.encode(user.role.role_id),
      },
    };
    const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/login`;
    // Prepare email template data
    const emailTemplate = emailTemplates.authorRegistrationEmail(
      username,
      temporaryPassword,
      loginUrl,
      role.name
    );
    // Send welcome email with credentials
    try {
      const emailResult = await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.htmlContent
      });
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError);
    }
    res.status(201).json({
      success: true,
      message:
        "Registration successful.",
      data: hashedUser,
    });
  } catch (error) {
    console.error("Signup error:", error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Error during registration",
      error: error.message,
    });
  }
}

const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginIdentifier = email || username;
    // Find user by email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginIdentifier },
          { username: loginIdentifier }
        ]
      },
      include: {
        role: true,
      },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    // Check if user is blocked
    if (user.is_blocked) {
      if (user.blocked_until && new Date() > user.blocked_until) {
        await prisma.user.update({
          where: {
            user_id: user.user_id
          },
          data: {
            is_blocked: false,
            blocked_until: null,
          },
        });
      } else {
        return res.status(403).json({
          success: false,
          message: "Your account is temporarily blocked",
          blocked_until: user.blocked_until,
        });
      }
    }
    // Verify password (skip for OAuth users)
    if (user.password) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    }
    // Generate and store tokens
    const { accessToken, refreshToken } = generateTokens(user.user_id);
    await storeRefreshToken(user.user_id, refreshToken);
    setCookies(res, accessToken, refreshToken);
    if (user.isTemporaryPassword) {
      return res.json({
        success: true,
        requiresPasswordReset: true,
        message: "Please reset your password to continue",
        data: {
          id: hashids.encode(user.user_id),
          email: user.email,
          username: user.username,
          isTemporaryPassword: true,
          role: {
            role_id: hashids.encode(user.role.role_id),
            name: user.role.name
          }
        }
      });
    }
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user_id: hashids.encode(user.user_id),
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: {
          role_id: hashids.encode(user.role.role_id),
          name: user.role.name
        },
      },
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};

// Setting your own password instead of temporary password sended as credentials in email 
const setPassword = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required"
      });
    }
    // Get user and verify they have temporary password
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      include: { role: true }

    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    // Update user password
    await prisma.user.update({
      where: { user_id: userId },
      data: {
        password: hashedNewPassword,
        isTemporaryPassword: false,
        updated_at: new Date()
      }
    });
    res.json({
      success: true,
      message: "Password reset successfully. You can now use your new password.",
      data: {
        id: hashids.encode(user.user_id),
        email: user.email,
        username: user.username,
        role: {
          role_id: hashids.encode(user.role.role_id),
          name: user.role.name
        }
      }
    });
  } catch (error) {
    console.error("Error in resetPassword controller:", error);
    return res.status(500).json({
      success: false,
      message: "Error during password reset",
      error: error.message
    });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    let userId = null;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        userId = decoded.userId;
        // Remove refresh token from Redis
        await redis.del(`refresh_token:${userId}`);
      } catch (tokenError) {
        console.error('Token verification failed during logout:', tokenError);
      }
    }
    // Clear cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: process.env.COOKIE_DOMAIN || undefined,
    });
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error occurred during logout',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // Generate reset token (15 minutes expiry)
    const resetToken = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.PASSWORD_RESET_SECRET,
      { expiresIn: "15m" }
    );
    // Store reset token in database
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password_reset_token: resetToken,
        password_reset_expires: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      },
    });
    // Create reset link
    const resetLink = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;
    // Send password reset email
    try {
      const emailContent = emailTemplates.passwordResetEmail(user.username, resetLink);
      await sendEmail({
        to: user.email,
        ...emailContent,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email",
      });
    }
    res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error("Error in forgotPassword controller:", error);
    res.status(500).json({
      success: false,
      message: "Server error while processing forgot password request",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }
    // Verify reset token
    const decoded = jwt.verify(token, process.env.PASSWORD_RESET_SECRET);
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        user_id: decoded.userId,
        password_reset_token: token,
        password_reset_expires: {
          gt: new Date(),
        },
      },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }
    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Update password and clear reset token
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
        updated_at: new Date(),
      },
    });
    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error in resetPassword controller:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Reset token has expired. Please request a new one.",
      });
    }
    res.status(400).json({
      success: false,
      message: "Invalid reset token",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not provided"
      });
    }
    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (tokenError) {
      console.error('Refresh token verification failed:', tokenError);
      // Clear invalid cookies
      res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        domain: process.env.COOKIE_DOMAIN || undefined,
      });
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        domain: process.env.COOKIE_DOMAIN || undefined,
      })
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token"
      });
    }
    // Check if refresh token exists in Redis
    const storedRefreshToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token"
      });
    }
    // Get user from database
    const user = await prisma.user.findUnique({
      where: {
        user_id: decoded.userId
      },
      select: {
        user_id: true,
        email: true,
        username: true,
        role: true,
        isTemporaryPassword: true
      }
    });
    if (!user) {
      // Remove invalid refresh token from Redis
      await redis.del(`refresh_token:${decoded.userId}`);
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }
    // Generate new tokens
    //refreshToken: newRefreshToken: means renaming refreshToken as newRefreshToken
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.user_id);
    // Store new refresh token in Redis
    await storeRefreshToken(user.user_id, newRefreshToken);
    // Set new cookies
    setCookies(res, accessToken, newRefreshToken);
    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        user_id: hashids.encode(user.user_id),
        email: user.email,
        username: user.username,
        isTemporaryPassword: user.isTemporaryPassword,
        role: {
          role_id: hashids.encode(user.role.role_id),
          name: user.role.name
        },
      }
    });
  } catch (error) {
    console.error("Error in refresh token controller:", error);
    return res.status(500).json({
      success: false,
      message: "Error during token refresh",
      error: error.message
    });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const user = await prisma.user.findUnique({
      where: {
        user_id: userId
      },
      select: {
        user_id: true,
        email: true,
        username: true,
        role: true,
        isTemporaryPassword: true,
        created_at: true
      }
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    res.json({
      success: true,
      message: "User profile retrieved successfully",
      data: {
        user_id: hashids.encode(user.user_id),
        email: user.email,
        username: user.username,
        role: {
          role_id: hashids.encode(user.role.role_id),
          name: user.role.name
        },
        isTemporaryPassword: user.isTemporaryPassword,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error("Error in getMe controller:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving user profile",
      error: error.message
    });
  }
};

export {
  registerUser,
  loginUser,
  setPassword,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
  getMe
}