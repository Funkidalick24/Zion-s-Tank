// Messaging routes
const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const {
  createOrGetConversation,
  listMyConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead
} = require('../controllers/messageController');

// Protected routes
router.post('/conversations', authenticate, createOrGetConversation);
router.get('/conversations', authenticate, listMyConversations);
router.get('/conversations/:conversationId/messages', authenticate, getConversationMessages);
router.post('/conversations/:conversationId/messages', authenticate, sendMessage);
router.post('/conversations/:conversationId/read', authenticate, markConversationRead);

module.exports = router;