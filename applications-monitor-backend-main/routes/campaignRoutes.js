import express from 'express';
import {
    trackUtmCampaignLead,
    CreateCampaign,
    trackClick,
    redirectAndTrack,
    getReport,
    getReportByCampaign
} from '../controllers/campaignController.js';

const router = express.Router();

router.post("/api/track/utm-campaign-lead", trackUtmCampaignLead);
router.post("/api/campaign/create", CreateCampaign);
router.post("/api/track", trackClick);
router.get("/r/:code", redirectAndTrack);
router.get("/api/report", getReport);
router.get("/api/report/:campaignName", getReportByCampaign);

export default router;