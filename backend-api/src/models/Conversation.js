import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
      default: 'direct',
    },
    // For direct chat: 2 participants, for group: multiple participants
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    // For group chat
    name: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String, // URL to group avatar
    },
    // Group admin (only for group type)
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Last message info for quick display
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: Date,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ 'lastMessage.timestamp': -1 });

// Method to check if user is participant
conversationSchema.methods.hasParticipant = function (userId) {
  return this.participants.some(p => p.toString() === userId.toString());
};

// Method to add participant (group only)
conversationSchema.methods.addParticipant = function (userId) {
  if (this.type === 'group' && !this.hasParticipant(userId)) {
    this.participants.push(userId);
  }
};

// Method to remove participant (group only)
conversationSchema.methods.removeParticipant = function (userId) {
  if (this.type === 'group') {
    this.participants = this.participants.filter(p => p.toString() !== userId.toString());
  }
};

// Method to get conversation info
conversationSchema.methods.getInfo = function (currentUserId) {
  const info = {
    _id: this._id,
    type: this.type,
    lastMessage: this.lastMessage,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };

  if (this.type === 'group') {
    info.name = this.name;
    info.description = this.description;
    info.avatar = this.avatar;
    info.admin = this.admin;
    info.participantCount = this.participants.length;
  } else {
    // For direct chat, return the other participant
    info.otherParticipant = this.participants.find(
      p => p.toString() !== currentUserId.toString()
    );
  }

  return info;
};

export default mongoose.model('Conversation', conversationSchema);
