import React from 'react';

export default function StatusBar({ counts = {}, dateAppliedCount = 0, filterDate, onStatusClick }) {
    const commonOrder = ["saved", "applied", "interviewing", "offers", "rejected", "removed"];

    const allStatuses = {};
    commonOrder.forEach(status => {
        allStatuses[status] = counts[status] || 0;
    });

    Object.keys(counts).forEach(status => {
        if (!commonOrder.includes(status)) {
            allStatuses[status] = counts[status];
        }
    });

    const keys = [
        ...commonOrder.filter((k) => allStatuses.hasOwnProperty(k)),
        ...Object.keys(allStatuses)
            .filter((k) => !commonOrder.includes(k))
            .sort(),
    ];

    return (
        <div className="sticky top-0 z-10 mb-3 w-full border border-slate-200 bg-white px-3 py-2 rounded-lg">
            <div className="flex flex-wrap items-center gap-2">
                {keys.length === 0 ? (
                    <span className="text-xs text-slate-500">No jobs for this client.</span>
                ) : (
                    keys.map((k) => {
                        const isAppliedWithDate = k === "applied" && filterDate && dateAppliedCount > 0;
                        const displayCount = isAppliedWithDate ? dateAppliedCount : allStatuses[k];
                        const title = isAppliedWithDate
                            ? `Applied on ${new Date(filterDate).toLocaleDateString('en-GB')}: ${dateAppliedCount} jobs`
                            : `Click to view ${k} jobs`;

                        return (
                            <span
                                key={k}
                                className={`inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700 ${onStatusClick ? 'cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-colors' : ''
                                    } ${isAppliedWithDate ? 'border-blue-300 bg-blue-50' : ''} ${allStatuses[k] === 0 ? 'opacity-60' : ''}`}
                                title={title}
                                onClick={onStatusClick ? () => onStatusClick(k) : undefined}
                            >
                                <span className="capitalize">{k}</span>
                                <span className={`rounded px-1.5 ${isAppliedWithDate ? 'bg-blue-200 text-blue-800 font-semibold' : allStatuses[k] === 0 ? 'bg-slate-200 text-slate-500' : 'bg-slate-100'}`}>
                                    {displayCount}
                                </span>
                                {isAppliedWithDate && (
                                    <span className="text-xs text-blue-600 font-medium">
                                        (on {new Date(filterDate).toLocaleDateString('en-GB')})
                                    </span>
                                )}
                            </span>
                        );
                    })
                )}
            </div>
        </div>
    );
}