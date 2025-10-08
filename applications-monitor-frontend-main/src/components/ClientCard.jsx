import React from 'react';

export default function ClientCard({ client, clientDetails, onSelect }) {
    const details = clientDetails[client];
    const displayName = details?.name || client.split('@')[0];
    const initials = displayName.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || client.charAt(0).toUpperCase();
    const status = details?.status || 'active';

    return (
        <button
            onClick={() => onSelect(client)}
            className="w-full p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-left relative"
        >
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">
                        {initials}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">
                        {displayName}
                    </div>
                    <div className="text-sm text-slate-500 truncate">
                        {client}
                    </div>
                </div>
                {/* Status indicator */}
                <div className={`w-3 h-3 rounded-full ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} title={`Status: ${status}`}></div>
            </div>
        </button>
    );
}