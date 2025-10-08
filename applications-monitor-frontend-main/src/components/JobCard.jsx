import React from 'react';

export default function JobCard({ job, onJobClick }) {
    return (
        <div
            onClick={() => onJobClick(job)}
            className="cursor-pointer rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition-colors"
        >
            <div className="font-semibold">{job.jobTitle || "Untitled Role"}</div>
            <div className="mt-0.5 text-sm text-slate-600">
                {job.companyName || "Company"}
            </div>
        </div>
    );
}