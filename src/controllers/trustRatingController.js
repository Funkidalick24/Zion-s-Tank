/* // Trust Rating controllers */
const { TrustRating, User, Transaction } = require('../models');
const { Op } = require('sequelize');
const { computeTrustScore } = require('../utils/trust');

/**
 * Create a new trust rating
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function createRating(req, res) {
  try {
    const raterId = req.user.id;
    const { ratedId, transactionId, score, reviewText } = req.body;

    // Check if user is trying to rate themselves
    if (raterId === ratedId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot rate yourself'
      });
    }

    // Check if rating already exists for this transaction
    const existingRating = await TrustRating.findOne({
      where: {
        raterId,
        transactionId
      }
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'Rating already exists for this transaction'
      });
    }

    // Verify that the transaction exists and involves both users
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if transaction involves both users
    const involvesUsers = (transaction.buyerId === raterId && transaction.sellerId === ratedId) ||
                          (transaction.buyerId === ratedId && transaction.sellerId === raterId);

    if (!involvesUsers) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction or users not part of transaction'
      });
    }

    // Check if transaction is completed
    if (transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Transaction must be completed before rating'
      });
    }

    // Create rating
    const rating = await TrustRating.create({
      raterId,
      ratedId,
      transactionId,
      score,
      reviewText,
      isVerifiedDenominationMatch: await checkDenominationMatch(raterId, ratedId)
    });

    // Update trust score for rated user
    await updateTrustScore(ratedId);

    res.status(201).json({
      success: true,
      message: 'Rating created successfully',
      rating
    });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating rating'
    });
  }
}

/**
 * Get ratings for a specific user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getUserRatings(req, res) {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get ratings with rater information
    const { count, rows: ratings } = await TrustRating.findAndCountAll({
      where: { ratedId: userId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'rater',
          attributes: ['id', 'firstName', 'lastName', 'businessName', 'isVerified', 'trustScore']
        }
      ]
    });

    // Calculate average score
    const user = await User.findByPk(userId);
    const averageScore = user ? user.trustScore || 0 : 0;

    res.status(200).json({
      success: true,
      ratings,
      averageScore,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalRatings: count
      }
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving ratings'
    });
  }
}

/**
 * Get trust score for a specific user
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getUserTrustScore(req, res) {
  try {
    const userId = req.params.userId;

    // Get user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      trustScore: user.trustScore || 0
    });
  } catch (error) {
    console.error('Get trust score error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving trust score'
    });
  }
}

/**
 * Check if two users have the same denomination
 * @param {number} userId1 - First user ID
 * @param {number} userId2 - Second user ID
 * @returns {Promise<boolean>} - Whether users have same denomination
 */
async function checkDenominationMatch(userId1, userId2) {
  try {
    const user1 = await User.findByPk(userId1);
    const user2 = await User.findByPk(userId2);

    return user1 && user2 &&
           user1.denominationId &&
           user2.denominationId &&
           user1.denominationId === user2.denominationId;
  } catch (error) {
    console.error('Denomination match check error:', error);
    return false;
  }
}

/**
 * Update trust score for a user
 * @param {number} userId - User ID
 */
async function updateTrustScore(userId) {
  try {
    // Get all ratings for the user
    const ratings = await TrustRating.findAll({
      where: { ratedId: userId }
    });

    if (ratings.length === 0) {
      await User.update({ trustScore: null }, { where: { id: userId } });
      return;
    }

    // Compute weighted trust score
    const score = computeTrustScore(ratings);

    // Update user's trust score
    await User.update({ trustScore: score }, { where: { id: userId } });
  } catch (error) {
    console.error('Update trust score error:', error);
  }
}

module.exports = {
  createRating,
  getUserRatings,
  getUserTrustScore,
  checkDenominationMatch,
  updateTrustScore
};