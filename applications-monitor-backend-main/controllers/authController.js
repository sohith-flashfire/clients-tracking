import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../UserModel.js';
import { SessionKeyModel } from '../SessionKeyModel.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const verifyCredentials = async (req, res) => {
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

export const login = async (req, res) => {
    try {
        const { email, password, sessionKey } = req.body;

        const user = await UserModel.findOne({ email: email.toLowerCase() });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

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

            sessionKeyDoc.isUsed = true;
            sessionKeyDoc.usedAt = new Date().toLocaleString('en-US', 'Asia/Kolkata');
            await sessionKeyDoc.save();
        }

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

export const createUser = async (req, res) => {
    try {
        const { email, password, role = 'team_lead' } = req.body;

        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

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

export const generateSessionKey = async (req, res) => {
    try {
        const { userEmail } = req.body;

        const user = await UserModel.findOne({
            email: userEmail.toLowerCase(),
            role: 'team_lead',
            isActive: true
        });

        if (!user) {
            return res.status(404).json({ error: 'Team lead user not found' });
        }

        let sessionKey;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            const timestamp = Date.now().toString(36);
            const random = Math.random().toString(36).substring(2, 10).toUpperCase();
            sessionKey = `FF${timestamp}${random}`;
            attempts++;

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

export const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find({}, { password: 0 });
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getUserSessionKeys = async (req, res) => {
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

export const cleanupSessionKeysEndpoint = async (req, res) => {
    try {
        await SessionKeyModel.collection.drop().catch(() => {
        });

        await SessionKeyModel.createCollection();

        res.status(200).json({
            message: 'Session keys collection reset successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete admin users' });
        }

        await UserModel.findByIdAndDelete(userId);

        await SessionKeyModel.deleteMany({ userEmail: user.email });

        res.status(200).json({
            message: 'User deleted successfully',
            deletedUser: { email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};