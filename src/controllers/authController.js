// Authentication controllers
const { User, Denomination } = require('../models');
const { hashPassword, comparePassword, generateToken, invalidateSession, invalidateUserSessions } = require('../utils/auth');

/**
 * Register a new user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function register(req, res) {
  console.log('Registration attempt started');
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      denominationId,
      role
    } = req.body;
    console.log('Extracted body:', { email, firstName, lastName, denominationId, role });

    // Check if user already exists
    console.log('Checking if user exists with email:', email);
    const existingUser = await User.findOne({ where: { email } });
    console.log('Existing user check result:', existingUser ? 'User exists' : 'User does not exist');

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Validate denomination if provided
    if (denominationId) {
      console.log('Validating denomination ID:', denominationId);
      const denomination = await Denomination.findByPk(denominationId);
      console.log('Denomination validation result:', denomination ? 'Valid' : 'Invalid');

      if (!denomination) {
        return res.status(400).json({
          success: false,
          message: 'Invalid denomination'
        });
      }
    }

    // Hash password
    console.log('Hashing password');
    const hashedPassword = await hashPassword(password);
    console.log('Password hashed successfully');

    // Create user
    console.log('Creating user with data:', {
      email,
      firstName,
      lastName,
      denominationId: denominationId || null,
      role: role || 'buyer'
    });
    const user = await User.create({
      email,
      passwordHash: hashedPassword,
      firstName,
      lastName,
      denominationId: denominationId || null,
      role: role || 'buyer'
    });
    console.log('User created successfully with ID:', user.id);

    // Generate enhanced JWT token with session metadata
    const sessionInfo = {
      userAgent: req.get('User-Agent') || 'unknown',
      ip: req.ip || req.connection.remoteAddress || 'unknown'
    };
    const token = generateToken(user, sessionInfo);
    console.log('Token generated successfully');

    // Return user data without password hash
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      denominationId: user.denominationId,
      role: user.role,
      isVerified: user.isVerified,
      trustScore: user.trustScore
    };

    console.log('Registration completed successfully');
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
}

/**
 * Login user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await User.update({ lastLogin: new Date() }, { where: { id: user.id } });

    // Generate enhanced JWT token with session metadata
    const sessionInfo = {
      userAgent: req.get('User-Agent') || 'unknown',
      ip: req.ip || req.connection.remoteAddress || 'unknown'
    };
    const token = generateToken(user, sessionInfo);

    // Return user data without password hash
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      denominationId: user.denominationId,
      role: user.role,
      isVerified: user.isVerified,
      trustScore: user.trustScore
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
}

/**
 * Logout user from current session
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
function logout(req, res) {
  try {
    // Get the JWT token to extract session info
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = require('../utils/auth').verifyToken(token);
        if (decoded.sessionId) {
          invalidateSession(decoded.sessionId);
        }
      } catch (error) {
        // Token might be invalid, but that's okay for logout
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
}

/**
 * Logout user from all devices
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
function logoutAll(req, res) {
  try {
    // User is attached by auth middleware
    const userId = req.user.id;

    // Invalidate all sessions for this user
    invalidateUserSessions(userId);

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout from all devices'
    });
  }
}

/**
 * Get current user profile
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getProfile(req, res) {
  try {
    // User is already attached to req by authentication middleware
    const user = req.user;
    
    // Get denomination name if user has one
    let denominationName = null;
    if (user.denominationId) {
      const denomination = await Denomination.findByPk(user.denominationId);
      if (denomination) {
        denominationName = denomination.name;
      }
    }
    
    // Return user data
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      denominationId: user.denominationId,
      denominationName: denominationName,
      role: user.role,
      phoneNumber: user.phoneNumber,
      address: user.address,
      businessName: user.businessName,
      businessDescription: user.businessDescription,
      profileImageUrl: user.profileImageUrl,
      isVerified: user.isVerified,
      trustScore: user.trustScore,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
    
    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error retrieving profile' 
    });
  }
}

/**
 * Update user profile
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      businessName,
      businessDescription,
      denominationId
    } = req.body;

    // Check if email is already taken by another user
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }

    // Update user profile
    await User.update({
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      businessName,
      businessDescription,
      denominationId: denominationId || null
    }, { where: { id: userId } });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
}

/**
 * Change user password
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get user with password hash
    const user = await User.findByPk(userId);

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await User.update({
      passwordHash: hashedNewPassword
    }, { where: { id: userId } });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword
};