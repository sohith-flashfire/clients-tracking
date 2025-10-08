import { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_BASE || "https://applications-monitor-api.flashfirejobs.com";
const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL

async function fetchAllClients() {
    const res = await fetch(`${API_BASE}/api/clients`);
    if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return Array.isArray(data.clients) ? data.clients : [];
}

async function fetchClientDetails(email) {
    try {
        const response = await fetch(`${API_BASE}/api/clients/${encodeURIComponent(email)}`);
        if (response.ok) {
            const data = await response.json();
            return data.client;
        } else {
            console.error('Failed to fetch client details:', response.status);
        }
    } catch (error) {
        console.error('Error fetching client details:', error);
    }
    return null;
};

export function useClients() {
    const [clients, setClients] = useState([]);
    const [clientDetails, setClientDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const cacheRef = useRef({
        clients: { data: null, ts: 0 },
    });

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const now = Date.now();

                // Sync clients from jobs
                try {
                    await fetch(`${API_BASE}/api/clients/sync-from-jobs`, { method: 'POST' });
                } catch (syncError) {
                    console.warn('Client sync failed (non-critical):', syncError);
                }

                // Fetch all clients
                const clientData = await fetchAllClients();
                setClients(clientData.map(c => c.email));

                // Fetch client details
                if (cacheRef.current.clients.data && now - cacheRef.current.clients.ts < CACHE_TTL_MS) {
                    setClientDetails(cacheRef.current.clients.data);
                } else {
                    const FLASHFIRE_API_BASE = import.meta.env.VITE_FLASHFIRE_API_BASE_URL || 'https://dashboard-api.flashfirejobs.com';
                    const clientsResponse = await fetch(`${FLASHFIRE_API_BASE}/api/clients/all`);
                    if (clientsResponse.ok) {
                        const clientsData = await clientsResponse.json();
                        const clientDetailsMap = {};
                        clientsData.data.forEach(client => {
                            clientDetailsMap[client.email] = client;
                        });
                        cacheRef.current.clients = { data: clientDetailsMap, ts: now };
                        setClientDetails(clientDetailsMap);
                    } else {
                        setError("Failed to fetch client data");
                    }
                }
            } catch (e) {
                setError(e.message || "Failed to fetch");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleClientUpdate = (email, updatedClient) => {
        setClientDetails(prev => ({
            ...prev,
            [email]: updatedClient
        }));
    };

    return { clients, clientDetails, loading, error, handleClientUpdate, fetchClientDetails };
}