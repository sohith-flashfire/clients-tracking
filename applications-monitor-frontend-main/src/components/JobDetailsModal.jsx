import React from 'react';
import { formatDateTime, safeDate } from '../utils/jobUtils';

export default function JobDetailsModal({ job, isOpen, onClose }) {
  if (!isOpen || !job) return null;

  const dt = safeDate(job);
  const when = formatDateTime(dt);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {job.jobTitle || "Untitled Role"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Job Details */}
          <div className="w-1/3 border-r border-slate-200 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Company</h3>
                <p className="text-slate-900">{job.companyName || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Updated</h3>
                <p className="text-slate-900">{when}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Status</h3>
                <p className="text-slate-900 capitalize">{job.currentStatus || "Unknown"}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Job Link</h3>
                <a
                  href={job.joblink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {job.joblink || "Not available"}
                </a>
              </div>
            </div>
          </div>

          {/* Right Panel - Job Description */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-700 mb-4">Job Description</h3>
            <div className="prose prose-sm max-w-none">
              {typeof job.jobDescription === "string" ? (
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {job.jobDescription}
                </div>
              ) : (
                <div className="text-slate-500 italic">
                  No job description available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}