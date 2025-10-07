import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, CheckCircle, CreditCard, Users, ArrowLeft, Plus } from 'lucide-react';
import { toastUtils, toastMessages } from '../utils/toastUtils.js';

const RegisterClient = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    planType: 'Free Trial',
    dashboardManager: ''
  });

  const [dashboardManagers, setDashboardManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [response, setResponse] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Fetch dashboard managers and clients on component mount
  useEffect(() => {
    const fetchDashboardManagers = async () => {
          const token = localStorage.getItem("authToken");

      try {
        setLoadingManagers(true);
        const API_BASE_URL = import.meta.env.VITE_BASE;
        const response = await fetch(`${API_BASE_URL}/api/managers`,{
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // 👈 here’s the key line
      },
    });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDashboardManagers(data.managers);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard managers:', error);
      } finally {
        setLoadingManagers(false);
      }
    };

    const fetchClients = async () => {
      try {
        setLoadingClients(true);
        const API_BASE_URL = import.meta.env.VITE_BASE;
        const response = await fetch(`${API_BASE_URL}/api/clients`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setClients(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchDashboardManagers();
    fetchClients();
  }, []);

  const planOptions = [
    { value: 'Free Trial', label: 'Free Trial', description: 'Basic features to get started' },
    { value: 'Ignite', label: 'Ignite', description: 'Perfect for job seekers starting their journey' },
    { value: 'Professional', label: 'Professional', description: 'Advanced features for serious job seekers' },
    { value: 'Executive', label: 'Executive', description: 'Premium features for executive positions' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.dashboardManager) {
      newErrors.dashboardManager = 'Please select a dashboard manager';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    const loadingToast = toastUtils.loading("Creating your account...");

    try {
      const API_BASE_URL = import.meta.env.VITE_BASE ;

      const res = await fetch(`${API_BASE_URL}/api/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setResponse(data);

      if (data?.message === 'User registered successfully') {
        toastUtils.dismissToast(loadingToast);
        toastUtils.success("Client registered successfully!");
        setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', planType: 'Free Trial', dashboardManager: '' });
        setErrors({});
        setShowForm(false);
        // Refresh clients list
        const clientsResponse = await fetch(`${API_BASE_URL}/api/clients/all`);
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          if (clientsData.success) {
            setClients(clientsData.data);
          }
        }
      } else {
        toastUtils.dismissToast(loadingToast);
        toastUtils.error(data?.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.log("Registration failed:", error);
      toastUtils.dismissToast(loadingToast);
      toastUtils.error(toastMessages.networkError);
      setResponse({ message: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Simple Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Register Client</h1>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Client
          </button>
        </div>

        {/* Simple Clients Grid */}
        {loadingClients ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              Loading clients...
            </div>
          </div>
        ) : clients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div key={client._id} className="bg-white rounded-lg p-4 shadow border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{client.name || 'N/A'}</h3>
                    <p className="text-sm text-gray-500">{client.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        <CreditCard className="w-3 h-3" />
                        {client.planType || 'N/A'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {client.dashboardManager || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No clients yet</h3>
            <p className="text-gray-500 mb-4">Add your first client to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Client
            </button>
          </div>
        )}

        {/* Simple Registration Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full shadow-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Add New Client</h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', planType: 'Free Trial', dashboardManager: '' });
                      setErrors({});
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First name"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.firstName ? 'border-red-400' : 'border-gray-300'
                        }`}
                      />
                      {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last name"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.lastName ? 'border-red-400' : 'border-gray-300'
                        }`}
                      />
                      {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email address"
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  {/* Plan Type & Manager */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select
                        name="planType"
                        value={formData.planType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {planOptions.map((plan) => (
                          <option key={plan.value} value={plan.value}>
                            {plan.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <select
                        name="dashboardManager"
                        value={formData.dashboardManager}
                        onChange={handleInputChange}
                        disabled={loadingManagers}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.dashboardManager ? 'border-red-400' : 'border-gray-300'
                        } ${loadingManagers ? 'bg-gray-100' : ''}`}
                      >
                        <option value="">Select Manager</option>
                        {dashboardManagers.map((manager) => (
                          <option key={manager._id} value={manager.fullName}>
                            {manager.fullName}
                          </option>
                        ))}
                      </select>
                      {errors.dashboardManager && <p className="text-red-500 text-xs mt-1">{errors.dashboardManager}</p>}
                    </div>
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Password"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.password ? 'border-red-400' : 'border-gray-300'
                        }`}
                      />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                    <div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm Password"
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.confirmPassword ? 'border-red-400' : 'border-gray-300'
                        }`}
                      />
                      {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Client
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterClient;

