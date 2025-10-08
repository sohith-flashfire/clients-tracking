import { JobModel } from '../JobModel.js';

export const getAllJobs = async (req, res) => {
    const jobDB = await JobModel.find().select('-jobDescription').lean();
    res.status(200).json({ jobDB });
};

export const createJob = async (req, res) => {
    try {
        const jobData = {
            ...req.body,
            createdAt: new Date().toLocaleString('en-US', 'Asia/Kolkata'),
            updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
        };

        const job = new JobModel(jobData);
        await job.save();
        res.status(201).json({ job });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getJobById = async (req, res) => {
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
};

export const getJobsByClient = async (req, res) => {
    try {
        const { email } = req.params;
        const jobs = await JobModel.find({ userID: email }).select('-jobDescription').lean();
        res.status(200).json({ jobs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};