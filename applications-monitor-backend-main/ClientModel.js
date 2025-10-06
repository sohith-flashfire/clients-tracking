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
  applicationStartDate: {
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
  onboardingDate: {
    type: String,
    required: false,
    default: ""
  },
  whatsappGroupMade: {
    type: Boolean,
    required: false,
    default: false
  },
  whatsappGroupMadeDate: {
    type: String,
    required: false,
    default: ""
  },
  dashboardCredentialsShared: {
    type: Boolean,
    required: false,
    default: false
  },
  dashboardCredentialsSharedDate: {
    type: String,
    required: false,
    default: ""
  },
  resumeSent: {
    type: Boolean,
    required: false,
    default: false
  },
  resumeSentDate: {
    type: String,
    required: false,
    default: ""
  },
  coverLetterSent: {
    type: Boolean,
    required: false,
    default: false
  },
  coverLetterSentDate: {
    type: String,
    required: false,
    default: ""
  },
  portfolioMade: {
    type: Boolean,
    required: false,
    default: false
  },
  portfolioMadeDate: {
    type: String,
    required: false,
    default: ""
  },
  linkedinOptimization: {
    type: Boolean,
    required: false,
    default: false
  },
  linkedinOptimizationDate: {
    type: String,
    required: false,
    default: ""
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
  dashboardCredentials: {
    username: {
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
  linkedinCredentials: {
    username: {
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
  amountPaid: {
    type: Number,
    required: false,
    default: 0
  },
  amountPaidDate: {
    type: String,
    required: false,
    default: ""
  },
  modeOfPayment: {
    type: String,
    enum: ["paypal", "wire_transfer", "inr"],
    required: false,
    default: "paypal"
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    required: false,
    default: "active"
  },
  jobStatus: {
    type: String,
    enum: ["still_searching", "job_done"],
    required: false,
    default: "still_searching"
  },
  companyName: {
    type: String,
    required: false,
    default: ""
  },
  lastApplicationDate: {
    type: String,
    required: false,
    default: ""
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
