import mongoose from 'mongoose';

const businessRecordSchema = new mongoose.Schema({
  resource: { type: String, required: true, index: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, minimize: false });

businessRecordSchema.index({ resource: 1, createdAt: -1 });

export default mongoose.model('BusinessRecord', businessRecordSchema);
