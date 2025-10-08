import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_BASE || "https://applications-monitor-api.flashfirejobs.com";

export default function ClientDetailsSection({ clientEmail, clientDetails, onClientUpdate, userRole = 'admin' }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        dashboardTeamLeadName: '',
        dashboardInternName: '',
        planType: '',
        onboardingDate: '',
        jobDeadline: '',
        applicationStartDate: '',
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
        status: 'active',
        jobStatus: 'still_searching',
        companyName: '',
        lastApplicationDate: ''
    });

    useEffect(() => {
        if (clientDetails) {
            setFormData({
                name: clientDetails.name || '',
                dashboardTeamLeadName: clientDetails.dashboardTeamLeadName || '',
                dashboardInternName: clientDetails.dashboardInternName || '',
                planType: clientDetails.planType || '',
                onboardingDate: clientDetails.onboardingDate || '',
                jobDeadline: clientDetails.jobDeadline || '',
                applicationStartDate: clientDetails.applicationStartDate || '',
                whatsappGroupMade: clientDetails.whatsappGroupMade || false,
                whatsappGroupMadeDate: clientDetails.whatsappGroupMadeDate || '',
                dashboardCredentialsShared: clientDetails.dashboardCredentialsShared || false,
                dashboardCredentialsSharedDate: clientDetails.dashboardCredentialsSharedDate || '',
                resumeSent: clientDetails.resumeSent || false,
                resumeSentDate: clientDetails.resumeSentDate || '',
                coverLetterSent: clientDetails.coverLetterSent || false,
                coverLetterSentDate: clientDetails.coverLetterSentDate || '',
                portfolioMade: clientDetails.portfolioMade || false,
                portfolioMadeDate: clientDetails.portfolioMadeDate || '',
                linkedinOptimization: clientDetails.linkedinOptimization || false,
                linkedinOptimizationDate: clientDetails.linkedinOptimizationDate || '',
                status: clientDetails.status || 'active',
                jobStatus: clientDetails.jobStatus || 'still_searching',
                companyName: clientDetails.companyName || '',
                lastApplicationDate: clientDetails.lastApplicationDate || ''
            });
        }
    }, [clientDetails]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/clients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: clientEmail,
                    ...formData
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.client) {
                    if (typeof onClientUpdate === 'function') {
                        onClientUpdate(clientEmail, result.client);
                    }
                }
                setIsEditing(false);
            } else {
                console.error('Failed to save client details:', response.statusText);
                alert('Failed to save client details. Please try again.');
            }
        } catch (error) {
            console.error('Error saving client details:', error);
            alert('Error saving client details. Please try again.');
        }
    };

    const handleCancel = () => {
        if (clientDetails) {
            setFormData({
                name: clientDetails.name || '',
                dashboardTeamLeadName: clientDetails.dashboardTeamLeadName || '',
                dashboardInternName: clientDetails.dashboardInternName || '',
                planType: clientDetails.planType || '',
                onboardingDate: clientDetails.onboardingDate || '',
                jobDeadline: clientDetails.jobDeadline || '',
                whatsappGroupMade: clientDetails.whatsappGroupMade || false,
                whatsappGroupMadeDate: clientDetails.whatsappGroupMadeDate || '',
                dashboardCredentialsShared: clientDetails.dashboardCredentialsShared || false,
                dashboardCredentialsSharedDate: clientDetails.dashboardCredentialsSharedDate || '',
                resumeSent: clientDetails.resumeSent || false,
                resumeSentDate: clientDetails.resumeSentDate || '',
                coverLetterSent: clientDetails.coverLetterSent || false,
                coverLetterSentDate: clientDetails.coverLetterSentDate || '',
                portfolioMade: clientDetails.portfolioMade || false,
                portfolioMadeDate: clientDetails.portfolioMadeDate || '',
                linkedinOptimization: clientDetails.linkedinOptimization || false,
                linkedinOptimizationDate: clientDetails.linkedinOptimizationDate || '',
                jobStatus: clientDetails.jobStatus || 'still_searching',
                companyName: clientDetails.companyName || '',
                lastApplicationDate: clientDetails.lastApplicationDate || ''
            });
        }
        setIsEditing(false);
    };

    if (!clientDetails) {
        return (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="text-sm text-slate-600">
                    <span className="font-medium">Client Details:</span> No profile information available.
                    <span className="text-blue-600 ml-1">Click "Personal Details" to add information.</span>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString || dateString === "") return "Not set";
        try {
            let date;
            if (dateString.includes('/')) {
                date = new Date(dateString);
            } else if (dateString.includes('-')) {
                date = new Date(dateString);
            } else {
                date = new Date(dateString);
            }

            if (isNaN(date.getTime())) {
                return "Invalid date";
            }

            return date.toLocaleDateString('en-GB');
        } catch {
            return "Invalid date";
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-md">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Client Information</h3>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSave}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Save
                            </button>
                            <button
                                onClick={handleCancel}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        userRole === 'admin' ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                            >
                                Edit Details
                            </button>
                        ) : (
                            <span className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg">
                                View Only
                            </span>
                        )
                    )}
                </div>
            </div>
            {/* The rest of the form is omitted for brevity but would be included here */}
        </div>
    );
}