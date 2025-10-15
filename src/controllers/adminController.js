// Admin controllers

const { User, Denomination } = require('../models');

/**
 * Get all users for admin management
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['passwordHash'] },
      include: [{
        model: Denomination,
        as: 'denomination',
        attributes: ['id', 'name']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving users'
    });
  }
}

/**
 * Update user role
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['buyer', 'seller', 'both', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Update user role
    await User.update({ role }, { where: { id: userId } });

    res.status(200).json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user role'
    });
  }
}

/**
 * Update user verification status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updateUserVerification(req, res) {
  try {
    const { userId } = req.params;
    const { isVerified } = req.body;

    await User.update({ isVerified }, { where: { id: userId } });

    res.status(200).json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`
    });
  } catch (error) {
    console.error('Update user verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating verification status'
    });
  }
}

/**
 * Update user active status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updateUserStatus(req, res) {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    await User.update({ isActive }, { where: { id: userId } });

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user status'
    });
  }
}

/**
 * Get all denominations for admin management
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getDenominations(req, res) {
  try {
    const denominations = await Denomination.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: denominations
    });
  } catch (error) {
    console.error('Get denominations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving denominations'
    });
  }
}

/**
 * Create a new denomination
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function createDenomination(req, res) {
  try {
    const { name, description } = req.body;

    // Check if denomination already exists
    const existingDenomination = await Denomination.findOne({ where: { name } });
    if (existingDenomination) {
      return res.status(400).json({
        success: false,
        message: 'Denomination with this name already exists'
      });
    }

    const denomination = await Denomination.create({
      name,
      description: description || ''
    });

    res.status(201).json({
      success: true,
      message: 'Denomination created successfully',
      data: denomination
    });
  } catch (error) {
    console.error('Create denomination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating denomination'
    });
  }
}

/**
 * Update a denomination
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function updateDenomination(req, res) {
  try {
    const { denominationId } = req.params;
    const { name, description } = req.body;

    // Check if another denomination with the same name exists
    const existingDenomination = await Denomination.findOne({
      where: { name, id: { [require('sequelize').Op.ne]: denominationId } }
    });
    if (existingDenomination) {
      return res.status(400).json({
        success: false,
        message: 'Another denomination with this name already exists'
      });
    }

    await Denomination.update({
      name,
      description: description || ''
    }, { where: { id: denominationId } });

    res.status(200).json({
      success: true,
      message: 'Denomination updated successfully'
    });
  } catch (error) {
    console.error('Update denomination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating denomination'
    });
  }
}

/**
 * Delete a denomination
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function deleteDenomination(req, res) {
  try {
    const { denominationId } = req.params;

    // Check if denomination is being used by any users
    const usersUsingDenomination = await User.findAll({
      where: { denominationId }
    });

    if (usersUsingDenomination.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete denomination that is being used by users'
      });
    }

    await Denomination.destroy({ where: { id: denominationId } });

    res.status(200).json({
      success: true,
      message: 'Denomination deleted successfully'
    });
  } catch (error) {
    console.error('Delete denomination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting denomination'
    });
  }
}

module.exports = {
  getUsers,
  updateUserRole,
  updateUserVerification,
  updateUserStatus,
  getDenominations,
  createDenomination,
  updateDenomination,
  deleteDenomination
};