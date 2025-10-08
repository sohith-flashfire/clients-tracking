import React from 'react';

export default function OperationCard({ operation, onSelect, performanceCount = 0, performanceDate }) {
    const displayName = operation.name || operation.email.split('@')[0];
    const initials = displayName.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || operation.email.charAt(0).toUpperCase();

    return (
        <button
            onClick={() => onSelect(operation)}
            className="w-full p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-left"
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">
                        {initials}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                        {displayName}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                        {operation.email}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">
                        {operation.role}
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-xs text-slate-500 mb-1">
                        Applied on {new Date(performanceDate).toLocaleDateString('en-GB')}:
                    </div>
                    <div className="bg-green-100 text-green-800 text-sm font-bold px-2 py-1 rounded-full">
                        {performanceCount}
                    </div>
                </div>
            </div>
        </button>
    );
}