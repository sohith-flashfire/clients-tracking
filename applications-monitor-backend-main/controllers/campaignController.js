import { LinkCampaignUtm, Click } from '../schema_models/UtmSchema.js';
import { decode, encode } from '../utils/CodeExaminer.js';
import CreateCampaign from './NewCampaign.js';

function getClientIP(req) {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string" && xff.length > 0) {
        return xff.split(",")[0].trim();
    }
    const ip = req.socket?.remoteAddress || req.ip || "";
    return ip.replace(/^::ffff:/, "");
}

export const trackUtmCampaignLead = async (req, res) => {
    try {
        const { clientName, clientEmail, clientPhone, utmSource } = req.body;

        if (!utmSource || !clientEmail) {
            return res.status(400).json({ error: "utmSource and clientEmail are required" });
        }

        const campaign = await LinkCampaignUtm.findOne({
            "utm_source.utm_source": utmSource
        });

        if (!campaign) {
            return res.status(404).json({ message: "No campaign found for this utmSource" });
        }

        const utmEntry = campaign.utm_source.find(
            (s) => s.utm_source === utmSource
        );

        if (!utmEntry) {
            return res.status(404).json({ message: "UTM not found inside campaign" });
        }

        const alreadyExists = utmEntry.conversions.some(
            (c) => c.clientEmail.toLowerCase() === clientEmail.toLowerCase()
        );

        if (alreadyExists) {
            return res.status(200).json({ message: "Client already exists, not added again" });
        }

        utmEntry.conversions.push({
            clientName,
            clientEmail,
            clientPhone: clientPhone || "Not Provided",
            bookingDate: new Date()
        });

        await campaign.save();

        return res.status(201).json({
            message: "✅ Conversion added successfully",
            conversion: { clientName, clientEmail, clientPhone }
        });
    } catch (error) {
        console.error("❌ Error in /api/track/utm-campaign-lead:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export { CreateCampaign };

export const trackClick = async (req, res) => {
    try {
        const {
            ref,
            userAgent,
            screenWidth,
            screenHeight,
            language,
            timezone,
        } = req.body;

        if (!ref) {
            return res.status(400).json({ ok: false, message: "Missing ref code" });
        }

        const ip =
            req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
            req.socket.remoteAddress;

        const { campaignName, campaignerName } = decode(ref);

        const campaign = await LinkCampaignUtm.findOne({
            campaign_name: campaignName,
        });
        if (!campaign) {
            return res.status(404).json({ ok: false, message: "Campaign not found" });
        }

        const source = campaign.utm_source.find(
            (s) => s.utm_source.toLowerCase() === campaignerName.toLowerCase()
        );
        if (!source) {
            return res
                .status(404)
                .json({ ok: false, message: "Campaigner not found" });
        }

        await Click.create({
            link_code: source.link_code,
            utm_source: source.utm_source,
            utm_campaign: campaignName,
            ip,
            timestamp: new Date(),
            userAgent,
            screenWidth,
            screenHeight,
            language,
            timezone,
        });

        source.total_clicks += 1;

        if (!source.unique_ips.includes(ip)) {
            source.unique_ips.push(ip);
            source.unique_clicks = source.unique_ips.length;
        }

        await campaign.save();

        return res.json({
            ok: true,
            message: "Click tracked successfully",
            campaignName,
            campaignerName,
            utm_source: source.utm_source,
            link_code: source.link_code,
            ip,
            total: source.total_clicks,
            unique: source.unique_clicks,
        });
    } catch (err) {
        console.error("Error in tracking:", err);
        return res.status(500).json({ ok: false, error: "server_error" });
    }
};

export const redirectAndTrack = async (req, res) => {
    try {
        const { code } = req.params;
        const doc = await LinkCampaignUtm.findOne({ code });
        if (!doc) return res.status(404).send("Invalid link");

        const ip = getClientIP(req);
        doc.totalClicks += 1;

        if (!doc.uniqueIPs.includes(ip)) {
            doc.uniqueIPs.push(ip);
            doc.uniqueCount = doc.uniqueIPs.length;
        }
        await doc.save();

        res.type("html").send(`
      <html>
        <head><title>Thanks for visiting</title></head>
        <body style="font-family: sans-serif; padding: 24px;">
          <h1>Thanks for visiting via ${doc.campaignerName}'s link</h1>
          <p>Campaign: <b>${doc.campaignName}</b></p>
          <p>This IP is counted once. Total unique visitors so far: <b>${doc.uniqueCount}</b></p>
        </body>
      </html>
    `);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
};

export const getReport = async (_req, res) => {
    try {
        const baseUrl = "https://flashfirejobs.com";

        const campaigns = await LinkCampaignUtm.find({}, { __v: 0 })
            .sort({ createdAt: -1 })
            .lean();

        const rows = campaigns.map((campaign) => {
            const totalClicks = campaign.utm_source.reduce(
                (sum, s) => sum + (s.total_clicks || 0),
                0
            );
            const totalUniques = campaign.utm_source.reduce(
                (sum, s) => sum + (s.unique_clicks || 0),
                0
            );

            return {
                _id: campaign._id,
                campaign_name: campaign.campaign_name,
                link_code: campaign.link_code,
                createdAt: campaign.createdAt,
                totalClicks,
                totalUniques,
                campaigners: campaign.utm_source.map((s) => ({
                    utm_source: s.utm_source,
                    total_clicks: s.total_clicks,
                    unique_clicks: s.unique_clicks,
                    link: `${baseUrl}?ref=${encode(
                        campaign.campaign_name,
                        s.utm_source
                    )}`,
                    conversions: s.conversions || []
                })),
            };
        });

        res.json({ ok: true, rows });
    } catch (err) {
        console.error("Error generating report:", err);
        res.status(500).json({ ok: false, error: "server_error" });
    }
};

export const getReportByCampaign = async (req, res) => {
    const { campaignName } = req.params;
    const rows = await LinkCampaignUtm.find({ campaignName }, { __v: 0 }).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, rows });
};