import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    customer: {
      type: String,
      required: true,
      trim: true,
    },
    line: {
      type: String,
      enum: ['Line 1', 'Line 2', 'Line 3'],
      required: true,
    },
    pm: {
      type: String,
      required: true,
      trim: true,
    },
    pmUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['planning', 'on-track', 'at-risk', 'overdue', 'done'],
      default: 'planning',
    },
    start: {
      type: String,
      required: true,
    },
    due: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      min: 0,
    },
    tasksTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    tasksDone: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
projectSchema.index({ code: 1 });
projectSchema.index({ line: 1, status: 1 });
projectSchema.index({ pm: 1 });
projectSchema.index({ isDeleted: 1, createdAt: -1 });
projectSchema.index({ customer: 'text', name: 'text' }); // Text search

// Auto-calculate progress from tasks
projectSchema.pre('save', function(next) {
  if (this.tasksTotal > 0) {
    this.progress = Math.round((this.tasksDone / this.tasksTotal) * 100);
  } else {
    this.progress = 0;
  }
  next();
});

// Method to get public profile
projectSchema.methods.getPublicProfile = function() {
  return {
    id: this._id.toString(),
    code: this.code,
    name: this.name,
    customer: this.customer,
    line: this.line,
    pm: this.pm,
    pmUserId: this.pmUserId,
    progress: this.progress,
    status: this.status,
    start: this.start,
    due: this.due,
    budget: this.budget,
    tasksTotal: this.tasksTotal,
    tasksDone: this.tasksDone,
    description: this.description,
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Static method to get statistics
projectSchema.statics.getStatistics = async function() {
  const total = await this.countDocuments({ isDeleted: false });
  const byStatus = await this.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const byLine = await this.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: '$line', count: { $sum: 1 } } },
  ]);

  return {
    total,
    byStatus: byStatus.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byLine: byLine.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
  };
};

export default mongoose.model('Project', projectSchema);
