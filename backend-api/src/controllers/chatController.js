import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Get all conversations for current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId,
      isDeleted: false,
    })
      .populate('participants', 'name email avatar role company department')
      .populate('lastMessage.sender', 'name avatar')
      .sort({ 'lastMessage.timestamp': -1, updatedAt: -1 });

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          'readBy.user': { $ne: userId },
          isDeleted: false,
        });

        const convObj = conv.toObject();
        convObj.unreadCount = unreadCount;
        
        // For direct chat, get other participant info
        if (conv.type === 'direct') {
          convObj.otherParticipant = conv.participants.find(
            p => p._id.toString() !== userId.toString()
          );
        }

        return convObj;
      })
    );

    res.json({
      success: true,
      count: conversationsWithUnread.length,
      conversations: conversationsWithUnread,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get or create direct conversation with another user
export const getOrCreateDirectConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ success: false, message: 'otherUserId is required' });
    }

    if (userId === otherUserId) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [userId, otherUserId], $size: 2 },
      isDeleted: false,
    })
      .populate('participants', 'name email avatar role company department')
      .populate('lastMessage.sender', 'name avatar');

    // If not exist, create new
    if (!conversation) {
      conversation = await Conversation.create({
        type: 'direct',
        participants: [userId, otherUserId],
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar role company department');
    }

    // Add otherParticipant for frontend
    const convObj = conversation.toObject();
    convObj.otherParticipant = convObj.participants.find(
      p => p._id.toString() !== userId
    );

    res.json({
      success: true,
      conversation: convObj,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create group conversation
export const createGroupConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, participantIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Group name is required' });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one participant is required' });
    }

    // Get creator info
    const creator = await User.findById(userId);
    if (!creator) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Add creator to participants if not included
    const uniqueParticipants = [...new Set([userId, ...participantIds])];

    const conversation = await Conversation.create({
      type: 'group',
      name: name.trim(),
      description: description?.trim(),
      participants: uniqueParticipants,
      admin: userId,
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email avatar role company department')
      .populate('admin', 'name email avatar');

    // Create system message with creator name
    await Message.create({
      conversation: conversation._id,
      sender: userId,
      content: `${creator.name} đã tạo nhóm`,
      type: 'system',
    });

    res.status(201).json({
      success: true,
      conversation: populatedConversation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get messages in a conversation
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.hasParticipant(userId)) {
      return res.status(403).json({ success: false, message: 'You are not a participant' });
    }

    // Build query
    const query = {
      conversation: conversationId,
      isDeleted: false,
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'name email avatar role')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: messages.length,
      messages: messages.reverse().map(m => m.getPublicProfile()),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { content, type = 'text', replyTo } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.hasParticipant(userId)) {
      return res.status(403).json({ success: false, message: 'You are not a participant' });
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      content: content.trim(),
      type,
      replyTo: replyTo || null,
      readBy: [{ user: userId, readAt: new Date() }], // Mark as read by sender
    });

    // Update conversation's last message
    conversation.lastMessage = {
      content: content.trim(),
      sender: userId,
      timestamp: message.createdAt,
    };
    await conversation.save();

    // Populate message
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar role')
      .populate('replyTo');

    res.status(201).json({
      success: true,
      message: populatedMessage.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { messageIds } = req.body;

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.hasParticipant(userId)) {
      return res.status(403).json({ success: false, message: 'You are not a participant' });
    }

    let query = {
      conversation: conversationId,
      sender: { $ne: userId }, // Don't mark own messages as read
      'readBy.user': { $ne: userId }, // Not already read
      isDeleted: false,
    };

    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      query._id = { $in: messageIds };
    }

    // Mark all unread messages as read
    const result = await Message.updateMany(
      query,
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date(),
          },
        },
      }
    );

    res.json({
      success: true,
      markedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete message (soft delete)
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only sender can delete their own message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add participants to group (admin only)
export const addParticipants = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'userIds is required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({ success: false, message: 'Only group conversations can add participants' });
    }

    if (conversation.admin.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only group admin can add participants' });
    }

    // Add participants
    userIds.forEach(uid => conversation.addParticipant(uid));
    await conversation.save();

    // Create system message
    const user = await User.findById(userId);
    await Message.create({
      conversation: conversationId,
      sender: userId,
      content: `${user.name} đã thêm ${userIds.length} thành viên mới`,
      type: 'system',
    });

    const updatedConversation = await Conversation.findById(conversationId)
      .populate('participants', 'name email avatar role company department')
      .populate('admin', 'name email avatar');

    res.json({
      success: true,
      conversation: updatedConversation,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Leave group
export const leaveGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (conversation.type !== 'group') {
      return res.status(400).json({ success: false, message: 'Only group conversations can be left' });
    }

    if (!conversation.hasParticipant(userId)) {
      return res.status(400).json({ success: false, message: 'You are not a participant' });
    }

    // Remove participant
    conversation.removeParticipant(userId);

    // If admin leaves, assign new admin
    if (conversation.admin.toString() === userId && conversation.participants.length > 0) {
      conversation.admin = conversation.participants[0];
    }

    await conversation.save();

    // Create system message
    const user = await User.findById(userId);
    await Message.create({
      conversation: conversationId,
      sender: userId,
      content: `${user.name} đã rời khỏi nhóm`,
      type: 'system',
    });

    res.json({
      success: true,
      message: 'Left conversation',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
