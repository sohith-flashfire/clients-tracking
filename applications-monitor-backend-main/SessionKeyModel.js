import mongoose from "mongoose";

export const SessionKeySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  sessionKey: {
    type: String,
    required: true,
    unique: true
  },
  isUsed: {
    type: Boolean,
    required: true,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: String,
    default: () => new Date().toLocaleString('en-US', 'Asia/Kolkata'),
    required: true,
    immutable: true
  },
  usedAt: {
    type: String,
    required: false
  }
});

export const SessionKeyModel = mongoose.model('SessionKey', SessionKeySchema);
