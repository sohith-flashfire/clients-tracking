import React, { useEffect, useState, useCallback } from 'react';
import Layout from './Layout';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_BASE || 'https://clients-tracking-backend.onrender.com';

export default function ClientJobAnalysis() {
  const [date, setDate] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'

  const convertToDMY = useCallback((iso) => {
    if (!iso) return '';
    const dt = new Date(iso);
    const d = dt.getDate();
    const m = dt.getMonth() + 1;
    const y = dt.getFullYear();
    return `${d}/${m}/${y}`;
  }, []);

  const fetchAnalysis = useCallback(async (selected) => {
    setLoading(true);
    try {
      const body = selected ? { date: convertToDMY(selected) } : {};
      const url = `${API_BASE}/api/analytics/client-job-analysis?t=${Date.now()}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();
      setRows(data.rows || []);
    } catch (e) {
      toast.error('Failed to load client job analysis');
    } finally {
      setLoading(false);
    }
  }, [convertToDMY]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const onRefresh = () => fetchAnalysis(date);

  const findAppliedOnDate = useCallback(async () => {
    if (!date) {
      toast.error('Pick a date first');
      return;
    }
    try {
      const body = { date: convertToDMY(date) };
      const url = `${API_BASE}/api/analytics/applied-by-date?t=${Date.now()}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error('Failed');
      const data = await resp.json();
      const map = data.counts || {};
      // Merge counts into current rows optimally without extra fetch
      setRows(prev => (prev || []).map(r => ({ ...r, appliedOnDate: Number(map[r.email] || 0) })));
      toast.success(`Updated applied-on-date for ${Object.keys(map).length} client(s)`);
    } catch (e) {
      toast.error('Failed to fetch applied-on-date');
    }
  }, [date, convertToDMY]);

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">Client Job Analysis</h1>
            <div className="ml-auto flex items-center gap-3">
              <label className="text-sm text-gray-700">Select Date:</label>
              <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md"/>
              <button onClick={findAppliedOnDate} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">Find Applied on this Date</button>
              <button onClick={onRefresh} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{loading? 'Loading...' : 'Refresh'}</button>
              {/* <Link to="/call-scheduler" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Call Scheduler</Link> */}
            </div>
          </div>
          <div className="px-6 py-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Client</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Total Applications</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Saved</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Applied</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Interviewing</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Offer</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Rejected</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Removed</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>{date ? `Applied on ${convertToDMY(date)}` : 'Applied on Date'}</span>
                      <button
                        type="button"
                        onClick={() => setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                        title={`Sort ${sortDir === 'asc' ? 'descending' : 'ascending'}`}
                        className="px-2 py-0.5 text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                      >
                        {sortDir === 'asc' ? '▲' : '▼'}
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...(rows||[])].sort((a,b)=>{
                  const av = Number(a?.appliedOnDate || 0);
                  const bv = Number(b?.appliedOnDate || 0);
                  return sortDir === 'asc' ? av - bv : bv - av;
                }).map((r, idx) => (
                  <tr key={r.email+idx} className={idx%2===0? 'bg-white':'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm text-gray-900">{r.email}</td>
                    <td className="px-4 py-2 text-sm">
                      {(Number(r.saved||0) + Number(r.applied||0) + Number(r.interviewing||0) + Number(r.offer||0))}
                    </td>
                    <td className="px-4 py-2 text-sm">{r.saved}</td>
                    <td className="px-4 py-2 text-sm">{r.applied}</td>
                    <td className="px-4 py-2 text-sm">{r.interviewing}</td>
                    <td className="px-4 py-2 text-sm">{r.offer}</td>
                    <td className="px-4 py-2 text-sm">{r.rejected}</td>
                    <td className="px-4 py-2 text-sm">{r.removed}</td>
                    <td className={`px-4 py-2 text-sm font-semibold ${date ? (r.appliedOnDate > 0 ? 'text-blue-800' : 'text-slate-500') : ''}`}>
                      {date ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${r.appliedOnDate > 0 ? 'bg-blue-100 border border-blue-300' : 'bg-slate-100 border border-slate-300 text-slate-600'}`}>
                          {r.appliedOnDate}
                        </span>
                      ) : (
                        r.appliedOnDate
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length===0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}


