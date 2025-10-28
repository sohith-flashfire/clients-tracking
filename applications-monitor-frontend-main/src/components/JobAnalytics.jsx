import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from './Layout';

const API_BASE = import.meta.env.VITE_BASE || 'https://clients-tracking-backend.onrender.com';

if (!API_BASE) {
  console.error('❌ VITE_BASE environment variable is required');
}

export default function JobAnalytics() {
  const [selectedDate, setSelectedDate] = useState('');
  const [jobData, setJobData] = useState({});
  const [loading, setLoading] = useState(false);

  // Set default date to a date with data
  useEffect(() => {
    // Set to December 8, 2025 which has data
    setSelectedDate('2025-12-08');
  }, []);

  const fetchJobsByDate = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/jobs/by-date`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch job data');
      }

      const data = await response.json();
      setJobData(data);
      
      toast.success('Job data loaded successfully');
    } catch (error) {
      console.error('Error fetching job data:', error);
      toast.error('Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch data when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchJobsByDate();
    }
  }, [selectedDate]);

  const getStatusCount = (status) => {
    return jobData[status]?.count || 0;
  };

  const getStatusClients = (status) => {
    return jobData[status]?.clients || [];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Job Status Dashboard</h1>
            <p className="text-gray-600 mt-1">View job counts by status for a specific date</p>
          </div>

          {/* Date Selector */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Select Date:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={fetchJobsByDate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              💡 <strong>Dates with data:</strong> Jul 17, 2025 (8 jobs), Oct 15, 2025 (11 jobs), Dec 8, 2025 (95 jobs), Dec 9, 2025 (137 jobs)
            </div>
          </div>

          {/* Job Status Table */}
          <div className="px-6 py-4">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading job data...</span>
              </div>
            ) : Object.keys(jobData).length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clients
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="bg-blue-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-200 text-blue-900">
                          Total Jobs Found
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-bold text-xl text-blue-600">{jobData.totalJobs || 0}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <span className="text-gray-400">All jobs for selected date</span>
                      </td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Saved
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-lg">{getStatusCount('saved')}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getStatusClients('saved').map((client, index) => (
                          <div key={index} className="mb-1">
                            {client.email} ({client.count} jobs)
                          </div>
                        ))}
                        {getStatusClients('saved').length === 0 && (
                          <span className="text-gray-400">No clients</span>
                        )}
                      </td>
                    </tr>
                    
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Applied
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-lg">{getStatusCount('applied')}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getStatusClients('applied').map((client, index) => (
                          <div key={index} className="mb-1">
                            {client.email} ({client.count} jobs)
                          </div>
                        ))}
                        {getStatusClients('applied').length === 0 && (
                          <span className="text-gray-400">No clients</span>
                        )}
                      </td>
                    </tr>
                    
                    <tr className="bg-white">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Interviewing
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-lg">{getStatusCount('interviewing')}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getStatusClients('interviewing').map((client, index) => (
                          <div key={index} className="mb-1">
                            {client.email} ({client.count} jobs)
                          </div>
                        ))}
                        {getStatusClients('interviewing').length === 0 && (
                          <span className="text-gray-400">No clients</span>
                        )}
                      </td>
                    </tr>
                    
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          Offer
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-lg">{getStatusCount('offer')}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getStatusClients('offer').map((client, index) => (
                          <div key={index} className="mb-1">
                            {client.email} ({client.count} jobs)
                          </div>
                        ))}
                        {getStatusClients('offer').length === 0 && (
                          <span className="text-gray-400">No clients</span>
                        )}
                      </td>
                    </tr>
                    
                    <tr className="bg-white">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Deleted
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold text-lg">{getStatusCount('deleted')}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getStatusClients('deleted').map((client, index) => (
                          <div key={index} className="mb-1">
                            {client.email} ({client.count} jobs)
                          </div>
                        ))}
                        {getStatusClients('deleted').length === 0 && (
                          <span className="text-gray-400">No clients</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">No job data found for the selected date</div>
                <div className="text-gray-400 text-sm mt-2">Try selecting a different date</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
