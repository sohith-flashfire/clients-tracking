import React, { useMemo, useState, useEffect } from "react";
import ClientDetails from "./ClientDetails";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8086";

// ---------------- API ----------------
async function fetchAllJobs() {
  const res = await fetch(`${API_BASE}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({"name": "John Doe"}),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return Array.isArray(data.jobDB) ? data.jobDB : [];
}

// ---------------- Helpers ----------------
function parseFlexibleDate(input) {
  if (!input) return null;

  // Try dd/mm/yyyy format first
  const m = String(input).trim().match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i
  );

  if (m) {
    let [, d, mo, y, h = "0", mi = "0", s = "0", ap] = m;
    d = +d; mo = +mo - 1; y = +y; h = +h; mi = +mi; s = +s;
    if (ap) {
      const isPM = ap.toLowerCase() === "pm";
      if (h === 12) h = isPM ? 12 : 0;
      else if (isPM) h += 12;
    }
    return new Date(y, mo, d, h, mi, s);
  }

  // If input is already a Date or ISO string
  const native = new Date(input);
  return isNaN(native.getTime()) ? null : native;
}

function formatDate(dt) {
  if (!dt) return "—";
  return dt.toLocaleDateString("en-GB"); // forces dd/mm/yyyy
}

function formatDateTime(dt) {
  if (!dt) return "—";
  return dt.toLocaleString("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}



function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getLastTimelineStatus(timeline = []) {
  if (!timeline.length) return null;
  const last = timeline[timeline.length - 1];
  if (typeof last === "string") return last.toLowerCase();
  if (last && typeof last === "object" && last.status)
    return String(last.status).toLowerCase();
  return null;
}

function isAppliedNow(job) {
  const current = String(job.currentStatus || "").toLowerCase();
  const last = getLastTimelineStatus(job.timeline);
  return current === "applied" && last === "applied";
}

function sortByUpdatedDesc(a, b) {
  const da = parseFlexibleDate(a.updatedAt || a.dateAdded);
  const db = parseFlexibleDate(b.updatedAt || b.dateAdded);
  const ta = da ? da.getTime() : 0;
  const tb = db ? db.getTime() : 0;
  return tb - ta;
}

function safeDate(job) {
  return parseFlexibleDate(job.updatedAt || job.dateAdded);
}

// Status counters: { applied: 10, interviewing: 4, rejected: 2, ... }
function getStatusCounts(jobs = []) {
  const counts = {};
  for (const j of jobs) {
    const s = String(j.currentStatus || "").toLowerCase() || "unknown";
    counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
}

// ---------------- UI ----------------
function ClientList({ clients = [], selected, onSelect }) {
  return (
    <div className="w-64 border-r border-slate-200 p-3">
      <h3 className="mb-2 text-base font-semibold text-slate-800">Clients</h3>
      <div className="flex flex-col gap-2">
        {clients.map((c) => (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className={`w-full truncate rounded-lg border px-3 py-2 text-left transition ${
              selected === c
                ? "border-slate-300 bg-slate-100 font-semibold"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
            title={c}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBar({ counts = {}, dateAppliedCount = 0, filterDate, onStatusClick }) {
  // Show common statuses first, then any extra in alpha order.
  const commonOrder = ["applied", "interviewing", "rejected", "offer", "hired", "on-hold"];
  const keys = [
    ...commonOrder.filter((k) => counts[k]),
    ...Object.keys(counts)
      .filter((k) => !commonOrder.includes(k))
      .sort(),
  ];
  return (
    <div className="sticky top-0 z-10 mb-3 w-full border border-slate-200 bg-white/80 backdrop-blur px-3 py-2 rounded-lg">
      <div className="flex flex-wrap items-center gap-2">
        {keys.length === 0 ? (
          <span className="text-xs text-slate-500">No jobs for this client.</span>
        ) : (
          keys.map((k) => {
            // Special handling for "applied" status when date is filtered
            const isAppliedWithDate = k === "applied" && filterDate && dateAppliedCount > 0;
            const displayCount = isAppliedWithDate ? dateAppliedCount : counts[k];
            const title = isAppliedWithDate 
              ? `Applied on ${new Date(filterDate).toLocaleDateString('en-GB')}: ${dateAppliedCount} jobs`
              : `Click to view ${k} jobs`;
            
            return (
              <span
                key={k}
                className={`inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-700 ${
                  onStatusClick ? 'cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-colors' : ''
                } ${isAppliedWithDate ? 'border-blue-300 bg-blue-50' : ''}`}
                title={title}
                onClick={onStatusClick ? () => onStatusClick(k) : undefined}
              >
                <span className="capitalize">{k}</span>
                <span className={`rounded px-1.5 ${isAppliedWithDate ? 'bg-blue-200 text-blue-800 font-semibold' : 'bg-slate-100'}`}>
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

function JobCard({ job, onJobClick }) {
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

function JobDetailsModal({ job, isOpen, onClose }) {
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

function ClientCard({ client, clientDetails, onSelect }) {
  const details = clientDetails[client];
  const displayName = details?.name || client.split('@')[0];
  const initials = displayName.split(' ').map(n => n.charAt(0)).join('').toUpperCase() || client.charAt(0).toUpperCase();
  
  return (
    <button
      onClick={() => onSelect(client)}
      className="w-full p-4 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all text-left"
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
      </div>
    </button>
  );
}

function RightAppliedColumn({ jobs = [], title = "Applied" }) {
  const sorted = useMemo(() => [...jobs].sort(sortByUpdatedDesc), [jobs]);
  return (
    <div className="w-64 border-l border-slate-200 p-3">
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

// ---------------- Main Component ----------------
export default function Monitor() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [filterDate, setFilterDate] = useState(""); // yyyy-mm-dd
  const [showClients, setShowClients] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [clientDetailsEmail, setClientDetailsEmail] = useState('');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientDetails, setClientDetails] = useState({});

  // Fetch client details
  const fetchClientDetails = async (email) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8086'}/api/clients/${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        return data.client;
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
    }
    return null;
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAllJobs();
        setJobs(data);
        
        // Fetch client details for all clients
        const clientEmails = [...new Set(data.map(j => j.userID).filter(Boolean))];
        const clientDetailsMap = {};
        
        for (const email of clientEmails) {
          const details = await fetchClientDetails(email);
          if (details) {
            clientDetailsMap[email] = details;
          }
        }
        
        setClientDetails(clientDetailsMap);
      } catch (e) {
        setErr(e.message || "Failed to fetch");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Left column: clients
  const clients = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => j.userID && set.add(j.userID));
    return [...set];
  }, [jobs]);

  // Removed auto-selection - user will manually select from client cards

  const clientJobs = useMemo(() => {
    if (!selectedClient) return [];
    return jobs.filter((j) => j.userID === selectedClient);
  }, [jobs, selectedClient]);

  const statusCounts = useMemo(() => getStatusCounts(clientJobs), [clientJobs]);

  // Applied jobs for selected client (used in both middle & right)
  const appliedJobs = useMemo(() => {
    return clientJobs.filter(isAppliedNow).sort(sortByUpdatedDesc);
  }, [clientJobs]);

  // Middle column: date-filtered applied jobs (for the selected date)
  const dateFilteredJobs = useMemo(() => {
    if (!filterDate) return [];
    const target = new Date(filterDate);
    return appliedJobs.filter((job) => {
      const dt = safeDate(job);
      return dt && sameDay(dt, target);
    });
  }, [appliedJobs, filterDate]);

  const dateAppliedCount = dateFilteredJobs.length;

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clients;
    return clients.filter(client => 
      client.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [clients, clientSearchTerm]);

  // Right sidebar: jobs filtered by selected status
  const statusFilteredJobs = useMemo(() => {
    if (!selectedStatus) return [];
    try {
      return clientJobs.filter((job) => {
        const current = String(job.currentStatus || "").toLowerCase();
        const last = getLastTimelineStatus(job.timeline || []);
        const status = current || last || "unknown";
        return status === selectedStatus;
      }).sort(sortByUpdatedDesc);
    } catch (error) {
      console.error('Error filtering jobs by status:', error);
      return [];
    }
  }, [clientJobs, selectedStatus]);

  const handleCloseClientDetails = () => {
    setShowClientDetails(false);
    setClientDetailsEmail('');
  };

  if (showClientDetails) {
    return (
      <ClientDetails 
        clientEmail={clientDetailsEmail} 
        onClose={handleCloseClientDetails}
      />
    );
  }

  return (
    <div className="flex min-h-[500px] rounded-xl border border-slate-200 bg-white relative">
      {/* Left: Clients Button - Sliding Panel */}
      <div className={`${leftPanelOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-slate-200 bg-slate-50`}>
        <div className="w-64 p-3">
          <button
            onClick={() => setShowClients(true)}
            className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Clients
          </button>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => {
          if (!leftPanelOpen) {
            // Opening panel - show client selection
            setLeftPanelOpen(true);
            setShowClients(true);
          } else {
            // Closing panel
            setLeftPanelOpen(false);
          }
        }}
        className={`absolute top-4 ${leftPanelOpen ? 'left-60' : 'left-4'} z-20 w-8 h-8 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 flex items-center justify-center shadow-lg border-2 border-white`}
      >
        <svg 
          className={`w-4 h-4 transition-transform duration-300 ${leftPanelOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Middle: Content Area */}
      <div className="flex-1 overflow-auto border-r border-slate-200 p-4">
        {loading && <div className="text-slate-700">Loading…</div>}
        {!loading && err && <div className="text-red-600">Error: {err}</div>}

        {!loading && !err && showClients && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Select a Client</h2>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
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
            </div>

            {/* Client Cards Grid */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredClients.map((client) => (
                <ClientCard 
                  key={client} 
                  client={client} 
                  clientDetails={clientDetails}
                  onSelect={(client) => {
                    setSelectedClient(client);
                    setShowClients(false);
                    setLeftPanelOpen(false); // Auto-close left panel when client is selected
                  }} 
                />
              ))}
            </div>
          </div>
        )}

        {!loading && !err && selectedClient && !showClients && (
          <>
            {/* Slim status bar */}
            <div className="ml-8">
              <StatusBar
                counts={statusCounts}
                dateAppliedCount={dateAppliedCount}
                filterDate={filterDate}
                onStatusClick={(status) => {
                  // Toggle functionality: if same status is clicked, close panel
                  if (selectedStatus === status && rightSidebarOpen) {
                    setRightSidebarOpen(false);
                    setSelectedStatus(null);
                  } else {
                    setSelectedStatus(status);
                    setRightSidebarOpen(true);
                  }
                }}
              />
            </div>

            {/* Header Section */}
            <div className="mb-6">
              {/* Title and Personal Details Row */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Job Applications for <span className="text-blue-600">{selectedClient}</span>
                  </h1>
                </div>
                <button
                  onClick={() => {
                    setShowClientDetails(true);
                    setClientDetailsEmail(selectedClient);
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

              {/* Date Filter Row */}
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
                  </>
                )}
              </div>
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
                    onJobClick={(job) => {
                      setSelectedJob(job);
                      setShowJobDetails(true);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right: Jobs filtered by selected status */}
      {selectedClient && !showClients && rightSidebarOpen && (
        <RightAppliedColumn 
          jobs={selectedStatus ? statusFilteredJobs : appliedJobs} 
          title={selectedStatus ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1) : "Applied"}
        />
      )}

      {/* Job Details Modal */}
      <JobDetailsModal 
        job={selectedJob}
        isOpen={showJobDetails}
        onClose={() => {
          setShowJobDetails(false);
          setSelectedJob(null);
        }}
      />
      
    </div>
  );
}
