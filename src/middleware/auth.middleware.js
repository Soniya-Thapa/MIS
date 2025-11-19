import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const sendUnauthorizedResponse = (res, message, additionalData = {}) => {
  return res.status(401).json({
    success: false,
    message,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });
};

const extractToken = (req) => {
  let token = req.cookies?.accessToken;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }
  return token;
}

const protectRoute = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return sendUnauthorizedResponse(res, "Unauthorized - No Access token provided")
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, {
      algorithms: ['HS256'],
      maxAge: '24h'
    });
    if (!decoded.userId) {
      return sendUnauthorizedResponse(res, "Unauthorized - Invalid token structure")
    }
    const user = await prisma.user.findUnique({
      where: { user_id: decoded.userId },
    });
    if (!user) {
      return sendUnauthorizedResponse(res, "User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Token Verification Error: ", error);
    return sendUnauthorizedResponse(res, "Invalid or expired token")
  }
}

const requireTemporaryPassword = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        isTemporaryPassword: true,
        email: true,
        username: true
      }
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    if (!user.isTemporaryPassword) {
      return res.status(403).json({
        success: false,
        message: "Password reset not required for this account"
      });
    }
    // User is authenticated and has temporary password
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in requireTemporaryPassword middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
};

// Middleware to verify access token and attach user to request
const verifyToken = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: "Access token not found",
      });
    }
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        user_id: decoded.userId
      },
      include: {
        role: true,
      },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    // Check if user is blocked
    if (user.is_blocked) {
      // If block duration has expired, unblock the user
      if (user.blocked_until && new Date() > user.blocked_until) {
        await prisma.user.update({
          where: { user_id: user.user_id },
          data: {
            is_blocked: false,
            blocked_until: null,
          },
        });
      } else {
        // Clear tokens and force logout
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(403).json({
          success: false,
          message: "Your account is temporarily blocked",
          blocked_until: user.blocked_until,
          forceLogout: true,
        });
      }
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.json({ message: "Access Denied- Admin Only" });
  }
};

const authenticateJWT = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token missing' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    // Debug: Log the decoded token to see what properties it contains
    console.log('Decoded JWT token:', decoded);
    
    // Try different possible property names for user ID
    const userId = decoded.userId || decoded.id || decoded.user_id || decoded.sub;
    
    if (!userId) {
      console.log('No user ID found in token. Available properties:', Object.keys(decoded));
      return res.status(401).json({ 
        success: false, 
        message: 'User ID not found in token' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { user_id: parseInt(userId) }, // Ensure it's a number
      include: {
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Authentication error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export {
  protectRoute,
  requireTemporaryPassword,
  verifyToken,
  adminRoute,
  authenticateJWT
}