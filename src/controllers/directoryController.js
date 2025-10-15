// Directory controller for member business directory
const { User, Denomination } = require('../models');
const { Op } = require('sequelize');

// GET /api/directory - Get directory of members with filtering
async function getDirectory(req, res) {
  try {
    const {
      q,
      category,
      location,
      denomination,
      page = '1',
      limit = '20',
      sort = 'newest'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * perPage;

    const where = { isActive: true };

    // Apply filters
    if (q) {
      where[Op.or] = [
        { businessName: { [Op.iLike]: `%${q}%` } },
        { businessDescription: { [Op.iLike]: `%${q}%` } },
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } }
      ];
    }

    if (category) {
      // Map frontend categories to database roles
      const roleMapping = {
        'retail': ['buyer', 'both'],
        'professional': ['seller', 'both'],
        'manufacturing': ['seller', 'both'],
        'technology': ['seller', 'both'],
        'healthcare': ['seller', 'both'],
        'food': ['seller', 'both']
      };

      if (roleMapping[category]) {
        where.role = { [Op.in]: roleMapping[category] };
      }
    }

    if (location) {
      // For now, we'll use address field for location filtering
      // In a real app, you might have a separate location field
      where.address = { [Op.iLike]: `%${location}%` };
    }

    if (denomination) {
      where.denominationId = denomination;
    }

    // Build sort order
    let order;
    switch (sort) {
      case 'name':
        order = [['businessName', 'ASC']];
        break;
      case 'newest':
      default:
        order = [['createdAt', 'DESC']];
        break;
    }

    let count, users;
    try {
      const result = await User.findAndCountAll({
        where,
        limit: perPage,
        offset,
        order,
        include: [
          {
            model: Denomination,
            as: 'denomination',
            attributes: ['id', 'name', 'description']
          }
        ],
        attributes: [
          'id', 'firstName', 'lastName', 'businessName', 'businessDescription',
          'role', 'phoneNumber', 'address', 'profileImageUrl', 'isVerified',
          'trustScore', 'createdAt'
        ]
      });
      count = result.count;
      users = result.rows;
    } catch (queryError) {
      console.error('Database query error:', queryError);
      throw queryError;
    }

    // Ensure users data is serializable
    const sanitizedUsers = users.map(user => {
      const userData = user.toJSON ? user.toJSON() : user;
      return {
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        businessName: userData.businessName,
        businessDescription: userData.businessDescription,
        role: userData.role,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        profileImageUrl: userData.profileImageUrl,
        isVerified: userData.isVerified,
        trustScore: userData.trustScore,
        createdAt: userData.createdAt,
        denomination: userData.denomination ? {
          id: userData.denomination.id,
          name: userData.denomination.name,
          description: userData.denomination.description
        } : null
      };
    });

    const responseData = {
      success: true,
      users: sanitizedUsers,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / perPage),
        total: count
      }
    };

    // Try to send response
    try {
      res.status(200).json(responseData);
    } catch (jsonError) {
      console.error('JSON serialization error:', jsonError);
      res.status(500).json({
        success: false,
        message: 'Error serializing response data'
      });
    }
  } catch (err) {
    console.error('getDirectory error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ success: false, message: 'Server error retrieving directory', error: err.message });
  }
}

// GET /api/directory/denominations - Get list of available denominations
async function getDenominations(req, res) {
  try {
    const denominations = await Denomination.findAll({
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'description']
    });

    // Sanitize denominations data
    const sanitizedDenominations = denominations.map(denom => {
      const denomData = denom.toJSON ? denom.toJSON() : denom;
      return {
        id: denomData.id,
        name: denomData.name,
        description: denomData.description
      };
    });

    const responseData = {
      success: true,
      denominations: sanitizedDenominations
    };

    // Try to send response
    try {
      res.status(200).json(responseData);
    } catch (jsonError) {
      console.error('JSON serialization error:', jsonError);
      res.status(500).json({
        success: false,
        message: 'Error serializing response data'
      });
    }
  } catch (err) {
    console.error('getDenominations error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving denominations' });
  }
}

module.exports = {
  getDirectory,
  getDenominations
};