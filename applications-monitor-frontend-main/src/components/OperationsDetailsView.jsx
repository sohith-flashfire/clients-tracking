import React, { useState, useEffect, useMemo } from 'react';
import JobCard from './JobCard';

const API_BASE = import.meta.env.VITE_BASE || "https://applications-monitor-api.flashfirejobs.com";

export default function OperationsDetailsView({ operation, onBack, onJobClick }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [availableClients, setAvailableClients] = useState([]);

    useEffect(() => {
        const fetchOperationData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/api/operations/${encodeURIComponent(operation.email)}/jobs`);
                if (response.ok) {
                    const data = await response.json();
                    setJobs(data.jobs);
                    const uniqueUserIDs = [...new Set(data.jobs.map(job => job.userID).filter(id =>
                        id && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(id)
                    ))];
                    setAvailableClients(uniqueUserIDs);
                }
            } catch (err) {
                setError(err.message || 'Failed to fetch operation data');
            } finally {
                setLoading(false);
            }
        };

        fetchOperationData();
    }, [operation]);

    const filteredJobs = useMemo(() => {
        let filtered = jobs;
        if (filterDate) {
            const targetDate = new Date(filterDate);
            const month = targetDate.getMonth() + 1;
            const day = targetDate.getDate();
            const year = targetDate.getFullYear();
            const dateString = `${day}/${month}/${year}`;
            filtered = filtered.filter(job => job.appliedDate && job.appliedDate.includes(dateString));
        }
        if (clientFilter) {
            filtered = filtered.filter(job => job.userID === clientFilter);
        }
        return filtered;
    }, [jobs, filterDate, clientFilter]);

    return (
        <>
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-medium shadow-sm">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                        <span>Back to Operations Team</span>
                    </button>
                    <div className="flex-1 text-center">
                        <h1 className="text-3xl font-bold text-slate-900">
                            Operations Dashboard - <span className="text-green-600">{operation.name || operation.email}</span>
                        </h1>
                        <p className="text-lg text-slate-600 mt-2">
                            Track job applications and manage client assignments
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-medium text-slate-700">Filter by date:</label>
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {filterDate && (
                    <button onClick={() => setFilterDate('')} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                        Clear
                    </button>
                )}
            </div>

            <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-medium text-slate-700">Filter by client:</label>
                <select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                    <option value="">All Clients</option>
                    {availableClients.map((client) => (
                        <option key={client} value={client}>{client}</option>
                    ))}
                </select>
                {clientFilter && (
                    <button onClick={() => setClientFilter('')} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                        Clear
                    </button>
                )}
            </div>

            {loading && <div className="text-slate-700 p-4">Loading jobs...</div>}
            {error && <div className="text-red-600 p-4">{error}</div>}
            {!loading && !error && filteredJobs.length === 0 && (
                <div className="text-slate-600">No jobs found for the selected filters.</div>
            )}
            {!loading && !error && filteredJobs.length > 0 && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.map((job) => (
                        <JobCard
                            key={job._id || job.jobID || `${job.userID}-${job.joblink}`}
                            job={job}
                            onJobClick={onJobClick}
                        />
                    ))}
                </div>
            )}
        </>
    );
}