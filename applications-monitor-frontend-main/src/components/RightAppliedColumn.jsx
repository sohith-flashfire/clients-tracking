import React, { useMemo } from 'react';
import { sortByUpdatedDesc, formatDate, safeDate } from '../utils/jobUtils';

function CompactRow({ job }) {
    const dt = safeDate(job);
    const when = formatDate(dt);
    return (
        <div className="rounded-lg border border-slate-200 px-3 py-2">
            <div className="truncate text-sm font-semibold">
                {job.jobTitle || "Untitled Role"}
            </div>
            <div className="truncate text-xs text-slate-600">
                {(job.companyName || "Company") + " • " + when}
            </div>
        </div>
    );
}

export default function RightAppliedColumn({ jobs = [], title = "Applied" }) {
    const sorted = useMemo(() => [...jobs].sort(sortByUpdatedDesc), [jobs]);
    return (
        <div className="w-64 border-l border-slate-200 p-3 bg-white shadow-sm">
            <h3 className="mb-2 text-base font-semibold text-slate-800">
                {title} <span className="text-slate-500">({sorted.length})</span>
            </h3>
            <div className="flex max-h-[calc(100vh-10rem)] flex-col gap-2 overflow-y-auto">
                {sorted.map((j) => (
                    <CompactRow key={j._id || j.jobID || `${j.userID}-${j.joblink}`} job={j} />
                ))}
            </div>
        </div>
    );
}