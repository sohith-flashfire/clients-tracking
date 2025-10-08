import express from 'express';
import {
    getAllClients,
    getClientByEmail,
    createOrUpdateClient,
    syncClientsFromJobs
} from '../controllers/clientController.js';

const router = express.Router();

router.get('/clients', getAllClients);
router.get('/clients/:email', getClientByEmail);
router.post('/clients', createOrUpdateClient);
router.post('/clients/sync-from-jobs', syncClientsFromJobs);

export default router;