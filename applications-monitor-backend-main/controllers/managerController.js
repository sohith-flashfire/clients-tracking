import { ManagerModel } from '../ManagerModel.js';
import { upload } from '../utils/cloudinary.js';

export const getAllManagers = async (req, res) => {
    try {
        const managers = await ManagerModel.find().lean();
        res.status(200).json({ managers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getManagerById = async (req, res) => {
    try {
        const { id } = req.params;
        const manager = await ManagerModel.findById(id).lean();
        if (!manager) {
            return res.status(404).json({ error: 'Manager not found' });
        }
        res.status(200).json({ manager });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createManager = async (req, res) => {
    try {
        const { name, email, phone, role } = req.body;
        const profilePhoto = req.file ? req.file.path : null;

        const manager = new ManagerModel({
            name,
            email,
            phone,
            role,
            profilePhoto
        });

        await manager.save();
        res.status(201).json({ manager });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateManager = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role } = req.body;
        const profilePhoto = req.file ? req.file.path : null;

        const updateData = { name, email, phone, role };
        if (profilePhoto) {
            updateData.profilePhoto = profilePhoto;
        }

        const manager = await ManagerModel.findByIdAndUpdate(id, updateData, { new: true });
        if (!manager) {
            return res.status(404).json({ error: 'Manager not found' });
        }
        res.status(200).json({ manager });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteManager = async (req, res) => {
    try {
        const { id } = req.params;
        const manager = await ManagerModel.findByIdAndDelete(id);
        if (!manager) {
            return res.status(404).json({ error: 'Manager not found' });
        }
        res.status(200).json({ message: 'Manager deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const uploadProfilePhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const profilePhoto = req.file ? req.file.path : null;

        if (!profilePhoto) {
            return res.status(400).json({ error: 'No photo uploaded.' });
        }

        const manager = await ManagerModel.findByIdAndUpdate(id, { profilePhoto }, { new: true });
        if (!manager) {
            return res.status(404).json({ error: 'Manager not found' });
        }
        res.status(200).json({ manager });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};