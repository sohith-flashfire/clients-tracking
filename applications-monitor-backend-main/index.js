import express from 'express';
import mongoose from 'mongoose';
import { JobModel } from './JobModel.js';
import { ClientModel } from './ClientModel.js';
import { UserModel } from './UserModel.js';
import { SessionKeyModel } from './SessionKeyModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors'
import 'dotenv/config';




// Environment Variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const PORT = process.env.PORT || 8086;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/applications-monitor';
const ADMIN_EMAILS = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : ['tripathipranjal01@gmail.com', 'adit.jain606@gmail.com'];
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const SESSION_KEY_DURATION = parseInt(process.env.SESSION_KEY_DURATION) || 24;

const app = express();
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
}));
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
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
        //get all the jobdatabase data..
const getAllJobs = async (req, res)=> {
    const jobDB = await JobModel.find();
    res.status(200).json({jobDB});
}

// Client management endpoints
const getAllClients = async (req, res) => {
    try {
        // Get all job applications from jobdbs collection (READ ONLY)
        const jobApplications = await JobModel.find();
        
        // Group by userID (email) to get unique clients
        const clientMap = {};
        jobApplications.forEach(job => {
            const userID = job.userID;
            if (!clientMap[userID]) {
                clientMap[userID] = {
                    email: userID,
                    name: userID.split('@')[0], // Use email prefix as name
                    jobApplications: []
                };
            }
            clientMap[userID].jobApplications.push({
                jobID: job.jobID,
                jobTitle: job.jobTitle,
                companyName: job.companyName,
                currentStatus: job.currentStatus,
                dateAdded: job.dateAdded,
                joblink: job.joblink,
                jobDescription: job.jobDescription,
                timeline: job.timeline,
                attachments: job.attachments
            });
        });
        
        // Convert to array format
        const clients = Object.values(clientMap);
        
        res.status(200).json({clients});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

const getClientByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        
        // Get all job applications for this user from jobdbs collection (READ ONLY)
        const jobApplications = await JobModel.find({ userID: email.toLowerCase() });
        
        if (jobApplications.length === 0) {
            return res.status(404).json({error: 'Client not found'});
        }
        
        // Create client object with job applications
        const client = {
            email: email.toLowerCase(),
            name: email.split('@')[0], // Use email prefix as name
            jobApplications: jobApplications.map(job => ({
                jobID: job.jobID,
                jobTitle: job.jobTitle,
                companyName: job.companyName,
                currentStatus: job.currentStatus,
                dateAdded: job.dateAdded,
                joblink: job.joblink,
                jobDescription: job.jobDescription,
                timeline: job.timeline,
                attachments: job.attachments
            }))
        };
        
        res.status(200).json({client});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}

// Authentication routes
const login = async (req, res) => {
    try {
        const { email, password, sessionKey } = req.body;
        
        // Find user
        const user = await UserModel.findOne({ email: email.toLowerCase() });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check if user is admin
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
        
        // If user is not admin, session key is required
        if (!isAdmin) {
            if (!sessionKey) {
                return res.status(200).json({ 
                    message: 'Session key required',
                    requiresSessionKey: true,
                    user: {
                        email: user.email,
                        role: user.role
                    }
                });
            }
            
            const sessionKeyDoc = await SessionKeyModel.findOne({ 
                email: email.toLowerCase(), 
                sessionKey,
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

const createUser = async (req, res) => {
    try {
        const { email, password, role = 'user' } = req.body;
        
        // Check if user already exists
        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
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

const generateSessionKey = async (req, res) => {
    try {
        const { email, duration = SESSION_KEY_DURATION } = req.body;
        
        // Generate more random session key using crypto
        const crypto = await import('crypto');
        const sessionKey = crypto.randomBytes(16).toString('hex').toUpperCase();
        
        // Calculate expiration time
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + parseInt(duration));
        
        // Create session key document
        const sessionKeyDoc = new SessionKeyModel({
            email: email.toLowerCase(),
            sessionKey,
            expiresAt
        });
        
        await sessionKeyDoc.save();
        
        res.status(201).json({
            message: 'Session key generated successfully',
            sessionKey,
            expiresAt: expiresAt.toLocaleString('en-US', 'Asia/Kolkata')
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find({}, { password: 0 });
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await UserModel.findByIdAndDelete(id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

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

// Authentication routes
app.post('/api/auth/login', login);
app.post('/api/auth/create-user', authenticateToken, requireAdmin, createUser);
app.post('/api/auth/generate-session-key', authenticateToken, requireAdmin, generateSessionKey);
app.get('/api/auth/users', authenticateToken, requireAdmin, getAllUsers);
app.delete('/api/auth/users/:id', authenticateToken, requireAdmin, deleteUser);

// Job routes
app.post('/', getAllJobs);

// Client routes
app.get('/api/clients', getAllClients);
app.get('/api/clients/:email', getClientByEmail);
app.post('/api/clients', createOrUpdateClient);

app.listen(process.env.PORT, ()=> console.log("server is live for application monitoring at Port:", process.env.PORT)) ;

