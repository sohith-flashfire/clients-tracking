import { useState, useEffect } from 'react'
import Login from './components/Login'
import AdminDashboard from './components/AdminDashboard'
import Monitor from './components/Monitor'

function App() {
  const [user, setUser] = useState(null);
  const [showTracking, setShowTracking] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowTracking(false);
  };

  const handleOpenTracking = () => {
    setShowTracking(true);
  };

  const handleCloseTracking = () => {
    setShowTracking(false);
  };

  // If user is not logged in, show login page
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // If user is admin and wants to see tracking, show tracking portal
  if (user.role === 'admin' && showTracking) {
    return <Monitor onClose={handleCloseTracking} />;
  }

  // If user is admin, show admin dashboard
  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} onOpenTracking={handleOpenTracking} />;
  }

  // If user is regular user, show tracking portal directly
  return <Monitor onClose={handleLogout} />;
}

export default App
