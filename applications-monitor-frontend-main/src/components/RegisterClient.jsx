import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, CheckCircle, CreditCard } from 'lucide-react';
import { toastUtils, toastMessages } from '../utils/toastUtils.js';

const RegisterClient = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    planType: 'Free Trial'
  });

  const [response, setResponse] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const planOptions = [
    { value: 'Free Trial', label: 'Free Trial', description: 'Basic features to get started' },
    { value: 'Ignite', label: 'Ignite', description: 'Perfect for job seekers starting their journey' },
    { value: 'Professional', label: 'Professional', description: 'Advanced features for serious job seekers' },
    { value: 'Executive', label: 'Executive', description: 'Premium features for career advancement' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.planType) newErrors.planType = 'Please select a plan';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    const loadingToast = toastUtils.loading("Creating your account...");

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

      const res = await fetch(`${API_BASE_URL}/coreops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      setResponse(data);

      if (data?.message === 'User registered successfully') {
        toastUtils.dismissToast(loadingToast);
        toastUtils.success("Account created successfully! Please login to continue.");
        setFormData({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', planType: 'Free Trial' });
        setErrors({});
        navigate('/login');
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 overflow-hidden">
      {/* ... your full JSX form code stays the same ... */}
    </div>
  );
};

export default RegisterClient;
