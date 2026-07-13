import express from 'express';
import upload from '../middleware/upload.js';
import {
  getConversations,
  getOrCreateDirectConversation,
  createGroupConversation,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  addParticipants,
  leaveGroup,
  toggleReaction,
} from '../controllers/chatController.js';

const router = express.Router();

// Conversation routes
router.get('/conversations', getConversations);
router.post('/conversations/direct', getOrCreateDirectConversation);
router.post('/conversations/group', createGroupConversation);

// Message routes
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', upload.single('file'), sendMessage);
router.post('/conversations/:conversationId/read', markMessagesAsRead);
router.delete('/messages/:messageId', deleteMessage);
router.post('/messages/:messageId/react', toggleReaction);

// Group management routes
router.post('/conversations/:conversationId/participants', addParticipants);
router.post('/conversations/:conversationId/leave', leaveGroup);

export default router;
