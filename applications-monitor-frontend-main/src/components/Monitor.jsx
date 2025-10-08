import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useClients } from '../hooks/useClients';
import { useJobs } from '../hooks/useJobs';
import ClientView from './ClientView';
import OperationsView from './OperationsView';
import ClientJobsView from './ClientJobsView';
import OperationsDetailsView from './OperationsDetailsView';
import RegisterClient from "./RegisterClient";
import ClientDetails from "./ClientDetails";
import OperationsDetails from "./OperationsDetails";
import JobDetailsModal from './JobDetailsModal';
import RightAppliedColumn from './RightAppliedColumn';
import { getLastTimelineStatus, mapStatusToStandard, sortByUpdatedDesc } from '../utils/jobUtils';

const API_BASE = import.meta.env.VITE_BASE || "https://applications-monitor-api.flashfirejobs.com";

export default function Monitor({ onClose }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role || 'team_lead';

  const { clients, clientDetails, loading: clientsLoading, error: clientsError, handleClientUpdate, fetchClientDetails } = useClients();
  const { jobs, loading: jobsLoading, error: jobsError, getJobsForClient } = useJobs();

  const [selectedClient, setSelectedClient] = useState(null);
  const [showClients, setShowClients] = useState(true);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [clientDetailsEmail, setClientDetailsEmail] = useState('');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [showOperations, setShowOperations] = useState(false);
  const [operations, setOperations] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [showOperationDetails, setShowOperationDetails] = useState(false);
  const [operationDetailsEmail, setOperationDetailsEmail] = useState('');
  const [operationsPerformance, setOperationsPerformance] = useState({});
  const [performanceDate, setPerformanceDate] = useState(new Date().toISOString().split('T')[0]);

  const [showRegisterClient, setShowRegisterClient] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.pathname === '/clients/new') {
      setShowRegisterClient(true);
      setShowClients(false);
      setShowOperations(false);
      setSelectedClient(null);
      setSelectedOperation(null);
      setSelectedStatus(null);
    } else if (window.location.pathname === '/manager-dashboard') {
      setShowRegisterClient(false);
      setShowClients(false);
      setShowOperations(false);
      setSelectedClient(null);
      setSelectedOperation(null);
      setSelectedStatus(null);
    } else {
      setShowRegisterClient(false);
      if (window.location.pathname === '/' || window.location.pathname === '/monitor-clients') {
        setShowClients(true);
        setShowOperations(false);
      }
    }
  }, []);

  const JD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const cacheRef = useRef({
    jobDescriptions: {}
  });

  const getJobId = (job) => job?._id || job?.jobID;

  const fetchJobDescriptionById = async (id) => {
    const res = await fetch(`${API_BASE}/api/jobs/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`JD API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data?.job?.jobDescription || '';
  };

  const ensureJobDescription = async (job) => {
    const id = getJobId(job);
    if (!id) return '';
    const now = Date.now();
    const entry = cacheRef.current.jobDescriptions[id];
    if (entry && now - entry.ts < JD_CACHE_TTL_MS) {
      return entry.text;
    }
    try {
      const text = await fetchJobDescriptionById(id);
      cacheRef.current.jobDescriptions[id] = { text, ts: now };
      return text;
    } catch (e) {
      console.warn('Failed to fetch job description:', e);
      return '';
    }
  };

  const fetchOperations = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/operations`);
      if (response.ok) {
        const data = await response.json();
        setOperations(data.operations);
        await fetchOperationsPerformance(data.operations);
      }
    } catch (error) {
      console.error('Error fetching operations:', error);
    }
  };

  const fetchOperationsPerformance = async (operationsList) => {
    try {
      const performanceData = {};
      const promises = operationsList.map(async (operation) => {
        try {
          const response = await fetch(`${API_BASE}/api/operations/${encodeURIComponent(operation.email)}/jobs?date=${performanceDate}`);
          if (response.ok) {
            const data = await response.json();
            performanceData[operation.email] = data.jobs.length;
          } else {
            performanceData[operation.email] = 0;
          }
        } catch (error) {
          console.error(`Error fetching performance for ${operation.email}:`, error);
          performanceData[operation.email] = 0;
        }
      });
      await Promise.all(promises);
      setOperationsPerformance(performanceData);
    } catch (error) {
      console.error('Error fetching operations performance:', error);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, []);

  useEffect(() => {
    if (operations.length > 0) {
      fetchOperationsPerformance(operations);
    }
  }, [performanceDate, operations]);

  useEffect(() => {
    if (selectedClient) {
      getJobsForClient(selectedClient);
      fetchClientDetails(selectedClient).then(client => {
        if (client) {
          handleClientUpdate(selectedClient, client);
        }
      });
    }
  }, [selectedClient]);

  const statusCounts = useMemo(() => {
    const counts = {};
    for (const j of jobs) {
        const s = mapStatusToStandard(j.currentStatus);
        counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [jobs]);

  const statusFilteredJobs = useMemo(() => {
    if (!selectedStatus) return [];
    try {
      return jobs.filter((job) => {
        const current = String(job.currentStatus || "").toLowerCase();
        const last = getLastTimelineStatus(job.timeline || []);
        const status = current || last || "unknown";
        const mappedStatus = mapStatusToStandard(status);
        return mappedStatus === selectedStatus;
      }).sort(sortByUpdatedDesc);
    } catch (error) {
      console.error('Error filtering jobs by status:', error);
      return [];
    }
  }, [jobs, selectedStatus]);

  const handleJobClick = async (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
    const desc = await ensureJobDescription(job);
    setSelectedJob(prev => prev ? { ...prev, jobDescription: desc } : prev);
  };

  const handleStatusClick = (status) => {
    if (selectedStatus === status && rightSidebarOpen) {
      setRightSidebarOpen(false);
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status);
      setRightSidebarOpen(true);
    }
  };

  const loading = clientsLoading || jobsLoading;
  const error = clientsError || jobsError;

  if (showClientDetails) {
    return (
      <ClientDetails
        clientEmail={clientDetailsEmail}
        onClose={() => setShowClientDetails(false)}
        userRole={userRole}
      />
    );
  }

  if (showOperationDetails) {
    return (
      <OperationsDetails
        operationEmail={operationDetailsEmail}
        onClose={() => setShowOperationDetails(false)}
        userRole={userRole}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="absolute top-4 right-4 z-30 flex gap-2" />
      <div className="flex min-h-[calc(100vh-2rem)] rounded-xl border border-slate-200 bg-white shadow-lg relative">
        <div className={`${leftPanelOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-slate-200 bg-blue-50`}>
          <div className="w-64 p-3 flex flex-col gap-3">
            <button
              onClick={() => {
                setShowClients(true);
                setShowOperations(false);
                setShowRegisterClient(false);
                setSelectedClient(null);
                setSelectedOperation(null);
                navigate('/');
              }}
              className={`w-full p-3 rounded-lg transition-colors font-medium ${showClients ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Clients
            </button>
            <button
              onClick={() => {
                setShowOperations(true);
                setShowClients(false);
                setShowRegisterClient(false);
                setSelectedClient(null);
                setSelectedOperation(null);
                navigate('/');
              }}
              className={`w-full p-3 rounded-lg transition-colors font-medium ${showOperations ? 'bg-green-700 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              Operations Team
            </button>
            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => {
                    setShowRegisterClient(true);
                    setShowClients(false);
                    setShowOperations(false);
                    setSelectedClient(null);
                    setSelectedOperation(null);
                    navigate('/clients/new');
                  }}
                  className={`w-full p-3 rounded-lg transition-colors font-medium ${showRegisterClient ? 'bg-orange-700 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                >
                  Register Client
                </button>
                <button
                  onClick={() => navigate('/manager-dashboard')}
                  className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Manager Dashboard
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
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

        <div className="flex-1 overflow-auto border-r border-slate-200 bg-slate-50">
          {showRegisterClient && <RegisterClient />}
          {!showRegisterClient && loading && <div className="text-slate-700 p-4">Loading…</div>}
          {!showRegisterClient && !loading && error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center m-4">
              <div className="text-red-600 font-semibold mb-2">Error: {error}</div>
            </div>
          )}

          {!showRegisterClient && !loading && !error && (
            <>
              {showClients && (
                <ClientView
                  clients={clients}
                  clientDetails={clientDetails}
                  onSelect={(client) => {
                    setSelectedClient(client);
                    setShowClients(false);
                  }}
                />
              )}
              {showOperations && (
                <OperationsView
                  operations={operations}
                  onSelect={(operation) => {
                    setSelectedOperation(operation);
                    setShowOperations(false);
                  }}
                  operationsPerformance={operationsPerformance}
                  performanceDate={performanceDate}
                  setPerformanceDate={setPerformanceDate}
                />
              )}
              {selectedClient && !showClients && (
                <ClientJobsView
                  selectedClient={selectedClient}
                  jobs={jobs}
                  statusCounts={statusCounts}
                  clientDetails={clientDetails}
                  onClientUpdate={handleClientUpdate}
                  userRole={userRole}
                  onJobClick={handleJobClick}
                  onStatusClick={handleStatusClick}
                  rightSidebarOpen={rightSidebarOpen}
                />
              )}
              {selectedOperation && !showOperations && (
                <OperationsDetailsView
                  operation={selectedOperation}
                  onBack={() => {
                    setSelectedOperation(null);
                    setShowOperations(true);
                  }}
                  onJobClick={handleJobClick}
                />
              )}
            </>
          )}
        </div>

        {selectedClient && !showClients && rightSidebarOpen && (
          <div className="bg-blue-50">
            <RightAppliedColumn
              jobs={statusFilteredJobs}
              title={selectedStatus ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1) : "Applied"}
            />
          </div>
        )}
        <JobDetailsModal
          job={selectedJob}
          isOpen={showJobDetails}
          onClose={() => {
            setShowJobDetails(false);
            setSelectedJob(null);
          }}
        />
      </div>
    </div>
  );
}