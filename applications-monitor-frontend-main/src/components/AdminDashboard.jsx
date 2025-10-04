import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_BASE || 'http://localhost:10000';

// Validate required environment variables
if (!API_BASE) {
  console.error('❌ VITE_BASE environment variable is required');
}

export default function AdminDashboard({ user, onLogout, onGoToPortal }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '' });
  const [sessionKeys, setSessionKeys] = useState({});
  const [loadingSessionKey, setLoadingSessionKey] = useState({});

  // Get auth token
  const getAuthToken = () => localStorage.getItem('authToken');

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError('Failed to fetch users');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Create new user
  const createUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setNewUser({ email: '', password: '' });
        setShowAddUser(false);
        fetchUsers(); // Refresh users list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  // Generate session key for user
  const generateSessionKey = async (userEmail) => {
    setLoadingSessionKey(prev => ({ ...prev, [userEmail]: true }));

    try {
      const response = await fetch(`${API_BASE}/api/auth/session-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ userEmail })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionKeys(prev => ({
          ...prev,
          [userEmail]: data.sessionKey
        }));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to generate session key');
      }
    } catch (error) {
      setError('Network error');
    } finally {
      setLoadingSessionKey(prev => ({ ...prev, [userEmail]: false }));
    }
  };

  // Fetch session keys for a user
  const fetchSessionKeys = async (userEmail) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/session-keys/${userEmail}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.sessionKeys;
      }
    } catch (error) {
      console.error('Error fetching session keys:', error);
    }
    return [];
  };

  // Delete user
  const deleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (response.ok) {
        setError('');
        fetchUsers(); // Refresh users list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete user');
      }
    } catch (error) {
      setError('Network error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome, {user?.email}</p>
            </div>
            <div className="flex gap-3">
              {/* <button
                onClick={onGoToPortal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Client Tracking Portal
              </button> */}
              {/* <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Manage E-Mail Campaigns</h2>
             <Link to="/email-campaigns/report">
            <button
              // onClick={() => setShowAddUser(!showAddUser)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Campaign Reports
            </button>
            </Link>
            <Link to="/email-campaigns">
            <button
              // onClick={() => setShowAddUser(!showAddUser)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {/* {showAddUser ? 'Cancel' : 'Add Team Lead'} */}Manage E-mail Campaigns
            </button>
            </Link>
          </div>
        </div>

        {/* Add User Section */}

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {showAddUser ? 'Cancel' : 'Add Team Lead'}
            </button>
          </div>
          

          {showAddUser && (
            <form onSubmit={createUser} className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="teamlead@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Create Team Lead
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role === 'team_lead' ? (
                          <div className="flex items-center gap-2">
                            {sessionKeys[user.email] ? (
                              <div className="flex items-center gap-2">
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                                  {sessionKeys[user.email]}
                                </code>
                                <button
                                  onClick={() => navigator.clipboard.writeText(sessionKeys[user.email])}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                >
                                  Copy
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => generateSessionKey(user.email)}
                                disabled={loadingSessionKey[user.email]}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {loadingSessionKey[user.email] ? 'Generating...' : 'Generate Key'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {user.role === 'team_lead' && (
                            <button
                              onClick={() => generateSessionKey(user.email)}
                              disabled={loadingSessionKey[user.email]}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                            >
                              {loadingSessionKey[user.email] ? 'Generating...' : 'New Key'}
                            </button>
                          )}
                          {user.role === 'team_lead' && (
                            <button
                              onClick={() => deleteUser(user._id, user.email)}
                              className="text-red-600 hover:text-red-800 text-xs ml-2"
                              title="Delete user"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
