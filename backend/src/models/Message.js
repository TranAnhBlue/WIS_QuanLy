import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Message type
    type: {
      type: String,
      enum: ['text', 'file', 'image', 'video', 'system'],
      default: 'text',
    },
    // For file/image messages
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    filePublicId: { type: String, select: false },
    fileResourceType: { type: String, select: false },
    // Read status - array of user IDs who have read this message
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Reactions - array of emoji reactions
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      emoji: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Reply to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, isDeleted: 1, createdAt: -1 });

// Method to mark message as read by a user
messageSchema.methods.markAsRead = function (userId) {
  const alreadyRead = this.readBy.some(r => r.user.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
  }
};

// Method to check if message is read by user
messageSchema.methods.isReadBy = function (userId) {
  return this.readBy.some(r => r.user.toString() === userId.toString());
};

// Method to get public profile
messageSchema.methods.getPublicProfile = function () {
  return {
    _id: this._id,
    conversation: this.conversation,
    sender: this.sender,
    content: this.isDeleted ? '[Tin nhắn đã bị xóa]' : this.content,
    type: this.type,
    fileUrl: this.fileUrl,
    fileName: this.fileName,
    fileSize: this.fileSize,
    readBy: this.readBy,
    reactions: this.reactions,
    replyTo: this.replyTo,
    isDeleted: this.isDeleted,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model('Message', messageSchema);
