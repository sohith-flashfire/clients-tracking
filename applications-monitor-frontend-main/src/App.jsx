import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import Monitor from './components/Monitor';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('portal'); // 'portal' or 'admin'

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Set default view based on user role
    setCurrentView(userData.role === 'admin' ? 'admin' : 'portal');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('portal');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  };

  const handleGoToPortal = () => {
    setCurrentView('portal');
  };

  const handleGoToAdmin = () => {
    setCurrentView('admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Admin user - show admin dashboard or portal based on current view
  if (user.role === 'admin') {
    if (currentView === 'admin') {
      return <AdminDashboard user={user} onLogout={handleLogout} onGoToPortal={handleGoToPortal} />;
    } else {
      return (
        <div>
          {/* Admin Navigation Bar */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-3">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Tracking Portal</h1>
                  <p className="text-sm text-gray-600">Admin: {user.email}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleGoToAdmin}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Admin Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
          <Monitor />
        </div>
      );
    }
  }

  // Team lead user - show portal with logout option
  return (
    <div>
      {/* Team Lead Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Tracking Portal</h1>
              <p className="text-sm text-gray-600">Team Lead: {user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <Monitor />
    </div>
  );
}

export default App;
