import React, { useMemo, useState } from 'react';
import StatusBar from './StatusBar';
import ClientDetailsSection from './ClientDetailsSection';
import JobCard from './JobCard';

function safeDate(job) {
    // This helper function is duplicated here, but in a real-world scenario
    // it would be moved to a shared utils file.
    if (!job.appliedDate && !job.updatedAt && !job.dateAdded) return null;
    const dt = new Date(job.appliedDate || job.updatedAt || job.dateAdded);
    return isNaN(dt.getTime()) ? null : dt;
}

function sameDay(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export default function ClientJobsView({
    selectedClient,
    jobs,
    statusCounts,
    clientDetails,
    onClientUpdate,
    userRole,
    onJobClick,
    onStatusClick,
    rightSidebarOpen
}) {
    const [filterDate, setFilterDate] = useState("");

    const appliedJobs = useMemo(() => {
        return jobs.filter(job => String(job.currentStatus || "").toLowerCase().includes("applied"))
            .sort((a, b) => {
                const da = safeDate(a);
                const db = safeDate(b);
                return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
            });
    }, [jobs]);

    const dateFilteredJobs = useMemo(() => {
        if (!filterDate) return [];
        const target = new Date(filterDate);
        return appliedJobs.filter((job) => {
            const dt = safeDate(job);
            return dt && sameDay(dt, target);
        });
    }, [appliedJobs, filterDate]);

    const dateAppliedCount = dateFilteredJobs.length;

    const calculateDailyTarget = useMemo(() => {
        if (!selectedClient || !filterDate) return null;

        const clientDetail = clientDetails[selectedClient];
        if (!clientDetail || !clientDetail.applicationStartDate) return null;

        try {
            const startDate = new Date(clientDetail.applicationStartDate);
            const endDate = new Date(filterDate);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

            let workingDays = 0;
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dayOfWeek = currentDate.getDay();
                if (dayOfWeek >= 1 && dayOfWeek <= 6) { // Monday to Saturday
                    workingDays++;
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }

            if (workingDays < 0) return null;

            const dailyTarget = 35;
            const expectedApplications = workingDays * dailyTarget;

            const actualApplications = jobs.filter(job => {
                if (job.userID !== selectedClient) return false;
                const jobDate = safeDate(job);
                return jobDate && jobDate >= startDate && jobDate <= endDate && String(job.currentStatus || "").toLowerCase().includes("applied");
            }).length;

            return {
                daysPassed: workingDays,
                expectedApplications,
                actualApplications,
                dailyTarget
            };
        } catch (error) {
            console.error('Error calculating daily target:', error);
            return null;
        }
    }, [selectedClient, filterDate, clientDetails, jobs]);

    return (
        <>
            <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex-1 text-center">
                        <h1 className="text-3xl font-bold text-slate-900">
                            Job Applications for <span className="text-blue-600">{selectedClient}</span>
                        </h1>
                    </div>
                    <button
                        onClick={() => {
                            // This part needs to be handled by the parent component
                        }}
                        className="group flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-medium shadow-sm"
                    >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <span>Personal Details</span>
                        <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="ml-8 mb-6">
                <StatusBar
                    counts={statusCounts}
                    dateAppliedCount={dateAppliedCount}
                    filterDate={filterDate}
                    onStatusClick={onStatusClick}
                />
            </div>

            <div className="ml-8 mb-6">
                <ClientDetailsSection
                    clientEmail={selectedClient}
                    clientDetails={clientDetails[selectedClient]}
                    onClientUpdate={onClientUpdate}
                    userRole={userRole}
                />
            </div>

            <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Filter by date:</label>
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {filterDate && (
                    <>
                        <button
                            onClick={() => setFilterDate("")}
                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-sm font-medium text-blue-800">
                                Applied on {new Date(filterDate).toLocaleDateString('en-GB')}:
                            </span>
                            <span className="text-sm font-bold text-blue-900 bg-blue-200 px-2 py-0.5 rounded">
                                {dateAppliedCount}
                            </span>
                        </div>
                        {calculateDailyTarget && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
                                <span className="text-sm font-medium text-green-800">
                                    Expected: {calculateDailyTarget.expectedApplications} |
                                    Applied: {calculateDailyTarget.actualApplications} |
                                    Working Days: {calculateDailyTarget.daysPassed}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {!filterDate && (
                <div className="text-slate-600">
                    Pick a date to see jobs applied on that day.
                </div>
            )}

            {filterDate && dateFilteredJobs.length === 0 && (
                <div className="text-slate-600">
                    No applied jobs for the selected date.
                </div>
            )}

            {filterDate && dateFilteredJobs.length > 0 && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {dateFilteredJobs.map((job) => (
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