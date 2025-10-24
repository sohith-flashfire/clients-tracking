import express from 'express';
import mongoose from 'mongoose';
import { JobModel } from './JobModel.js';
import { ClientModel } from './ClientModel.js';
import { UserModel } from './UserModel.js';
import { SessionKeyModel } from './SessionKeyModel.js';
import { ManagerModel } from './ManagerModel.js';
import OperationsModel from './OperationsModel.js';
import cors from 'cors'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import CreateCampaign from './controllers/NewCampaign.js';
import { decode, encode} from './utils/CodeExaminer.js';
import { LinkCampaignUtm, Click } from './schema_models/UtmSchema.js';
import { 
  getAllManagers, 
  getManagerById, 
  createManager, 
  updateManager, 
  deleteManager, 
  uploadProfilePhoto 
} from './controllers/ManagerController.js';
import { upload } from './utils/cloudinary.js';
import { encrypt } from './utils/CryptoHelper.js';
import { NewUserModel } from './schema_models/UserModel.js';




// Environment Variables
const PORT = process.env.PORT || 10000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error('❌ Cloudinary environment variables are required');
  process.exit(1);
}

const app = express();
// app.use(cors({
//   origin: process.env.CORS_ORIGIN || 'https://dashboardtracking.vercel.app',
//   credentials: true
// }));
// app.use(express.json());
const allowedOrigins = [
  // Development origins
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  
  // Production origins
  "https://flashfire-frontend-hoisted.vercel.app",
  "https://flashfirejobs.com",
  "https://www.flashfirejobs.com",
  "https://flashfire-frontend-hoisted.vercel.app/",
  "https://utm-track-frontend.vercel.app",
  "https://dashboardtracking.vercel.app",
  "https://clients-tracking.vercel.app",
  "https://dashboardtracking.vercel.app/",
  "https://portal.flashfirejobs.com",
  "https://www.portal.flashfirejobs.com",
  "https://flashfire-dashboard-frontend.vercel.app",
  "https://flashfire-dashboard.vercel.app",
  "https://hq.flashfirejobs.com/",
  "https://hq.flashfirejobs.com",
  
  // Additional origins from environment variable
  ...(process.env.ALLOWED_ORIGINS?.split(",") || [])
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow non-browser requests
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options(/.*/, cors());

app.use(express.json());
//Helpers
// function getClientIP(req) {
//   const xff = req.headers["x-forwarded-for"];
//   if (typeof xff === "string" && xff.length > 0) {
//     // may contain multiple IPs: "client, proxy1, proxy2"
//     return xff.split(",")[0].trim();
//   }
//   const ip = req.socket?.remoteAddress || req.ip || "";
//   // strip IPv6 prefix like '::ffff:'
//   return ip.replace(/^::ffff:/, "");
// }

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// Middleware to check admin role
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

const ConnectDB = () => mongoose.connect(process.env.MONGODB_URI, {
                                                                    maxPoolSize: 10,
                                                                    minPoolSize: 1,
                                                                    // Keep idle pooled connections up to 24h before pool closes them
                                                                    maxIdleTimeMS: 86_400_000,
                                                                    // Allow long-running operations / idle socket without killing it
                                                                    socketTimeoutMS: 86_400_000,     // (0 means "no timeout" but can mask hangs; 24h is safer)
                                                                    // How long to try to find a server if cluster momentarily unavailable
                                                                    serverSelectionTimeoutMS: 10_000,
                                                                    // (optional) heartbeatFrequencyMS: 10000,
                                                                    })
                        .then(() => console.log("✅ Database connected successfully"))
                                    .catch((error) => {
                                        console.error("❌ Database connection failed:", error);
                                        process.exit(1);
                                    });
ConnectDB();

// Admin users are managed manually in the database
// No automatic admin user creation

// Clean up invalid session keys
const cleanupSessionKeys = async () => {
  try {
    // Try to drop and recreate the collection to fix index issues
    try {
      await SessionKeyModel.collection.drop();
      console.log('🗑️  Dropped sessionkeys collection');
    } catch (dropError) {
      // Collection might not exist, that's okay
      console.log('ℹ️  Sessionkeys collection did not exist');
    }
    
    // Recreate the collection
    await SessionKeyModel.createCollection();
    console.log('✅ Recreated sessionkeys collection with proper indexes');
  } catch (error) {
    console.error('❌ Error cleaning up session keys:', error);
  }
};

// Clean up session keys after database connection
setTimeout(async () => {
  await cleanupSessionKeys();
}, 2000);
        //get all the jobdatabase data..
const getAllJobs = async (req, res)=> {
    const jobDB = await JobModel.find().select('-jobDescription').lean();
    res.status(200).json({jobDB});
}

// Client management endpoints
const getAllClients = async (req, res) => {
    try {
        // Fetch clients from users collection instead of dashboardtrackings
        const users = await NewUserModel.find({ userType: "User" }).lean();
        
        // Transform the data to match the expected format
        const clients = users.map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            planType: user.planType,
            dashboardManager: user.dashboardManager, // This will show the actual manager name
            status: 'active', // Default all users to active status
            userID: user.userID,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));
        
        console.log(`Fetched ${clients.length} clients from users collection`);
        res.status(200).json({clients});
    } catch (error) {
        console.error('Error fetching clients from users collection:', error);
        res.status(500).json({error: error.message});
    }
}

const getClientByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const client = await ClientModel.findOne({ email: email.toLowerCase() }).lean();
        if (!client) {
            return res.status(404).json({error: 'Client not found'});
        }
        
        // Get manager name from users collection
        const user = await NewUserModel.findOne({ email: email.toLowerCase() }).lean();
        const managerName = user?.dashboardManager || '';
        
        // Add manager name to client data
        const clientWithManager = {
            ...client,
            dashboardManager: managerName
        };
        
        res.status(200).json({client: clientWithManager});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

// Get client onboarding statistics grouped by month
const getClientStats = async (req, res) => {
    try {
        // Start from August 2025 instead of 12 months ago
        const startDate = new Date('2025-08-01');
        startDate.setHours(0, 0, 0, 0);

        // Aggregate clients by month from August 2025 onwards
        const monthlyStats = await NewUserModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Get total clients
        const totalClients = await NewUserModel.countDocuments();

        // Get current month stats
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const currentMonthCount = monthlyStats.find(
            stat => stat._id.month === currentMonth && stat._id.year === currentYear
        )?.count || 0;

        // Get last month stats
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const lastMonthCount = monthlyStats.find(
            stat => stat._id.month === lastMonth && stat._id.year === lastMonthYear
        )?.count || 0;

        // Calculate growth percentage
        const growthPercentage = lastMonthCount > 0 
            ? ((currentMonthCount - lastMonthCount) / lastMonthCount * 100).toFixed(1)
            : currentMonthCount > 0 ? 100 : 0;

        // Format monthly data for charts from August 2025 onwards
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const formattedMonthlyData = [];
        const currentDate = new Date();
        const startDateForLoop = new Date('2025-08-01');
        
        // Generate months from August 2025 to current month
        for (let date = new Date(startDateForLoop); date <= currentDate; date.setMonth(date.getMonth() + 1)) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            
            const statsForMonth = monthlyStats.find(
                stat => stat._id.month === month && stat._id.year === year
            );
            
            formattedMonthlyData.push({
                month: `${monthNames[month - 1]} ${year}`,
                count: statsForMonth?.count || 0,
                year,
                monthNumber: month
            });
        }

        res.status(200).json({
            success: true,
            data: {
                totalClients,
                currentMonthCount,
                lastMonthCount,
                growthPercentage: parseFloat(growthPercentage),
                monthlyData: formattedMonthlyData,
                rawMonthlyStats: monthlyStats
            }
        });
    } catch (error) {
        console.error('Error fetching client statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch client statistics',
            error: error.message
        });
    }
};

// (Auth routes removed)

export const createOrUpdateClient = async (req, res) => {
  try {
    const {
      currentPath,
      email,
      password,
      name,
      jobDeadline,
      applicationStartDate,
      dashboardInternName,
      dashboardTeamLeadName,
      planType,
      onboardingDate,
      whatsappGroupMade,
      whatsappGroupMadeDate,
      dashboardCredentialsShared,
      dashboardCredentialsSharedDate,
      resumeSent,
      resumeSentDate,
      coverLetterSent,
      coverLetterSentDate,
      portfolioMade,
      portfolioMadeDate,
      linkedinOptimization,
      linkedinOptimizationDate,
      gmailCredentials,
      dashboardCredentials,
      linkedinCredentials,
      amountPaid,
      amountPaidDate,
      modeOfPayment,
      status,
    } = req.body;

    const emailLower = email.toLowerCase();
    const planPrices = { ignite: 199, professional: 349, executive: 599 };
    const dashboardManager = dashboardTeamLeadName;

    const capitalizedPlan =
      planType?.trim()?.toLowerCase() === "ignite"
        ? "Ignite"
        : planType?.trim()?.toLowerCase() === "professional"
        ? "Professional"
        : planType?.trim()?.toLowerCase() === "executive"
        ? "Executive"
        : "Free Trial";

    const userData = {
      name,
      email: emailLower,
      passwordHashed: password ? encrypt(password) : encrypt("flashfire@123"),
      planType: capitalizedPlan,
      userType: "User",
      dashboardManager,
    };

    // ✅ if it's a "new client" path
    if (currentPath?.includes("/clients/new")) {
      const existingUser = await NewUserModel.findOne({ email: emailLower });

      // CREATE new user + client tracking if not exists
      if (!existingUser) {
        const newUser = await NewUserModel.create(userData);

        const fullClientData = {
          email: emailLower,
          name,
          jobDeadline: jobDeadline || " ",
          applicationStartDate: applicationStartDate || " ",
          dashboardInternName: dashboardInternName || " ",
          dashboardTeamLeadName,
          planType: planType?.toLowerCase() || "ignite",
          planPrice: planPrices[planType?.toLowerCase()] || 199,
          onboardingDate: onboardingDate || new Date().toISOString(),
          whatsappGroupMade: whatsappGroupMade ?? false,
          whatsappGroupMadeDate: whatsappGroupMadeDate || " ",
          dashboardCredentialsShared: dashboardCredentialsShared ?? false,
          dashboardCredentialsSharedDate: dashboardCredentialsSharedDate || " ",
          resumeSent: resumeSent ?? false,
          resumeSentDate: resumeSentDate || " ",
          coverLetterSent: coverLetterSent ?? false,
          coverLetterSentDate: coverLetterSentDate || " ",
          portfolioMade: portfolioMade ?? false,
          portfolioMadeDate: portfolioMadeDate || " ",
          linkedinOptimization: linkedinOptimization ?? false,
          linkedinOptimizationDate: linkedinOptimizationDate || " ",
          gmailCredentials: gmailCredentials || { email: "", password: "" },
          dashboardCredentials: dashboardCredentials || {
            username: "",
            password: "",
          },
          linkedinCredentials: linkedinCredentials || {
            username: "",
            password: "",
          },
          amountPaid: amountPaid || 0,
          amountPaidDate: amountPaidDate || " ",
          modeOfPayment: modeOfPayment || "paypal",
          status: status || "active",
          updatedAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
        };

        const newTracking = await ClientModel.create(fullClientData);
        return res.status(200).json({
          message: "✅ New client created successfully",
          newUser,
          newTracking,
        });
      }

      // 🔄 if exists → partial update only
      await NewUserModel.updateOne({ email: emailLower }, { $set: userData });
      await ClientModel.updateOne(
        { email: emailLower },
        { $set: {dashboardTeamLeadName : dashboardManager} },
        { runValidators: false }
      );
      return res.status(200).json({
        message: "🟢 Existing client updated (partial update)",
      });
    }

    // ✅ if not /clients/new → partial update always
    await ClientModel.updateOne(
      { email: emailLower },
      { $set: req.body },
      { runValidators: false }
    );
    await NewUserModel.updateOne(
      { email: emailLower },
      { $set: { name ,planType: capitalizedPlan, dashboardManager: dashboardTeamLeadName } },
      { runValidators: false }
    );
const updatedClientsTracking = await ClientModel.findOne({ email: emailLower }).lean();


    return res
      .status(200)
      .json({ message: "🔄 Client fields updated successfully",updatedClientsTracking });
  } catch (error) {
    console.error("❌ Error in createOrUpdateClient:", error);
    res.status(500).json({ error: error.message });
  }
};


// const createOrUpdateClient = async (req, res) => {
//     try {
//       // const referer = req.headers.referer || "";
//         let {currentPath, email,password, name, jobDeadline, applicationStartDate, dashboardInternName, dashboardTeamLeadName, planType, onboardingDate, whatsappGroupMade, whatsappGroupMadeDate, dashboardCredentialsShared, dashboardCredentialsSharedDate, resumeSent, resumeSentDate,dashboardManager, coverLetterSent, coverLetterSentDate, portfolioMade, portfolioMadeDate, linkedinOptimization, linkedinOptimizationDate, gmailCredentials, dashboardCredentials, linkedinCredentials, amountPaid, amountPaidDate, modeOfPayment, status } = req.body;
//         dashboardManager = dashboardTeamLeadName;
//         // Set plan price based on plan type
//         const planPrices = {
//             ignite: 199,
//             professional: 349,
//             executive: 599,
//         };
//       const capitalizedPlan = (() => {
//       if (!planType) return "Free Trial";
//       const formatted = planType.trim().toLowerCase();
//       switch (formatted) {
//         case "ignite": return "Ignite";
//         case "professional": return "Professional";
//         case "executive": return "Executive";
//         default: return "Free Trial";
//       }
//     })();
//       const clientData = {
//             email: email.toLowerCase(),
//             name,
//             jobDeadline,
//             applicationStartDate,
//             dashboardInternName,
//             dashboardTeamLeadName,
//             planType,
//             planPrice: planPrices[planType] || 199,
//             onboardingDate,
//             whatsappGroupMade,
//             whatsappGroupMadeDate,
//             dashboardCredentialsShared,
//             dashboardCredentialsSharedDate,
//             resumeSent,
//             resumeSentDate,
//             coverLetterSent,
//             coverLetterSentDate,
//             portfolioMade,
//             portfolioMadeDate,
//             linkedinOptimization,
//             linkedinOptimizationDate,
//             gmailCredentials,
//             dashboardCredentials,
//             linkedinCredentials,
//             amountPaid,
//             amountPaidDate,
//             modeOfPayment,
//             status,
//             updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
//         };
// const userData = {
//       name,
//       email,
//       passwordHashed: password? encrypt(password): encrypt('flashfire@123'),
//       planType: capitalizedPlan, // ✅ matches UserModel enum
//       userType: "User",
//       dashboardManager,
      
//     };
        

// if (currentPath.includes("/clients/new")) {
//   // const capitalizedPlan = (() => {
//   //
//    //   if (!planType) return "Free Trial";
//      // const formatted = planType.trim().toLowerCase();
//    //   switch (formatted) {
//    //     case "ignite": return "Ignite";
//        // case "professional": return "Professional";
//         //case "executive": return "Executive";
//        // default: return "Free Trial";
//      // }
//    // })();
//   //       const userData = {
// //      name,
//     //  email,
//   //    passwordHashed: password? encrypt(password): encrypt('flashfire@123'),
// //      planType: capitalizedPlan, // ✅ matches UserModel enum
      
//   //    planLimit: null,
// //      userType: "User",
//     //  dashboardManager,
      
//   //  };
//   const checkExistanceinNewUser = await NewUserModel.findOne({email});
//   if(!checkExistanceinNewUser){
//    const client = await NewUserModel.findOneAndUpdate(
//       {email },
//       userData,
//       { upsert: true, new: true, runValidators: true }
//    );
//  // const client = await NewUserModel.findOne({email});
//     const clientTracking = await ClientModel.findOneAndUpdate(
//       {email},
//       {clientData},
//       {upsert: true, new : true, runValidators : true}
//     );
//     return res.status(200).json({message : 'new client created',client, clientTracking});
// }
// else{
//   if(req?.body?.dashboardManager){
//     const client = await NewUserModel.findOneAndUpdate(
//       {email},
//       userData,
//       {upsert : true, new : true, runValidators : true}

//     );
//     const clientTracking = await UserModel.findOneAndUpdate(
//       {email},
//       {dashboardTeamLeadName : dashboardManager},
//       {upsert : true, runValidators : true , new : true}
//     );
//     return res.status(200).json({message : `client details updated in [UserModel] && [DashBoardTracking]`});
//   }
  
// }
// }
        
       
//         else {//if (currentPath.includes("/monitor-clients")) {
//            const clientData = {
//             email: email.toLowerCase(),
//             name,
//             jobDeadline,
//             applicationStartDate,
//             dashboardInternName,
//             dashboardTeamLeadName,
//             planType,
//             planPrice: planPrices[planType] || 199,
//             onboardingDate,
//             whatsappGroupMade,
//             whatsappGroupMadeDate,
//             dashboardCredentialsShared,
//             dashboardCredentialsSharedDate,
//             resumeSent,
//             resumeSentDate,
//             coverLetterSent,
//             coverLetterSentDate,
//             portfolioMade,
//             portfolioMadeDate,
//             linkedinOptimization,
//             linkedinOptimizationDate,
//             gmailCredentials,
//             dashboardCredentials,
//             linkedinCredentials,
//             amountPaid,
//             amountPaidDate,
//             modeOfPayment,
//             status,
//             updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
//         };
        
//   const clientTracking = await ClientModel.findOneAndUpdate(
//             { email: email.toLowerCase() },
//             clientData,
//             { upsert: true, new: true, runValidators: true }
//         );
//        // return res.status(200).json({client});
//   const client = await NewUserModel.findOneAndUpdate(
//             {email},
//             {name, email, dashBoardManager : dashboardTeamLeadName, planType},
//             {upsert : true, new : true , runValidators : true}
//       );
//           res.status(200).json({message : `user details updated for client : ${ email} in [UserModel] && [DashboardTracking] `});
// }

// //         else {
// // //  console.log("⚠️ Unknown referer:", referer);
// // console.log(error)
// //   return res.status(400).json({
// //     success: false,
// //     message: "Invalid referer or unsupported frontend route",
// //   });
// // }
        
        
//     } catch (error) {
//       console.log(error)
//         res.status(500).json({error: error.message});
//     }
// }
// const createOrUpdateClient = async (req, res) => {
//   try {
//     const {
//       email,
//       password,
//       name,
//       jobDeadline,
//       applicationStartDate,
//       dashboardInternName,
//       dashboardTeamLeadName,
//       planType,
//       onboardingDate,
//       dashboardManager,
//       whatsappGroupMade,
//       whatsappGroupMadeDate,
//       dashboardCredentialsShared,
//       dashboardCredentialsSharedDate,
//       resumeSent,
//       resumeSentDate,
//       coverLetterSent,
//       coverLetterSentDate,
//       portfolioMade,
//       portfolioMadeDate,
//       linkedinOptimization,
//       linkedinOptimizationDate,
//       gmailCredentials,
//       dashboardCredentials,
//       linkedinCredentials,
//       amountPaid,
//       amountPaidDate,
//       modeOfPayment,
//       status,
//     } = req.body;

//     // -------------------- 🧩 Normalize planType for both schemas --------------------
//     // Capitalized for UserModel, lowercase for ClientModel
//     const capitalizedPlan = (() => {
//       if (!planType) return "Free Trial";
//       const formatted = planType.trim().toLowerCase();
//       switch (formatted) {
//         case "ignite": return "Ignite";
//         case "professional": return "Professional";
//         case "executive": return "Executive";
//         default: return "Free Trial";
//       }
//     })();

//     const lowercasePlan = (() => {
//       if (!planType) return "ignite";
//       const formatted = planType.trim().toLowerCase();
//       switch (formatted) {
//         case "ignite": return "ignite";
//         case "professional": return "professional";
//         case "executive": return "executive";
//         default: return "ignite";
//       }
//     })();

//     // -------------------- 💵 Set plan price --------------------
//     const planPrices = {
//       ignite: 199,
//       professional: 349,
//       executive: 599,
//     };

//     // -------------------- 👤 Create or Update NewUserModel --------------------
//     const userData = {
//       name,
//       email,
//       passwordHashed: await encrypt(password),
//       resumeLink: [],
//       coverLetters: [],
//       optimizedResumes: [],
//       planType: capitalizedPlan, // ✅ matches UserModel enum
      
//       planLimit: null,
//       userType: "User",
//       dashboardManager,
      
//     };

//     await NewUserModel.findOneAndUpdate(
//       { email },
//       userData,
//       { upsert: true, new: true, runValidators: true }
//     );

//     // -------------------- 📋 Create or Update ClientModel --------------------
//     const clientData = {
//       email: email.toLowerCase(),
//       name,
//       password,
//       jobDeadline,
//       applicationStartDate,
//       dashboardInternName,
//       dashboardTeamLeadName,
//       planType: lowercasePlan, // ✅ matches ClientModel enum
//       planPrice: planPrices[lowercasePlan] || 199,
//       onboardingDate,
//       whatsappGroupMade,
//       whatsappGroupMadeDate,
//       dashboardCredentialsShared,
//       dashboardCredentialsSharedDate,
//       resumeSent,
//       resumeSentDate,
//       coverLetterSent,
//       coverLetterSentDate,
//       portfolioMade,
//       portfolioMadeDate,
//       linkedinOptimization,
//       linkedinOptimizationDate,
//       gmailCredentials,
//       dashboardCredentials,
//       linkedinCredentials,
//       amountPaid,
//       amountPaidDate,
//       modeOfPayment,
      
//       status,
//       updatedAt: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
//     };

//     const client = await ClientModel.findOneAndUpdate(
//       { email: email.toLowerCase() },
//       clientData,
//       { upsert: true, new: true, runValidators: true }
//     );

//     res.status(200).json({ client });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: error.message });
//   }
// };


// Authentication endpoints
const login = async (req, res) => {
  try {
    const { email, password, sessionKey } = req.body;
    
    // Find user
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If user is team_lead, verify session key
    if (user.role === 'team_lead') {
      if (!sessionKey) {
        return res.status(400).json({ error: 'Session key required for team leads' });
      }

      const sessionKeyDoc = await SessionKeyModel.findOne({ 
        key: sessionKey, 
        userEmail: email.toLowerCase(),
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (!sessionKeyDoc) {
        return res.status(401).json({ error: 'Invalid or expired session key' });
      }

      // Mark session key as used
      sessionKeyDoc.isUsed = true;
      sessionKeyDoc.usedAt = new Date().toLocaleString('en-US', 'Asia/Kolkata');
      await sessionKeyDoc.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new user (admin only)
const createUser = async (req, res) => {
  try {
    const { email, password, role = 'team_lead' } = req.body;
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
    });

    await user.save();
    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate session key (admin only)
const generateSessionKey = async (req, res) => {
  try {
    const { userEmail } = req.body;
    
    // Check if user exists and is team_lead
    const user = await UserModel.findOne({ 
      email: userEmail.toLowerCase(), 
      role: 'team_lead',
      isActive: true 
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Team lead user not found' });
    }

    // Generate unique session key with retry logic
    let sessionKey;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      // Generate a more robust session key with timestamp and random
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 10).toUpperCase();
      sessionKey = `FF${timestamp}${random}`;
      attempts++;
      
      // Check if this key already exists
      const existingKey = await SessionKeyModel.findOne({ key: sessionKey });
      if (!existingKey) break;
      
      if (attempts >= maxAttempts) {
        return res.status(500).json({ error: 'Failed to generate unique session key after multiple attempts' });
      }
    } while (true);

    const sessionKeyDoc = new SessionKeyModel({
      key: sessionKey,
      userEmail: userEmail.toLowerCase()
    });

    await sessionKeyDoc.save();

    res.status(201).json({
      message: 'Session key generated successfully',
      sessionKey,
      userEmail: userEmail.toLowerCase(),
      expiresAt: sessionKeyDoc.expiresAt
    });
  } catch (error) {
    console.error('Session key generation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({}, { password: 0 });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get session keys for a user (admin only)
const getUserSessionKeys = async (req, res) => {
  try {
    const { userEmail } = req.params;
    const sessionKeys = await SessionKeyModel.find({ 
      userEmail: userEmail.toLowerCase() 
    }).sort({ createdAt: -1 });
    
    res.status(200).json({ sessionKeys });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new job
const createJob = async (req, res) => {
    try {
        const jobData = {
            ...req.body,
            createdAt: new Date().toLocaleString('en-US', 'Asia/Kolkata'),
            updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
        };
        
        const job = new JobModel(jobData);
        await job.save();
        res.status(201).json({job});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

// Clean up session keys endpoint (admin only)
const cleanupSessionKeysEndpoint = async (req, res) => {
  try {
    // Drop the entire collection to remove corrupted indexes
    await SessionKeyModel.collection.drop().catch(() => {
      // Collection might not exist, that's okay
    });
    
    // Recreate the collection with proper schema
    await SessionKeyModel.createCollection();
    
    res.status(200).json({
      message: 'Session keys collection reset successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify credentials (for two-step login)
const verifyCredentials = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ 
      email: email.toLowerCase(), 
      isActive: true 
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({
      message: 'Credentials verified',
      role: user.role,
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    // Delete user
    await UserModel.findByIdAndDelete(userId);
    
    // Also delete any session keys for this user
    await SessionKeyModel.deleteMany({ userEmail: user.email });

    res.status(200).json({
      message: 'User deleted successfully',
      deletedUser: { email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//campaign routes

// app.post("/api/track/utm-campaign-lead", async (req, res) => {
//   try {
//     const { clientName, clientEmail, clientPhone, utmSource } = req.body;

//     if (!utmSource || !clientEmail) {
//       return res.status(400).json({ error: "utmSource and clientEmail are required" });
//     }

//     // 🔍 Find campaign that has a matching utm_source
//     const campaign = await LinkCampaignUtm.findOne({
//       "utm_source.utm_source": utmSource
//     });

//     if (!campaign) {
//       return res.status(404).json({ message: "No campaign found for this utmSource" });
//     }

//     // Get the specific UTM object inside the campaign
//     const utmEntry = campaign.utm_source.find(
//       (s) => s.utm_source === utmSource
//     );

//     if (!utmEntry) {
//       return res.status(404).json({ message: "UTM not found inside campaign" });
//     }

//     // Check if clientEmail already exists
//     const alreadyExists = utmEntry.conversions.some(
//       (c) => c.clientEmail.toLowerCase() === clientEmail.toLowerCase()
//     );

//     if (alreadyExists) {
//       return res.status(200).json({ message: "Client already exists, not added again" });
//     }

//     // Add new conversion
//     utmEntry.conversions.push({
//       clientName,
//       clientEmail,
//       clientPhone: clientPhone || "Not Provided",
//       bookingDate: new Date()
//     });

//     await campaign.save();

//     return res.status(201).json({
//       message: "✅ Conversion added successfully",
//       conversion: { clientName, clientEmail, clientPhone }
//     });
//   } catch (error) {
//     console.error("❌ Error in /api/track/utm-campaign-lead:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });
// app.post("/api/campaign/create", CreateCampaign);

// app.post("/api/track", async (req, res) => {
//   try {
//     const {
//       ref,
//       userAgent,
//       screenWidth,
//       screenHeight,
//       language,
//       timezone,
//     } = req.body;

//     if (!ref) {
//       return res.status(400).json({ ok: false, message: "Missing ref code" });
//     }

//     // Extract visitor IP
//     const ip =
//       req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
//       req.socket.remoteAddress;

//     // Decode ref back into campaign + campaigner
//     const { campaignName, campaignerName } = decode(ref);

//     // Find campaign
//     const campaign = await LinkCampaignUtm.findOne({
//       campaign_name: campaignName,
//     });
//     if (!campaign) {
//       return res.status(404).json({ ok: false, message: "Campaign not found" });
//     }

//     // Find campaigner in campaign
//     const source = campaign.utm_source.find(
//       (s) => s.utm_source.toLowerCase() === campaignerName.toLowerCase()
//     );
//     if (!source) {
//       return res
//         .status(404)
//         .json({ ok: false, message: "Campaigner not found" });
//     }

//     /* ------------------- Log Click (detailed) ------------------- */
//     await Click.create({
//       link_code: source.link_code,  // ✅ FIXED
//       utm_source: source.utm_source,
//       utm_campaign: campaignName,
//       ip,
//       timestamp: new Date(),
//       userAgent,
//       screenWidth,
//       screenHeight,
//       language,
//       timezone,
//     });

//     /* ------------------- Update Aggregates ------------------- */
//     source.total_clicks += 1;

//     if (!source.unique_ips.includes(ip)) {
//       source.unique_ips.push(ip);
//       source.unique_clicks = source.unique_ips.length;
//     }

//     await campaign.save();

//     return res.json({
//       ok: true,
//       message: "Click tracked successfully",
//       campaignName,
//       campaignerName,
//       utm_source: source.utm_source,
//       link_code: source.link_code,   // ✅ send back too
//       ip,
//       total: source.total_clicks,
//       unique: source.unique_clicks,
//     });
//   } catch (err) {
//     console.error("Error in tracking:", err);
//     return res.status(500).json({ ok: false, error: "server_error" });
//   }
// });

// // Track and (optionally) redirect
// app.get("/r/:code", async (req, res) => {
//   try {
//     const { code } = req.params;
//     const doc = await LinkCampaignUtm.findOne({ code });
//     if (!doc) return res.status(404).send("Invalid link");

//     const ip = getClientIP(req);
//     // total clicks increments always
//     doc.totalClicks += 1;

//     // unique IP logic
//     if (!doc.uniqueIPs.includes(ip)) {
//       doc.uniqueIPs.push(ip);
//       doc.uniqueCount = doc.uniqueIPs.length;
//     }
//     await doc.save();

//     // Simple landing message (you can change to a redirect if you want)
//     res.type("html").send(`
//       <html>
//         <head><title>Thanks for visiting</title></head>
//         <body style="font-family: sans-serif; padding: 24px;">
//           <h1>Thanks for visiting via ${doc.campaignerName}'s link</h1>
//           <p>Campaign: <b>${doc.campaignName}</b></p>
//           <p>This IP is counted once. Total unique visitors so far: <b>${doc.uniqueCount}</b></p>
//         </body>
//       </html>
//     `);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });

// // Admin report: list all links with counts
// app.get("/api/report", async (_req, res) => {
//   try {
//     const baseUrl = "https://flashfirejobs.com";

//     const campaigns = await LinkCampaignUtm.find({}, { __v: 0 })
//       .sort({ createdAt: -1 })
//       .lean();

//     const rows = campaigns.map((campaign) => {
//       // calculate campaign-level totals
//       const totalClicks = campaign.utm_source.reduce(
//         (sum, s) => sum + (s.total_clicks || 0),
//         0
//       );
//       const totalUniques = campaign.utm_source.reduce(
//         (sum, s) => sum + (s.unique_clicks || 0),
//         0
//       );

//       return {
//         _id: campaign._id,
//         campaign_name: campaign.campaign_name,
//         link_code: campaign.link_code,
//         createdAt: campaign.createdAt,
//         totalClicks,
//         totalUniques,
//         campaigners: campaign.utm_source.map((s) => ({
//           utm_source: s.utm_source,
//           total_clicks: s.total_clicks,
//           unique_clicks: s.unique_clicks,
//           link: `${baseUrl}?ref=${encode(
//             campaign.campaign_name,
//             s.utm_source
//           )}`,
//           conversions: s.conversions || []   // ✅ include conversions here
//         })),
//       };
//     });

//     res.json({ ok: true, rows });
//   } catch (err) {
//     console.error("Error generating report:", err);
//     res.status(500).json({ ok: false, error: "server_error" });
//   }
// });



// // Optional: get report by campaign
// app.get("/api/report/:campaignName", async (req, res) => {
//   const { campaignName } = req.params;
//   const rows = await LinkCampaignUtm.find({ campaignName }, { __v: 0 }).sort({ createdAt: -1 }).lean();
//   res.json({ ok: true, rows });
// });

// Authentication routes
app.post('/api/auth/verify-credentials', verifyCredentials);
app.post('/api/auth/login', login);
app.post('/api/auth/users', verifyToken, verifyAdmin, createUser);
app.get('/api/auth/users', verifyToken, verifyAdmin, getAllUsers);
app.delete('/api/auth/users/:userId', verifyToken, verifyAdmin, deleteUser);
app.post('/api/auth/session-key', verifyToken, verifyAdmin, generateSessionKey);
app.get('/api/auth/session-keys/:userEmail', verifyToken, verifyAdmin, getUserSessionKeys);
app.post('/api/auth/cleanup-session-keys', verifyToken, verifyAdmin, cleanupSessionKeysEndpoint);

// Job routes
app.post('/', getAllJobs);
app.post('/api/jobs', createJob);

// Get one job (with full description) by id
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Job id is required' });
    const job = await JobModel.findById(id).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    // Return only fields needed by frontend, including jobDescription
    const {
      _id,
      jobID,
      jobDescription,
      updatedAt,
      dateAdded
    } = job;
    return res.status(200).json({ job: { _id, jobID, jobDescription, updatedAt, dateAdded } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Auto-sync clients from jobdbs to dashboardtrackings
const syncClientsFromJobs = async (req, res) => {
    try {
        // Get all unique userIDs from jobs
        const jobs = await JobModel.find({}, 'userID').lean();
        const uniqueUserIDs = [...new Set(jobs.map(job => job.userID).filter(id => 
            id && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(id)
        ))];

        console.log(`Found ${uniqueUserIDs.length} unique valid userIDs in jobs`);

        // Check which clients already exist in dashboardtrackings
        const existingClients = await ClientModel.find({}, 'email').lean();
        const existingEmails = existingClients.map(client => client.email);
        
        // Find missing clients
        const missingClients = uniqueUserIDs.filter(userID => !existingEmails.includes(userID));
        
        console.log(`Found ${missingClients.length} missing clients to create`);

        // Create missing clients with default values
        const createdClients = [];
        for (const email of missingClients) {
            const clientData = {
                email: email.toLowerCase(),
                name: email.split('@')[0], // Use email prefix as default name
                jobDeadline: " ",
                applicationStartDate: " ",
                dashboardInternName: " ",
                dashboardTeamLeadName: " ",
                planType: "ignite",
                planPrice: 199,
                onboardingDate: new Date().toLocaleString('en-US', 'Asia/Kolkata'),
                whatsappGroupMade: false,
                whatsappGroupMadeDate: " ",
                dashboardCredentialsShared: false,
                dashboardCredentialsSharedDate: " ",
                resumeSent: false,
                resumeSentDate: " ",
                coverLetterSent: false,
                coverLetterSentDate: " ",
                portfolioMade: false,
                portfolioMadeDate: " ",
                linkedinOptimization: false,
                linkedinOptimizationDate: " ",
                gmailCredentials: {
                    email: "",
                    password: ""
                },
                dashboardCredentials: {
                    username: "",
                    password: ""
                },
                linkedinCredentials: {
                    username: "",
                    password: ""
                },
                amountPaid: 0,
                amountPaidDate: " ",
                modeOfPayment: "paypal",
                status: "active",
                companyName: " ",
                lastApplicationDate: " ",
                jobStatus: "still_searching",
                createdAt: new Date().toLocaleString('en-US', 'Asia/Kolkata'),
                updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
            };

            const client = new ClientModel(clientData);
            await client.save();
            createdClients.push(client);
            console.log(`Created client profile for: ${email}`);
        }

        res.status(200).json({
            message: `Successfully synced clients from jobs`,
            totalJobsUsers: uniqueUserIDs.length,
            existingClients: existingEmails.length,
            createdClients: createdClients.length,
            createdClientsList: createdClients.map(c => c.email)
        });

    } catch (error) {
        console.error('Error syncing clients from jobs:', error);
        res.status(500).json({ error: error.message });
    }
};

// Operations endpoints
const getAllOperations = async (req, res) => {
    try {
        const operations = await OperationsModel.find().lean();
        res.status(200).json({operations});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

const getOperationsByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const operation = await OperationsModel.findOne({ email: email.toLowerCase() }).lean();
        if (!operation) {
            return res.status(404).json({error: 'Operation user not found'});
        }
        res.status(200).json({operation});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

const createOrUpdateOperation = async (req, res) => {
    try {
        const { email, name, password, role, managedUsers } = req.body;
        
        const operationData = {
            email: email.toLowerCase(),
            name,
            password: password ? await bcrypt.hash(password, 10) : undefined,
            role,
            managedUsers,
            updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
        };

        // Remove undefined values
        Object.keys(operationData).forEach(key => {
            if (operationData[key] === undefined) {
                delete operationData[key];
            }
        });

        const operation = await OperationsModel.findOneAndUpdate(
            { email: email.toLowerCase() },
            operationData,
            { upsert: true, new: true, runValidators: true }
        );
        
        res.status(200).json({operation});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

const getJobsByOperatorEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const { date } = req.query;
        
        let query = { operatorEmail: email.toLowerCase() };
        
        if (date) {
            // Convert date from "2025-10-04" to match DB format
            // DB format appears to be "4/10/2025" (day/month/year)
            const targetDate = new Date(date);
            const month = targetDate.getMonth() + 1;
            const day = targetDate.getDate();
            const year = targetDate.getFullYear();
            
            // Create the format that matches the DB data: "4/10/2025"
            const dateString = `${day}/${month}/${year}`;
            
            // Search for this date format in the appliedDate field
            query.appliedDate = {
                $regex: dateString,
                $options: 'i'
            };
        }
        
        const jobs = await JobModel.find(query).select('-jobDescription').lean();
        res.status(200).json({jobs});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

const getUniqueClientsFromJobs = async (req, res) => {
    try {
        const { operatorEmail } = req.query;
        
        let query = {};
        if (operatorEmail) {
            query.operatorEmail = operatorEmail.toLowerCase();
        }
        
        const jobs = await JobModel.find(query, 'userID').lean();
        const uniqueUserIDs = [...new Set(jobs.map(job => job.userID).filter(id => 
            id && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(id)
        ))];
        
        res.status(200).json({clients: uniqueUserIDs});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

// Get plan type statistics
const getPlanTypeStats = async (req, res) => {
    try {
        // Aggregate clients by plan type
        const planTypeStats = await NewUserModel.aggregate([
            {
                $group: {
                    _id: "$planType",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Get total clients
        const totalClients = await NewUserModel.countDocuments();

        // Format data for charts
        const formattedData = planTypeStats.map(stat => ({
            planType: stat._id,
            count: stat.count,
            percentage: ((stat.count / totalClients) * 100).toFixed(1)
        }));

        res.status(200).json({
            success: true,
            data: {
                totalClients,
                planTypeStats: formattedData,
                rawStats: planTypeStats
            }
        });
    } catch (error) {
        console.error('Error fetching plan type statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch plan type statistics',
            error: error.message
        });
    }
};

// Get revenue statistics
const getRevenueStats = async (req, res) => {
    try {
        // Plan pricing
        const planPricing = {
            'Executive': 45000,
            'Professional': 35000,
            'Ignite': 15000,
            'Free Trial': 0
        };

        // Start from August 2025
        const startDate = new Date('2025-08-01');
        startDate.setHours(0, 0, 0, 0);

        // Aggregate revenue by month from August 2025 onwards
        const monthlyRevenue = await NewUserModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        planType: "$planType"
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        // Calculate total revenue
        let totalRevenue = 0;
        const revenueByMonth = {};

        monthlyRevenue.forEach(stat => {
            const planType = stat._id.planType;
            const count = stat.count;
            const price = planPricing[planType] || 0;
            const revenue = count * price;
            
            totalRevenue += revenue;
            
            const monthKey = `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`;
            if (!revenueByMonth[monthKey]) {
                revenueByMonth[monthKey] = {
                    year: stat._id.year,
                    month: stat._id.month,
                    totalRevenue: 0,
                    breakdown: {}
                };
            }
            
            revenueByMonth[monthKey].totalRevenue += revenue;
            revenueByMonth[monthKey].breakdown[planType] = {
                count,
                revenue,
                price
            };
        });

        // Format monthly data for charts
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const formattedMonthlyData = [];
        const currentDate = new Date();
        const startDateForLoop = new Date('2025-08-01');
        
        // Generate months from August 2025 to current month
        for (let date = new Date(startDateForLoop); date <= currentDate; date.setMonth(date.getMonth() + 1)) {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
            
            const monthData = revenueByMonth[monthKey] || {
                year,
                month,
                totalRevenue: 0,
                breakdown: {}
            };
            
            formattedMonthlyData.push({
                month: `${monthNames[month - 1]} ${year}`,
                revenue: monthData.totalRevenue,
                year,
                monthNumber: month,
                breakdown: monthData.breakdown
            });
        }

        // Calculate plan-wise totals
        const planTotals = {};
        Object.keys(planPricing).forEach(planType => {
            planTotals[planType] = {
                count: 0,
                revenue: 0,
                price: planPricing[planType]
            };
        });

        monthlyRevenue.forEach(stat => {
            const planType = stat._id.planType;
            const count = stat.count;
            const price = planPricing[planType] || 0;
            const revenue = count * price;
            
            if (planTotals[planType]) {
                planTotals[planType].count += count;
                planTotals[planType].revenue += revenue;
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                monthlyRevenue: formattedMonthlyData,
                planTotals,
                planPricing
            }
        });
    } catch (error) {
        console.error('Error fetching revenue statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue statistics',
            error: error.message
        });
    }
};

// Client routes
app.get('/api/clients', getAllClients);
app.get('/api/clients/stats', getClientStats);
app.get('/api/clients/plan-stats', getPlanTypeStats);
app.get('/api/clients/revenue-stats', getRevenueStats);
app.get('/api/clients/:email', getClientByEmail);
app.get('/api/clients/all', async (req, res) => {
  try {
    // Exclude large fields using .select()
    // Example: '-jobDescription' excludes the JD field
    // You can also exclude multiple: .select('-jobDescription -timeline -notes')
    const clients = await ClientModel.find({}).lean(); // returns plain JS objects (faster)
    // console.log(`Fetched ${clients.length} clients`);
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching clients',
    });
  }
});

app.post('/api/clients', createOrUpdateClient);
app.post('/api/clients/sync-from-jobs', syncClientsFromJobs);

//get all the jobdatabase data..
const getJobsByClient = async (req, res) => {
    try {
        const { email } = req.params;
        const jobs = await JobModel.find({ userID: email }).select('-jobDescription').lean();
        res.status(200).json({ jobs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

app.get('/api/clients/:email/jobs', getJobsByClient);

// Manager routes
app.get('/api/managers', verifyToken, getAllManagers);
app.get('/api/managers/:id', verifyToken, getManagerById);
app.post('/api/managers', verifyToken, verifyAdmin, upload.single('profilePhoto'), createManager);
app.put('/api/managers/:id', verifyToken, verifyAdmin, upload.single('profilePhoto'), updateManager);
app.delete('/api/managers/:id', verifyToken, verifyAdmin, deleteManager);
app.post('/api/managers/:id/upload-photo', verifyToken, verifyAdmin, upload.single('profilePhoto'), uploadProfilePhoto);
// Get managed users for an operation
const getManagedUsers = async (req, res) => {
    try {
        const { email } = req.params;
        const operation = await OperationsModel.findOne({ email: email.toLowerCase() });
        
        if (!operation) {
            return res.status(404).json({ error: 'Operation not found' });
        }
        
        // Get client details for managed users
        const managedUsers = [];
        for (const userId of operation.managedUsers || []) {
            // Convert ObjectId to string if needed
            const userIdStr = userId.toString();
            
            const client = await ClientModel.findOne({ userID: userIdStr });
            if (client) {
                managedUsers.push({
                    userID: userIdStr,
                    name: client.name,
                    email: client.email || userIdStr,
                    company: client.company
                });
            } else {
                // If client not found in ClientModel, still show the userID
                // Check if it's an email format
                const displayName = userIdStr.includes('@') ? userIdStr.split('@')[0] : `User ${userIdStr.substring(0, 8)}`;
                managedUsers.push({
                    userID: userIdStr,
                    name: displayName,
                    email: userIdStr.includes('@') ? userIdStr : 'Unknown',
                    company: 'Unknown'
                });
            }
        }
        
        res.status(200).json({ managedUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Add user to managed users
const addManagedUser = async (req, res) => {
    try {
        const { email } = req.params;
        const { userID } = req.body;
        
        if (!userID) {
            return res.status(400).json({ error: 'userID is required' });
        }
        
        const operation = await OperationsModel.findOne({ email: email.toLowerCase() });
        if (!operation) {
            return res.status(404).json({ error: 'Operation not found' });
        }
        
        // Add userID to managedUsers array if not already present (handle ObjectId comparison)
        const isAlreadyManaged = operation.managedUsers.some(managedId => managedId.toString() === userID);
        if (!isAlreadyManaged) {
            operation.managedUsers.push(userID);
            await operation.save();
        }
        
        res.status(200).json({ message: 'User added to managed users', managedUsers: operation.managedUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Remove user from managed users
const removeManagedUser = async (req, res) => {
    try {
        const { email, userID } = req.params;
        
        const operation = await OperationsModel.findOne({ email: email.toLowerCase() });
        if (!operation) {
            return res.status(404).json({ error: 'Operation not found' });
        }
        
        // Remove userID from managedUsers array (handle ObjectId comparison)
        operation.managedUsers = operation.managedUsers.filter(id => id.toString() !== userID);
        await operation.save();
        
        res.status(200).json({ message: 'User removed from managed users', managedUsers: operation.managedUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get available clients (not managed by this operation)
const getAvailableClients = async (req, res) => {
    try {
        const { email } = req.params;
        
        const operation = await OperationsModel.findOne({ email: email.toLowerCase() });
        if (!operation) {
            return res.status(404).json({ error: 'Operation not found' });
        }
        
        // Get all clients
        const allClients = await ClientModel.find({}, 'userID name email company').lean();
        
        // Filter out clients that are already managed by this operation (handle ObjectId comparison)
        const availableClients = allClients.filter(client => 
            !operation.managedUsers.some(managedId => managedId.toString() === client.userID)
        );
        
        res.status(200).json({ availableClients });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Get client details from dashboardtrackings collection
const getClientDetails = async (req, res) => {
    try {
        const { email } = req.params;
        
        // Find client in dashboardtrackings collection
        const client = await ClientModel.findOne({ email: email.toLowerCase() });
        
        if (!client) {
            return res.status(404).json({ error: 'Client not found in dashboardtrackings' });
        }
        
        res.status(200).json({ 
            success: true, 
            client: client 
        });
    } catch (error) {
        console.error('Error fetching client details:', error);
        res.status(500).json({ error: error.message });
    }
};

// Sync manager assignments from users collection to dashboardtrackings
const syncManagerAssignments = async (req, res) => {
    try {
        console.log('🔄 Starting manager assignment sync...');
        
        // Get all users with dashboardManager assignments
        const usersWithManagers = await NewUserModel.find({ 
            dashboardManager: { $exists: true, $ne: null, $ne: "" } 
        }).lean();
        
        console.log(`Found ${usersWithManagers.length} users with manager assignments`);
        
        let syncedCount = 0;
        let errors = [];
        
        for (const user of usersWithManagers) {
            try {
                // Update the corresponding client in dashboardtrackings
                const updateResult = await ClientModel.updateOne(
                    { email: user.email.toLowerCase() },
                    { 
                        $set: { 
                            dashboardTeamLeadName: user.dashboardManager,
                            updatedAt: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
                        } 
                    }
                );
                
                if (updateResult.matchedCount > 0) {
                    syncedCount++;
                    console.log(`✅ Synced manager "${user.dashboardManager}" for ${user.email}`);
                } else {
                    console.log(`⚠️  No matching client found in dashboardtrackings for ${user.email}`);
                }
            } catch (error) {
                console.error(`❌ Error syncing ${user.email}:`, error.message);
                errors.push({ email: user.email, error: error.message });
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Manager assignment sync completed`,
            syncedCount,
            totalUsers: usersWithManagers.length,
            errors: errors.length > 0 ? errors : null
        });
        
    } catch (error) {
        console.error('❌ Error in syncManagerAssignments:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Operations routes
app.get('/api/operations', getAllOperations);
app.get('/api/operations/:email', getOperationsByEmail);
app.post('/api/operations', createOrUpdateOperation);
app.get('/api/operations/:email/jobs', getJobsByOperatorEmail);
app.get('/api/operations/clients', getUniqueClientsFromJobs);
app.get('/api/operations/:email/managed-users', getManagedUsers);
app.post('/api/operations/:email/managed-users', addManagedUser);
app.delete('/api/operations/:email/managed-users/:userID', removeManagedUser);
app.get('/api/operations/:email/available-clients', getAvailableClients);

// Manager sync route
app.post('/api/clients/sync-managers', syncManagerAssignments);

// Client details route (removed duplicate - using getClientByEmail instead)

app.listen(process.env.PORT, ()=> console.log("server is live for application monitoring at Port:", process.env.PORT)) ;
