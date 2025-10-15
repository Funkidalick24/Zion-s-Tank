// Request validation middleware
const { body, validationResult } = require('express-validator');

// Validate payload for creating a trust rating
const validateRating = [
  body('ratedId')
    .exists().withMessage('ratedId is required')
    .isInt({ gt: 0 }).withMessage('ratedId must be a positive integer'),
  body('transactionId')
    .exists().withMessage('transactionId is required')
    .isInt({ gt: 0 }).withMessage('transactionId must be a positive integer'),
  body('score')
    .exists().withMessage('score is required')
    .isInt({ min: 1, max: 5 }).withMessage('score must be an integer between 1 and 5'),
  body('reviewText')
    .optional()
    .isString().withMessage('reviewText must be a string')
    .isLength({ max: 2000 }).withMessage('reviewText must be at most 2000 characters'),

  // Final handler to check validation results and also prevent self-rating early
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Self rating early guard (also enforced in controller)
    if (req.user && Number(req.body.ratedId) === Number(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot rate yourself'
      });
    }

    next();
  }
];

module.exports = {
  validateRating
};