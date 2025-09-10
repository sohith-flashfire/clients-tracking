import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8086";

const ClientDetails = ({ clientEmail, onClose, userRole = 'admin' }) => {
  const [client, setClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: clientEmail,
    jobDeadline: '',
    dashboardInternName: '',
    dashboardTeamLeadName: '',
    planType: 'ignite',
    onboardingDate: '',
    whatsappGroupMade: false,
    whatsappGroupMadeDate: '',
    dashboardCredentialsShared: false,
    dashboardCredentialsSharedDate: '',
    resumeSent: false,
    resumeSentDate: '',
    coverLetterSent: false,
    coverLetterSentDate: '',
    portfolioMade: false,
    portfolioMadeDate: '',
    linkedinOptimization: false,
    linkedinOptimizationDate: '',
    gmailCredentials: {
      email: '',
      password: ''
    },
    amountPaid: 0,
    amountPaidDate: '',
    modeOfPayment: 'paypal'
  });

  useEffect(() => {
    if (clientEmail) {
      fetchClientDetails();
    }
  }, [clientEmail]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/api/clients/${encodeURIComponent(clientEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
        setFormData({
          name: data.client.name || '',
          email: data.client.email || clientEmail,
          jobDeadline: data.client.jobDeadline || '',
          dashboardInternName: data.client.dashboardInternName || '',
          dashboardTeamLeadName: data.client.dashboardTeamLeadName || '',
          planType: data.client.planType || 'ignite',
          onboardingDate: data.client.onboardingDate || '',
          whatsappGroupMade: data.client.whatsappGroupMade || false,
          whatsappGroupMadeDate: data.client.whatsappGroupMadeDate || '',
          dashboardCredentialsShared: data.client.dashboardCredentialsShared || false,
          dashboardCredentialsSharedDate: data.client.dashboardCredentialsSharedDate || '',
          resumeSent: data.client.resumeSent || false,
          resumeSentDate: data.client.resumeSentDate || '',
          coverLetterSent: data.client.coverLetterSent || false,
          coverLetterSentDate: data.client.coverLetterSentDate || '',
          portfolioMade: data.client.portfolioMade || false,
          portfolioMadeDate: data.client.portfolioMadeDate || '',
          linkedinOptimization: data.client.linkedinOptimization || false,
          linkedinOptimizationDate: data.client.linkedinOptimizationDate || '',
          gmailCredentials: {
            email: data.client.gmailCredentials?.email || '',
            password: data.client.gmailCredentials?.password || ''
          },
          amountPaid: data.client.amountPaid || 0,
          amountPaidDate: data.client.amountPaidDate || '',
          modeOfPayment: data.client.modeOfPayment || 'paypal'
        });
      } else {
        // Client doesn't exist, show empty form for creation
        setClient(null);
        setFormData(prev => ({ ...prev, email: clientEmail }));
      }
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('gmailCredentials.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        gmailCredentials: {
          ...prev.gmailCredentials,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/api/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
        setIsEditing(false);
        alert('Client details saved successfully!');
      } else {
        alert('Failed to save client details. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const planOptions = [
    { value: 'ignite', label: 'Ignite $199' },
    { value: 'professional', label: 'Professional $349' },
    { value: 'executive', label: 'Executive $599' }
  ];

  if (loading && !client) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading client details...</div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">Client Information</h2>
              <p className="text-blue-100 text-sm">{clientEmail}</p>
            </div>
            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {client ? 'Edit Details' : 'Add Details'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 font-semibold shadow-sm disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-all duration-200 font-semibold shadow-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-3 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-120px)]">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Personal Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address
                    </label>
                    <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium">
                      {clientEmail}
                    </div>
                  </div>
                  
                  {userRole === 'admin' && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Amount Paid
                        </label>
                        {isEditing ? (
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-slate-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              name="amountPaid"
                              value={formData.amountPaid}
                              onChange={handleInputChange}
                              className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        ) : (
                          <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-700">
                            ${client?.amountPaid || 0}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Payment Date
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="amountPaidDate"
                            value={formData.amountPaidDate}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          />
                        ) : (
                          <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-700">
                            {client?.amountPaidDate ? new Date(client.amountPaidDate).toLocaleDateString('en-GB') : 'Not set'}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Mode of Payment
                        </label>
                        {isEditing ? (
                          <select
                            name="modeOfPayment"
                            value={formData.modeOfPayment}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          >
                            <option value="paypal">PayPal</option>
                            <option value="wire_transfer">Wire Transfer</option>
                            <option value="inr">INR</option>
                          </select>
                        ) : (
                          <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-700 capitalize">
                            {client?.modeOfPayment?.replace('_', ' ') || 'Not set'}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="space-y-6">


              <div className="bg-slate-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Gmail Credentials
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="gmailCredentials.email"
                        value={formData.gmailCredentials.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        placeholder="Gmail address"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-700">
                        {client?.gmailCredentials?.email || <span className="text-slate-400 italic">Not set</span>}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                    {isEditing ? (
                      <input
                        type="password"
                        name="gmailCredentials.password"
                        value={formData.gmailCredentials.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                        placeholder="Gmail password"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-700">
                        {client?.gmailCredentials?.password || <span className="text-slate-400 italic">Not set</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {client && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Record Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-slate-600">Created:</span>
                    <span className="font-medium text-slate-700">{client.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-slate-600">Last Updated:</span>
                    <span className="font-medium text-slate-700">{client.updatedAt}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ClientDetails;
