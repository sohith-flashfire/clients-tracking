import React from 'react';
import { Link } from 'react-router-dom';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="flex min-h-[calc(100vh-2rem)] rounded-xl border border-slate-200 bg-white shadow-lg">
        {/* Fixed Left Sidebar */}
        <div className="w-64 border-r border-slate-200 bg-blue-50 flex-shrink-0">
          <div className="p-3 flex flex-col gap-3">
            <Link to="/monitor-clients">
              <button className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Clients
              </button>
            </Link>
            <Link to="/manager-dashboard">
              <button className="w-full p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                Manager Dashboard
              </button>
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {children}
        </div>
      </div>
    </div>
  );
}
