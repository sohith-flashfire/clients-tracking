import React, { useMemo, useState } from 'react';
import ClientCard from './ClientCard'; // Assuming ClientCard is in the same directory

export default function ClientView({ clients, clientDetails, onSelect }) {
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [clientStatusFilter, setClientStatusFilter] = useState('all');

    const filteredClients = useMemo(() => {
        let filtered = clients;

        if (clientSearchTerm) {
            filtered = filtered.filter(client =>
                client.toLowerCase().includes(clientSearchTerm.toLowerCase())
            );
        }

        if (clientStatusFilter !== 'all') {
            filtered = filtered.filter(client => {
                const clientDetail = clientDetails[client];
                if (!clientDetail) return false;

                const status = clientDetail.status?.toLowerCase();
                return status === clientStatusFilter;
            });
        }

        return filtered;
    }, [clients, clientSearchTerm, clientStatusFilter, clientDetails]);

    return (
        <div>
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Select a Client</h2>
            </div>

            <div className="mb-6 flex gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={clientSearchTerm}
                        onChange={(e) => setClientSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg
                        className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex-shrink-0">
                    <select
                        value={clientStatusFilter}
                        onChange={(e) => setClientStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-700"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredClients.map((client) => (
                    <ClientCard
                        key={client}
                        client={client}
                        clientDetails={clientDetails}
                        onSelect={onSelect}
                    />
                ))}
            </div>
        </div>
    );
}