import { useState, useRef } from 'react';

const API_BASE = import.meta.env.VITE_BASE || "https://applications-monitor-api.flashfirejobs.com";
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

async function fetchJobsForClient(email) {
    const res = await fetch(`${API_BASE}/api/clients/${encodeURIComponent(email)}/jobs`);
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return Array.isArray(data.jobs) ? data.jobs : [];
}

export function useJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const cacheRef = useRef({
        jobsByClient: {}, // { [email]: { data, ts } }
    });

    const getJobsForClient = async (email) => {
        if (!email) {
            setJobs([]);
            return;
        }

        try {
            setLoading(true);
            const now = Date.now();
            const cached = cacheRef.current.jobsByClient[email];

            if (cached && now - cached.ts < CACHE_TTL_MS) {
                setJobs(cached.data);
            } else {
                const data = await fetchJobsForClient(email);
                cacheRef.current.jobsByClient[email] = { data, ts: now };
                setJobs(data);
            }
        } catch (e) {
            setError(e.message || "Failed to fetch jobs for client");
        } finally {
            setLoading(false);
        }
    };

    return { jobs, loading, error, getJobsForClient };
}