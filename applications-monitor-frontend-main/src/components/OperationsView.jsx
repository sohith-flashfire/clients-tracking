import React, { useMemo, useState } from 'react';
import OperationCard from './OperationCard'; // Assuming OperationCard is in the same directory

export default function OperationsView({ operations, onSelect, operationsPerformance, performanceDate, setPerformanceDate }) {
    const [operationSearchTerm, setOperationSearchTerm] = useState('');

    const filteredOperations = useMemo(() => {
        if (!operationSearchTerm) return operations;
        return operations.filter(operation =>
            operation.name?.toLowerCase().includes(operationSearchTerm.toLowerCase()) ||
            operation.email?.toLowerCase().includes(operationSearchTerm.toLowerCase())
        );
    }, [operations, operationSearchTerm]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Select an Operations Team Member</h2>
            </div>

            <div className="mb-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-slate-700">Performance Date:</label>
                    <input
                        type="date"
                        value={performanceDate}
                        onChange={(e) => setPerformanceDate(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <div className="text-sm text-slate-600">
                        Shows jobs applied on selected date
                    </div>
                </div>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search operations team..."
                        value={operationSearchTerm}
                        onChange={(e) => setOperationSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredOperations.map((operation) => (
                    <OperationCard
                        key={operation._id}
                        operation={operation}
                        onSelect={onSelect}
                        performanceCount={operationsPerformance[operation.email] || 0}
                        performanceDate={performanceDate}
                    />
                ))}
            </div>
        </div>
    );
}