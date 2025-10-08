import express from 'express';
import {
    getAllJobs,
    createJob,
    getJobById,
    getJobsByClient
} from '../controllers/jobController.js';

const router = express.Router();

router.post('/', getAllJobs);
router.post('/api/jobs', createJob);
router.get('/api/jobs/:id', getJobById);
router.get('/api/clients/:email/jobs', getJobsByClient);

export default router;