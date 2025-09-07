import express from 'express';
import mongoose from 'mongoose';
import { JobModel } from './JobModel.js';
import { ClientModel } from './ClientModel.js';
import cors from 'cors'
import 'dotenv/config';




const app = express();
app.use(cors());
app.use(express.json());

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

const createOrUpdateClient = async (req, res) => {
    try {
        const { email, name, jobDeadline, dashboardInternName, dashboardTeamLeadName, planType, onboardingDate, whatsappGroupMade, dashboardCredentialsShared, resumeSent, coverLetterSent, portfolioMade, linkedinOptimization, gmailCredentials } = req.body;
        
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

// Job routes
app.post('/', getAllJobs);

// Client routes
app.get('/api/clients', getAllClients);
app.get('/api/clients/:email', getClientByEmail);
app.post('/api/clients', createOrUpdateClient);

app.listen(process.env.PORT, ()=> console.log("server is live for application monitoring at Port:", process.env.PORT)) ;

