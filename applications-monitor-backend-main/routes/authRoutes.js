import express from 'express';
import {
    verifyCredentials,
    login,
    createUser,
    getAllUsers,
    deleteUser,
    generateSessionKey,
    getUserSessionKeys,
    cleanupSessionKeysEndpoint
} from '../controllers/authController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js'; // Assuming middleware will be created

const router = express.Router();

router.post('/verify-credentials', verifyCredentials);
router.post('/login', login);
router.post('/users', verifyToken, verifyAdmin, createUser);
router.get('/users', verifyToken, verifyAdmin, getAllUsers);
router.delete('/users/:userId', verifyToken, verifyAdmin, deleteUser);
router.post('/session-key', verifyToken, verifyAdmin, generateSessionKey);
router.get('/session-keys/:userEmail', verifyToken, verifyAdmin, getUserSessionKeys);
router.post('/cleanup-session-keys', verifyToken, verifyAdmin, cleanupSessionKeysEndpoint);

export default router;