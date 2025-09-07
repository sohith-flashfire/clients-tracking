import mongoose from "mongoose";

export const ClientSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  jobDeadline: {
    type: String,
    required: false,
    default: ""
  },
  dashboardInternName: {
    type: String,
    required: false,
    default: ""
  },
  dashboardTeamLeadName: {
    type: String,
    required: false,
    default: ""
  },
  planType: {
    type: String,
    enum: ["ignite", "professional", "executive"],
    required: true,
    default: "ignite"
  },
  planPrice: {
    type: Number,
    required: true,
    default: 199
  },
  gmailCredentials: {
    email: {
      type: String,
      required: false,
      default: ""
    },
    password: {
      type: String,
      required: false,
      default: ""
    }
  },
  createdAt: {
    type: String,
    default: () => new Date().toLocaleString('en-US', 'Asia/Kolkata'),
    required: true,
    immutable: true
  },
  updatedAt: {
    type: String,
    required: true,
    default: () => new Date().toLocaleString('en-US', 'Asia/Kolkata')
  }
});

export const ClientModel = mongoose.model('DashboardTracking', ClientSchema);
