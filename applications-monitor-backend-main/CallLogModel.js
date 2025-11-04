import mongoose from 'mongoose';

const CallLogSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'processing', 'completed', 'failed'],
      default: 'scheduled',
    },
    jobId: { type: String },
    attemptAt: { type: Date },
    error: { type: String },
    twilioCallSid: { type: String },
  },
  { timestamps: true }
);

export const CallLogModel =
  mongoose.models.CallLog || mongoose.model('CallLog', CallLogSchema);


