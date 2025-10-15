// Denomination controllers
const { Denomination } = require('../models');

/**
 * Get all denominations
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getAllDenominations(req, res) {
  try {
    const denominations = await Denomination.findAll({
      attributes: ['id', 'name', 'description'],
      order: [['name', 'ASC']]
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
 * Add a new denomination
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function addDenomination(req, res) {
  try {
    const { name, description, religionGroup } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }

    // Check if denomination already exists
    const existingDenomination = await Denomination.findOne({
      where: { name: name.trim() }
    });

    if (existingDenomination) {
      return res.status(409).json({
        success: false,
        message: 'Denomination with this name already exists'
      });
    }

    // Create new denomination
    const newDenomination = await Denomination.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      religionGroup: religionGroup ? religionGroup.trim() : null
    });

    res.status(201).json({
      success: true,
      message: 'Denomination added successfully',
      data: {
        id: newDenomination.id,
        name: newDenomination.name,
        description: newDenomination.description,
        religionGroup: newDenomination.religionGroup
      }
    });
  } catch (error) {
    console.error('Add denomination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding denomination'
    });
  }
}

module.exports = {
  getAllDenominations,
  addDenomination
};