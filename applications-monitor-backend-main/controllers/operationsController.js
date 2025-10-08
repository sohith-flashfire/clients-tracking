import OperationsModel from '../OperationsModel.js';
import { JobModel } from '../JobModel.js';
import { ClientModel } from '../ClientModel.js';
import bcrypt from 'bcryptjs';

export const getAllOperations = async (req, res) => {
    try {
        const operations = await OperationsModel.find().lean();
        res.status(200).json({ operations });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOperationByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const operation = await OperationsModel.findOne({ email: email.toLowerCase() }).lean();
        if (!operation) {
            return res.status(404).json({ error: 'Operation user not found' });
        }
        res.status(200).json({ operation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createOrUpdateOperation = async (req, res) => {
    try {
        const { email, name, password, role, managedUsers } = req.body;

        const operationData = {
            email: email.toLowerCase(),
            name,
            password: password ? await bcrypt.hash(password, 10) : undefined,
            role,
            managedUsers,
            updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
        };

        // Remove undefined values
        Object.keys(operationData).forEach(key => {
            if (operationData[key] === undefined) {
                delete operationData[key];
            }
        });

        const operation = await OperationsModel.findOneAndUpdate(
            { email: email.toLowerCase() },
            operationData,
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({ operation });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getJobsByOperatorEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const { date } = req.query;

        let query = { operatorEmail: email.toLowerCase() };

        if (date) {
            const targetDate = new Date(date);
            const month = targetDate.getMonth() + 1;
            const day = targetDate.getDate();
            const year = targetDate.getFullYear();
            const dateString = `${day}/${month}/${year}`;
            query.appliedDate = {
                $regex: dateString,
                $options: 'i'
            };
        }

        const jobs = await JobModel.find(query).select('-jobDescription').lean();
        res.status(200).json({ jobs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getUniqueClientsFromJobs = async (req, res) => {
    try {
        const { operatorEmail } = req.query;

        let query = {};
        if (operatorEmail) {
            query.operatorEmail = operatorEmail.toLowerCase();
        }

        const jobs = await JobModel.find(query, 'userID').lean();
        const uniqueUserIDs = [...new Set(jobs.map(job => job.userID).filter(id =>
            id && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(id)
        ))];

        res.status(200).json({ clients: uniqueUserIDs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getManagedUsers = async (req, res) => {
    try {
        const { email } = req.params;
        const operation = await OperationsModel.findOne({ email: email.toLowerCase() });

        if (!operation) {
            return res.status(404).json({ error: 'Operation not found' });
        }

        const managedUsers = [];
        for (const userId of operation.managedUsers || []) {
            const userIdStr = userId.toString();

            const client = await ClientModel.findOne({ userID: userIdStr });
            if (client) {
                managedUsers.push({
                    userID: userIdStr,
                    name: client.name,
                    email: client.email || userIdStr,
                    company: client.company
                });
            } else {
                const displayName = userIdStr.includes('@') ? userIdStr.split('@')[0] : `User ${userIdStr.substring(0, 8)}`;
                managedUsers.push({
                    userID: userIdStr,
                    name: displayName,
                    email: userIdStr.includes('@') ? userIdStr : 'Unknown',
                    company: 'Unknown'
                });
            }
        }

        res.status(200).json({ managedUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const addManagedUser = async (req, res) => {
    try {
        const { email } = req.params;
        const { userID } = req.body;

        if (!userID) {
            return res.status(400).json({ error: 'userID is required' });
        }

        const operation = await OperationsModel.findOne({ email: email.toLowerCase() });
        if (!operation) {
            return res.status(404).json({ error: 'Operation not found' });
        }

        const isAlreadyManaged = operation.managedUsers.some(managedId => managedId.toString() === userID);
        if (!isAlreadyManaged) {
            operation.managedUsers.push(userID);
            await operation.save();
        }

        res.status(200).json({ message: 'User added to managed users', managedUsers: operation.managedUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const removeManagedUser = async (req, res) => {
    try {
        const { email, userID } = req.params;

        const operation = await OperationsModel.findOne({ email: email.toLowerCase() });
        if (!operation) {
            return res.status(404).json({ error: 'Operation not found' });
        }

        operation.managedUsers = operation.managedUsers.filter(id => id.toString() !== userID);
        await operation.save();

        res.status(200).json({ message: 'User removed from managed users', managedUsers: operation.managedUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAvailableClients = async (req, res) => {
    try {
        const { email } = req.params;

        const operation = await OperationsModel.findOne({ email: email.toLowerCase() });
        if (!operation) {
            return res.status(404).json({ error: 'Operation not found' });
        }

        const allClients = await ClientModel.find({}, 'userID name email company').lean();

        const availableClients = allClients.filter(client =>
            !operation.managedUsers.some(managedId => managedId.toString() === client.userID)
        );

        res.status(200).json({ availableClients });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};