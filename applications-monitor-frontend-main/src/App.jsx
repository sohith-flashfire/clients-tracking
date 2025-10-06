import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import Monitor from './components/Monitor';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

function App() {
  const [user, setUser] = useState(()=>{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null });
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('portal'); // 'portal' or 'admin'
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setCurrentView(userData.role === 'admin' ? 'admin' : 'portal');
        
        // Navigate based on user role and current location
        if (location.pathname === '/' || location.pathname === '/login') {
          if (userData.role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/monitor-clients');
          }
        }
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    
    setLoading(false);
  }, [location.pathname, navigate]);
console.log(user)
  const handleLogin = (userData) => {
    setUser(userData);
    // Set default view based on user role
    setCurrentView(userData.role === 'admin' ? 'admin' : 'portal');
    
    // Navigate based on user role
    if (userData.role === 'admin') {
      navigate('/admin-dashboard');
    } else {
      navigate('/monitor-clients');
    }
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

  // Check if team lead is trying to access admin routes
  if (user.role === 'team_lead' && (location.pathname === '/admin-dashboard' || location.pathname === '/manager-dashboard')) {
    navigate('/monitor-clients');
    return null;
  }

  // Admin user - show admin dashboard or portal based on current view
  if (user.role === 'admin') {
    // Always use router for admin users to enable proper navigation
    return (
        <div>
          {/* Admin Navigation Bar */}
          <div className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-3">
                <div className="flex items-center gap-3">
                  {/* Logo */}
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 2h12v4H8v4h6v4H8v8H4V2z"/>
                      <path d="M16 2c2 2 4 6 2 10-1 2-3 3-5 3 2-2 3-5 1-7-1-1-2-2-1-3 1-1 2-2 3-3z"/>
                      <path d="M18 6c1 1 2 3 1 5-0.5 1-1.5 1.5-2.5 1.5 1-1 1.5-2.5 0.5-3.5-0.5-0.5-1-1-0.5-1.5 0.5-0.5 1-1 1.5-1.5z"/>
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">Client Tracking Portal</h1>
                    <p className="text-sm text-gray-600">Admin: {user.email}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link to={location.pathname === "/admin-dashboard" ? "/monitor-clients" : "/admin-dashboard"}>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      {location.pathname === "/admin-dashboard" ? "Monitor Clients" : "Admin Dashboard"}
                    </button>
                  </Link>
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
          <Outlet />
        </div>
      );
    }

  // Team lead user - show portal with logout option
  return (
    <div>
      {/* Team Lead Navigation Bar */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 2h12v4H8v4h6v4H8v8H4V2z"/>
                  <path d="M16 2c2 2 4 6 2 10-1 2-3 3-5 3 2-2 3-5 1-7-1-1-2-2-1-3 1-1 2-2 3-3z"/>
                  <path d="M18 6c1 1 2 3 1 5-0.5 1-1.5 1.5-2.5 1.5 1-1 1.5-2.5 0.5-3.5-0.5-0.5-1-1-0.5-1.5 0.5-0.5 1-1 1.5-1.5z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Client Tracking Portal</h1>
                <p className="text-sm text-gray-600">Team Lead: {user.email}</p>
              </div>
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
      {/* <Monitor userRole={user?.role || 'team_lead'} /> */}
      <Outlet />
    </div>
  );
}

export default App;

// import React, { useState, useEffect } from 'react';
// import Login from './components/Login';
// import {AdminLayout, PortalLayout} from './components/Navbar';
// import Monitor from './components/Monitor';
// import { Outlet, Navigate } from 'react-router-dom';

// function App() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const savedUser = localStorage.getItem('user');
//     const savedToken = localStorage.getItem('authToken');

//     if (savedUser && savedToken) {
//       try {
//         setUser(JSON.parse(savedUser));
//       } catch (err) {
//         localStorage.removeItem('user');
//         localStorage.removeItem('authToken');
//       }
//     }
//     setLoading(false);
//   }, []);

//   const handleLogin = (userData) => {
//     setUser(userData);
//     localStorage.setItem('user', JSON.stringify(userData));
//   };

//   const handleLogout = () => {
//     setUser(null);
//     localStorage.removeItem('user');
//     localStorage.removeItem('authToken');
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!user) {
//     return <Login onLogin={handleLogin} />;
//   }

//   // Role-based routing
//   if (user.role === 'admin') {
//     // return <AdminLayout user={user} onLogout={handleLogout} />;
//     return <Monitor userRole="admin" onClose={onClose} />;
//   }
//   return <PortalLayout user={user} onLogout={handleLogout} />;
// }

// export default App;
