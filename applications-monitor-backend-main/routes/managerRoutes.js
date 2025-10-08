import express from 'express';
import {
    getAllManagers,
    getManagerById,
    createManager,
    updateManager,
    deleteManager,
    uploadProfilePhoto
} from '../controllers/managerController.js';
import { verifyToken, verifyAdmin } from '../middleware/authMiddleware.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

router.get('/', verifyToken, getAllManagers);
router.get('/:id', verifyToken, getManagerById);
router.post('/', verifyToken, verifyAdmin, upload.single('profilePhoto'), createManager);
router.put('/:id', verifyToken, verifyAdmin, upload.single('profilePhoto'), updateManager);
router.delete('/:id', verifyToken, verifyAdmin, deleteManager);
router.post('/:id/upload-photo', verifyToken, verifyAdmin, upload.single('profilePhoto'), uploadProfilePhoto);

export default router;