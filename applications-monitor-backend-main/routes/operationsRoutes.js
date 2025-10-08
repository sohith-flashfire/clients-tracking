import express from 'express';
import {
    getAllOperations,
    getOperationByEmail,
    createOrUpdateOperation,
    getJobsByOperatorEmail,
    getUniqueClientsFromJobs,
    getManagedUsers,
    addManagedUser,
    removeManagedUser,
    getAvailableClients
} from '../controllers/operationsController.js';

const router = express.Router();

router.get('/', getAllOperations);
router.get('/:email', getOperationByEmail);
router.post('/', createOrUpdateOperation);
router.get('/:email/jobs', getJobsByOperatorEmail);
router.get('/clients', getUniqueClientsFromJobs);
router.get('/:email/managed-users', getManagedUsers);
router.post('/:email/managed-users', addManagedUser);
router.delete('/:email/managed-users/:userID', removeManagedUser);
router.get('/:email/available-clients', getAvailableClients);

export default router;