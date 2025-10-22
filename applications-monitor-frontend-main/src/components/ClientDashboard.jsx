import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Layout from './Layout';

const API_BASE = import.meta.env.VITE_BASE || 'http://localhost:10000';

// Validate required environment variables
if (!API_BASE) {
  console.error('❌ VITE_BASE environment variable is required');
}

export default function ClientDashboard() {
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [planTypeStats, setPlanTypeStats] = useState([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch monthly client statistics
  const fetchMonthlyStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/clients/stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMonthlyStats(data.data.monthlyData);
          setTotalClients(data.data.totalClients);
        } else {
          throw new Error(data.message || 'Failed to fetch monthly stats');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      setError('Failed to fetch monthly statistics');
      toast.error('Failed to fetch monthly statistics');
    }
  };

  // Fetch plan type statistics
  const fetchPlanTypeStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/clients/plan-stats`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPlanTypeStats(data.data.planTypeStats);
        } else {
          throw new Error(data.message || 'Failed to fetch plan type stats');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching plan type stats:', error);
      setError('Failed to fetch plan type statistics');
      toast.error('Failed to fetch plan type statistics');
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([fetchMonthlyStats(), fetchPlanTypeStats()]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate growth percentage
  const calculateGrowth = () => {
    if (monthlyStats.length < 2) return 0;
    const currentMonth = monthlyStats[monthlyStats.length - 1];
    const previousMonth = monthlyStats[monthlyStats.length - 2];
    if (previousMonth.count === 0) return currentMonth.count > 0 ? 100 : 0;
    return ((currentMonth.count - previousMonth.count) / previousMonth.count * 100).toFixed(1);
  };

  // Get plan type color
  const getPlanTypeColor = (planType) => {
    const colors = {
      'Executive': '#8B5CF6', // Purple
      'Professional': '#3B82F6', // Blue
      'Ignite': '#F59E0B', // Orange
      'Free Trial': '#6B7280' // Gray
    };
    return colors[planType] || '#6B7280';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Client Dashboard</h1>
          <p className="text-gray-600">Analytics and insights for client growth and plan distribution</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Clients</p>
                <p className="text-2xl font-semibold text-gray-900">{totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{calculateGrowth()}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {monthlyStats.length > 0 ? monthlyStats[monthlyStats.length - 1].count : 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Growth Chart */}
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Monthly Client Growth</h2>
            <div className="h-64">
              <svg width="100%" height="100%" viewBox="0 0 400 250">
                {/* Chart background */}
                <rect width="100%" height="100%" fill="#f8fafc" />
                
                {/* Y-axis */}
                <line x1="40" y1="20" x2="40" y2="230" stroke="#e2e8f0" strokeWidth="2" />
                
                {/* X-axis */}
                <line x1="40" y1="230" x2="380" y2="230" stroke="#e2e8f0" strokeWidth="2" />
                
                {/* Y-axis labels */}
                {[0, 5, 10, 15, 20, 25].map((value, index) => (
                  <g key={value}>
                    <line x1="35" y1={230 - (value * 8)} x2="45" y2={230 - (value * 8)} stroke="#64748b" />
                    <text x="30" y={235 - (value * 8)} textAnchor="end" className="text-xs fill-gray-600">
                      {value}
                    </text>
                  </g>
                ))}
                
                {/* Chart line and points */}
                {monthlyStats.length > 0 && (() => {
                  const maxValue = Math.max(...monthlyStats.map(d => d.count), 1);
                  const scale = 200 / maxValue;
                  const stepX = 340 / (monthlyStats.length - 1);
                  
                  return (
                    <>
                      {/* Line path */}
                      <path
                        d={`M ${monthlyStats.map((d, i) => 
                          `${50 + i * stepX},${230 - d.count * scale}`
                        ).join(' L ')}`}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="3"
                      />
                      
                      {/* Data points */}
                      {monthlyStats.map((d, i) => (
                        <g key={i}>
                          <circle
                            cx={50 + i * stepX}
                            cy={230 - d.count * scale}
                            r="4"
                            fill="#3b82f6"
                            stroke="white"
                            strokeWidth="2"
                          />
                          {/* Value labels */}
                          <text
                            x={50 + i * stepX}
                            y={230 - d.count * scale - 10}
                            textAnchor="middle"
                            className="text-xs fill-gray-700 font-medium"
                          >
                            {d.count}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
                
                {/* X-axis labels */}
                {monthlyStats.map((d, i) => (
                  <text
                    key={i}
                    x={50 + i * (340 / (monthlyStats.length - 1))}
                    y="245"
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                    transform={`rotate(-45 ${50 + i * (340 / (monthlyStats.length - 1))} 245)`}
                  >
                    {d.month}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          {/* Plan Type Distribution Chart */}
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Plan Type Distribution</h2>
            <div className="h-64">
              <svg width="100%" height="100%" viewBox="0 0 400 250">
                {/* Chart background */}
                <rect width="100%" height="100%" fill="#f8fafc" />
                
                {planTypeStats.length > 0 && (() => {
                  const total = planTypeStats.reduce((sum, d) => sum + d.count, 0);
                  let currentAngle = 0;
                  const centerX = 150;
                  const centerY = 125;
                  const radius = 60;
                  
                  return (
                    <>
                      {/* Pie slices */}
                      {planTypeStats.map((d, i) => {
                        const percentage = (d.count / total) * 100;
                        const angle = (d.count / total) * 360;
                        const endAngle = currentAngle + angle;
                        
                        const x1 = centerX + radius * Math.cos((currentAngle - 90) * Math.PI / 180);
                        const y1 = centerY + radius * Math.sin((currentAngle - 90) * Math.PI / 180);
                        const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
                        const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
                        
                        const largeArcFlag = angle > 180 ? 1 : 0;
                        const pathData = [
                          `M ${centerX} ${centerY}`,
                          `L ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                          'Z'
                        ].join(' ');
                        
                        currentAngle = endAngle;
                        
                        return (
                          <path
                            key={i}
                            d={pathData}
                            fill={getPlanTypeColor(d.planType)}
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                      })}
                      
                      {/* Legend */}
                      {planTypeStats.map((d, i) => (
                        <g key={i}>
                          <rect
                            x={250}
                            y={40 + i * 25}
                            width="12"
                            height="12"
                            fill={getPlanTypeColor(d.planType)}
                          />
                          <text
                            x={270}
                            y={50 + i * 25}
                            className="text-xs fill-gray-700"
                          >
                            {d.planType} ({d.count} - {d.percentage}%)
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-md border">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Plan Type Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {planTypeStats.map((plan, index) => (
              <div key={index} className="p-3 rounded-lg border" style={{ backgroundColor: `${getPlanTypeColor(plan.planType)}20` }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{plan.planType}</p>
                    <p className="text-2xl font-bold" style={{ color: getPlanTypeColor(plan.planType) }}>
                      {plan.count}
                    </p>
                    <p className="text-sm text-gray-500">{plan.percentage}% of total</p>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: getPlanTypeColor(plan.planType) }}>
                    <span className="text-white text-sm font-bold">{plan.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
