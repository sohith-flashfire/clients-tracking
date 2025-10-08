import { ClientModel } from '../ClientModel.js';
import { JobModel } from '../JobModel.js';

export const getAllClients = async (req, res) => {
    try {
        const clients = await ClientModel.find().lean();
        res.status(200).json({ clients });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getClientByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const client = await ClientModel.findOne({ email: email.toLowerCase() }).lean();
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.status(200).json({ client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createOrUpdateClient = async (req, res) => {
    try {
        const { email, name, jobDeadline, applicationStartDate, dashboardInternName, dashboardTeamLeadName, planType, onboardingDate, whatsappGroupMade, whatsappGroupMadeDate, dashboardCredentialsShared, dashboardCredentialsSharedDate, resumeSent, resumeSentDate, coverLetterSent, coverLetterSentDate, portfolioMade, portfolioMadeDate, linkedinOptimization, linkedinOptimizationDate, gmailCredentials, dashboardCredentials, linkedinCredentials, amountPaid, amountPaidDate, modeOfPayment, status, jobStatus, companyName, lastApplicationDate } = req.body;

        const planPrices = {
            ignite: 199,
            professional: 349,
            executive: 599,
        };

        const clientData = {
            email: email.toLowerCase(),
            name,
            jobDeadline,
            applicationStartDate,
            dashboardInternName,
            dashboardTeamLeadName,
            planType,
            planPrice: planPrices[planType] || 199,
            onboardingDate,
            whatsappGroupMade,
            whatsappGroupMadeDate,
            dashboardCredentialsShared,
            dashboardCredentialsSharedDate,
            resumeSent,
            resumeSentDate,
            coverLetterSent,
            coverLetterSentDate,
            portfolioMade,
            portfolioMadeDate,
            linkedinOptimization,
            linkedinOptimizationDate,
            gmailCredentials,
            dashboardCredentials,
            linkedinCredentials,
            amountPaid,
            amountPaidDate,
            modeOfPayment,
            status,
            jobStatus,
            companyName,
            lastApplicationDate,
            updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
        };

        const client = await ClientModel.findOneAndUpdate(
            { email: email.toLowerCase() },
            clientData,
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json({ client });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const syncClientsFromJobs = async (req, res) => {
    try {
        const jobs = await JobModel.find({}, 'userID').lean();
        const uniqueUserIDs = [...new Set(jobs.map(job => job.userID).filter(id =>
            id && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(id)
        ))];

        const existingClients = await ClientModel.find({}, 'email').lean();
        const existingEmails = existingClients.map(client => client.email);

        const missingClients = uniqueUserIDs.filter(userID => !existingEmails.includes(userID));

        const createdClients = [];
        for (const email of missingClients) {
            const clientData = {
                email: email.toLowerCase(),
                name: email.split('@')[0],
                status: "active",
                createdAt: new Date().toLocaleString('en-US', 'Asia/Kolkata'),
                updatedAt: new Date().toLocaleString('en-US', 'Asia/Kolkata')
            };

            const client = new ClientModel(clientData);
            await client.save();
            createdClients.push(client);
        }

        res.status(200).json({
            message: `Successfully synced clients from jobs`,
            totalJobsUsers: uniqueUserIDs.length,
            existingClients: existingEmails.length,
            createdClients: createdClients.length,
            createdClientsList: createdClients.map(c => c.email)
        });

    } catch (error) {
        console.error('Error syncing clients from jobs:', error);
        res.status(500).json({ error: error.message });
    }
};