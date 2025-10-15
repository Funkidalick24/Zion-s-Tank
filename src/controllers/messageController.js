// Messaging controllers (conversations, messages, read-status, notifications)
const { Conversation, Message, User } = require('../models');
const { Op } = require('sequelize');

// Helper to normalize pair ordering to avoid duplicate conversations
function normalizePair(a, b) {
  const aId = Number(a);
  const bId = Number(b);
  return aId < bId ? [aId, bId] : [bId, aId];
}

/**
  * Create or get an existing conversation between current user and recipient
  * Body: { recipientId, subject? }
  */
async function createOrGetConversation(req, res) {
  try {
    const currentUserId = Number(req.user.id);
    const { recipientId, subject } = req.body || {};

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'recipientId is required' });
    }
    if (Number(recipientId) === currentUserId) {
      return res.status(400).json({ success: false, message: 'Cannot start a conversation with yourself' });
    }

    // Ensure recipient exists
    const recipient = await User.findByPk(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const [u1, u2] = normalizePair(currentUserId, recipientId);

    // Find existing conversation
    let convo = await Conversation.findOne({
      where: {
        [Op.or]: [
          { userOneId: u1, userTwoId: u2 },
          { userOneId: u2, userTwoId: u1 }
        ]
      }
    });

    // Create if not found
    if (!convo) {
      convo = await Conversation.create({
        userOneId: u1,
        userTwoId: u2,
        subject: subject || null,
        lastMessageAt: null
      });
    } else if (subject && !convo.subject) {
      // Optionally set subject on first open if not set
      await convo.update({ subject });
    }

    return res.status(200).json({ success: true, conversation: convo });
  } catch (err) {
    console.error('createOrGetConversation error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
  * List conversations for current user (with basic meta)
  * Query: none
  */
async function listMyConversations(req, res) {
  try {
    const currentUserId = req.user.id;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { userOneId: currentUserId },
          { userTwoId: currentUserId }
        ]
      },
      order: [
        ['lastMessageAt', 'DESC'],
        ['updatedAt', 'DESC']
      ]
    });

    return res.status(200).json({ success: true, conversations });
  } catch (err) {
    console.error('listMyConversations error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
  * Get messages within a conversation the user participates in (with pagination)
  * Params: :conversationId
  * Query: page, limit
  * Side-effect: mark received messages as read for this user
  */
async function getConversationMessages(req, res) {
  try {
    const currentUserId = req.user.id;
    const conversationId = req.params.conversationId;
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const offset = (page - 1) * limit;

    const convo = await Conversation.findByPk(conversationId);
    if (!convo) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    if (convo.userOneId !== currentUserId && convo.userTwoId !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Access denied to this conversation' });
    }

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { conversationId },
      limit,
      offset,
      order: [['createdAt', 'ASC']]
    });

    // Mark as read: messages where recipientId = me and isRead = false
    for (const msg of messages) {
      if (msg.recipientId === currentUserId && !msg.isRead) {
        await msg.update({ isRead: true });
      }
    }

    return res.status(200).json({
      success: true,
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        total: count
      }
    });
  } catch (err) {
    console.error('getConversationMessages error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
  * Send a message in an existing conversation
  * Params: :conversationId
  * Body: { content }
  */
async function sendMessage(req, res) {
  try {
    const senderId = req.user.id;
    const conversationId = req.params.conversationId;
    const { content } = req.body || {};

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'content is required' });
    }

    const convo = await Conversation.findByPk(conversationId);
    if (!convo) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    if (convo.userOneId !== senderId && convo.userTwoId !== senderId) {
      return res.status(403).json({ success: false, message: 'Access denied to this conversation' });
    }

    // Determine recipient
    const recipientId = convo.userOneId === senderId ? convo.userTwoId : convo.userOneId;

    const msg = await Message.create({
      senderId,
      recipientId,
      conversationId,
      subject: null,
      content,
      isRead: false
    });

    // Update conversation lastMessageAt
    await convo.update({ lastMessageAt: new Date() });

    // Create a notification entry if the model exists (soft dependency)
    try {
      const { Notification } = require('../models');
      if (Notification) {
        await Notification.create({
          userId: recipientId,
          type: 'message',
          payload: { conversationId, messageId: msg.id, fromUserId: senderId },
          isRead: false
        });
      }
    } catch (_) {
      // Notification model may not be present yet; skip silently
    }

    return res.status(201).json({ success: true, message: msg });
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

/**
  * Mark all received messages in a conversation as read
  * Params: :conversationId
  */
async function markConversationRead(req, res) {
  try {
    const currentUserId = req.user.id;
    const conversationId = req.params.conversationId;

    const convo = await Conversation.findByPk(conversationId);
    if (!convo) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }
    if (convo.userOneId !== currentUserId && convo.userTwoId !== currentUserId) {
      return res.status(403).json({ success: false, message: 'Access denied to this conversation' });
    }

    const [updatedCount] = await Message.update(
      { isRead: true },
      {
        where: {
          conversationId,
          recipientId: currentUserId,
          isRead: false
        }
      }
    );

    return res.status(200).json({ success: true, updated: updatedCount });
  } catch (err) {
    console.error('markConversationRead error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = {
  createOrGetConversation,
  listMyConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead
};