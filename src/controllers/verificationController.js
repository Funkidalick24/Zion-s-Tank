// Verification controllers
const { Verification, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Submit or update a verification request for the current user
 * Expects: { documentType, documentUrl, notes? }
 */
async function submitVerification(req, res) {
  try {
    const userId = req.user.id;
    const { documentType, documentUrl, notes } = req.body;

    if (!documentType || !documentUrl) {
      return res.status(400).json({
        success: false,
        message: 'documentType and documentUrl are required'
      });
    }

    // If there's an existing pending request, update it; else create a new one
    const existingPending = await Verification.findOne({
      where: {
        userId,
        status: 'pending'
      }
    });

    let record;
    let created = false;

    if (existingPending) {
      await existingPending.update({
        documentType,
        documentUrl,
        notes: notes || null,
        submittedAt: new Date()
      });
      record = existingPending;
    } else {
      record = await Verification.create({
        userId,
        documentType,
        documentUrl,
        notes: notes || null,
        status: 'pending',
        submittedAt: new Date()
      });
      created = true;
    }

    return res.status(200).json({
      success: true,
      message: created ? 'Verification submitted' : 'Verification updated',
      verification: record
    });
  } catch (err) {
    console.error('submitVerification error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Get all verifications for current user
 */
async function getMyVerifications(req, res) {
  try {
    const userId = req.user.id;
    const items = await Verification.findAll({
      where: { userId },
      order: [['submittedAt', 'DESC']]
    });
    return res.status(200).json({ success: true, verifications: items });
  } catch (err) {
    console.error('getMyVerifications error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Admin: get all pending verifications with user info
 */
async function getAllVerifications(req, res) {
  try {
    const items = await Verification.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['submittedAt', 'DESC']]
    });
    return res.status(200).json({ success: true, verifications: items });
  } catch (err) {
    console.error('getAllVerifications error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Admin: get a single verification by id
 */
async function getVerification(req, res) {
  try {
    const id = req.params.id;
    const item = await Verification.findByPk(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }
    return res.status(200).json({ success: true, verification: item });
  } catch (err) {
    console.error('getVerification error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Admin: approve a verification
 */
async function approveVerification(req, res) {
  try {
    const id = req.params.id;
    const adminId = req.user.id;

    const item = await Verification.findByPk(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }
    if (item.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending verifications can be approved' });
    }

    await item.update({
      status: 'approved',
      verifiedAt: new Date(),
      verifiedBy: adminId
    });

    // Mark user as verified
    await User.update({ isVerified: true }, { where: { id: item.userId } });

    return res.status(200).json({ success: true, message: 'Verification approved', verification: item });
  } catch (err) {
    console.error('approveVerification error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
 * Admin: reject a verification (optional notes)
 */
async function rejectVerification(req, res) {
  try {
    const id = req.params.id;
    const adminId = req.user.id;
    const { notes } = req.body || {};

    const item = await Verification.findByPk(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Verification not found' });
    }
    if (item.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending verifications can be rejected' });
    }

    await item.update({
      status: 'rejected',
      verifiedAt: new Date(),
      verifiedBy: adminId,
      notes: notes || item.notes
    });

    // Do NOT set user isVerified=false here automatically; rejection just means not verified
    return res.status(200).json({ success: true, message: 'Verification rejected', verification: item });
  } catch (err) {
    console.error('rejectVerification error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  submitVerification,
  getMyVerifications,
  getAllVerifications,
  getVerification,
  approveVerification,
  rejectVerification
};