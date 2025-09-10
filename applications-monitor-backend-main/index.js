import express from 'express';
import mongoose from 'mongoose';
import { JobModel } from './JobModel.js';
import { ClientModel } from './ClientModel.js';
import { UserModel } from './UserModel.js';
import { SessionKeyModel } from './SessionKeyModel.js';
import cors from 'cors'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';




// Environment Variables
const PORT = process.env.PORT || 8086;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is required');
  process.exit(1);
}

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

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
    const jobDB = await JobModel.find();
    res.status(200).json({jobDB});
}

// Client management endpoints
const getAllClients = async (req, res) => {
    try {
        const clients = await ClientModel.find();
        res.status(200).json({clients});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

const getClientByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const client = await ClientModel.findOne({ email: email.toLowerCase() });
        if (!client) {
            return res.status(404).json({error: 'Client not found'});
        }
        res.status(200).json({client});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

// (Auth routes removed)

const createOrUpdateClient = async (req, res) => {
    try {
        const { email, name, jobDeadline, dashboardInternName, dashboardTeamLeadName, planType, onboardingDate, whatsappGroupMade, dashboardCredentialsShared, resumeSent, coverLetterSent, portfolioMade, linkedinOptimization, gmailCredentials, amountPaid, modeOfPayment } = req.body;
        
        // Set plan price based on plan type
        const planPrices = {
            ignite: 199,
            professional: 349,
            executive: 599,
        };
        
        const clientData = {
            email: email.toLowerCase(),
            name,
            jobDeadline,
            dashboardInternName,
            dashboardTeamLeadName,
            planType,
            planPrice: planPrices[planType] || 199,
            onboardingDate,
            whatsappGroupMade,
            dashboardCredentialsShared,
            resumeSent,
            coverLetterSent,
            portfolioMade,
            linkedinOptimization,
            gmailCredentials,
            amountPaid,
            modeOfPayment,
            updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
        };

        const client = await ClientModel.findOneAndUpdate(
            { email: email.toLowerCase() },
            clientData,
            { upsert: true, new: true, runValidators: true }
        );
        
        res.status(200).json({client});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

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

// Client routes
app.get('/api/clients', getAllClients);
app.get('/api/clients/:email', getClientByEmail);
app.post('/api/clients', createOrUpdateClient);

app.listen(process.env.PORT, ()=> console.log("server is live for application monitoring at Port:", process.env.PORT)) ;

