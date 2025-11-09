import mongoose from 'mongoose';

const classSessionSchema = new mongoose.Schema({
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassTemplate', required: true },
  start: { type: Date, required: true },
  end:   { type: Date, required: true },
  capacity: { type: Number, required: true },
  price: { type: Number, required: true },
  spotsTaken: { type: Number, default: 0 },
  status: { type: String, enum: ['scheduled','cancelled'], default: 'scheduled' },
}, { timestamps: true });

classSessionSchema.index({ start: 1 });
classSessionSchema.index({ template: 1, start: 1 }, { unique: true }); // prevent dupes

export default mongoose.model('ClassSession', classSessionSchema);
