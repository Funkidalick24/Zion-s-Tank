// Profile management controllers
const { User, Denomination } = require('../models');

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
      denominationId,
      phoneNumber,
      address,
      businessName,
      businessDescription
    } = req.body;

    // Validate denomination if provided
    if (denominationId) {
      const denomination = await Denomination.findByPk(denominationId);

      if (!denomination) {
        return res.status(400).json({
          success: false,
          message: 'Invalid denomination'
        });
      }
    }

    // Update user
    await User.update({
      firstName,
      lastName,
      denominationId: denominationId || null,
      phoneNumber,
      address,
      businessName,
      businessDescription
    }, {
      where: { id: userId }
    });

    // Get updated user with denomination
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Denomination,
          as: 'denomination'
        }
      ]
    });

    // Return updated user data
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      denominationId: user.denominationId,
      denominationName: user.denomination ? user.denomination.name : null,
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
      message: 'Profile updated successfully',
      user: userData
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
 * Update user password
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updatePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Get user with password hash
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const { comparePassword, hashPassword } = require('../utils/auth');
    const isMatch = await comparePassword(currentPassword, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await user.update({
      passwordHash: hashedPassword
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating password'
    });
  }
}

/**
 * Get public profile of a user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getPublicProfile(req, res) {
  try {
    const userId = req.params.userId;

    // Get user without sensitive information
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Denomination,
          as: 'denomination'
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return public user data
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
      businessDescription: user.businessDescription,
      profileImageUrl: user.profileImageUrl,
      isVerified: user.isVerified,
      trustScore: user.trustScore,
      denominationId: user.denominationId,
      denominationName: user.denomination ? user.denomination.name : null,
      memberSince: user.createdAt
    };

    res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
}

module.exports = {
  updateProfile,
  updatePassword,
  getPublicProfile
};