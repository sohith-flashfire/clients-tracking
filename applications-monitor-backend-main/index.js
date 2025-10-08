import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import 'dotenv/config';
import { upload } from './utils/cloudinary.js';

import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import operationsRoutes from './routes/operationsRoutes.js';
import managerRoutes from './routes/managerRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';

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
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
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
    "https://hq.flashfirejobs.com"
];

if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim());
    allowedOrigins.push(...additionalOrigins);
}

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
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
app.use(express.json());

const ConnectDB = () => mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 86_400_000,
    socketTimeoutMS: 86_400_000,
    serverSelectionTimeoutMS: 10_000,
})
    .then(() => console.log("✅ Database connected successfully"))
    .catch((error) => {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    });
ConnectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/', jobRoutes);
app.use('/api', clientRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/managers', managerRoutes);
app.use('/', campaignRoutes);


app.listen(process.env.PORT, () => console.log("server is live for application monitoring at Port:", process.env.PORT));