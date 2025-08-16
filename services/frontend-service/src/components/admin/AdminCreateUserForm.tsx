import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import adminApi from '../../services/adminApi';

interface CreateUserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  role: 'CANDIDATE' | 'HR' | 'RECRUITER';
  phone?: string;
}

interface AdminCreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: (user: any) => void;
}

const AdminCreateUserForm: React.FC<AdminCreateUserFormProps> = ({ 
  isOpen, 
  onClose, 
  onUserCreated 
}) => {
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'CANDIDATE',
    phone: ''
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      role: 'CANDIDATE',
      phone: ''
    });
    setCurrentStep(1);
    setError(null);
    setSuccess(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep1 = (): string | null => {
    if (!formData.full_name.trim()) return 'Full name is required';
    if (!formData.email.trim()) return 'Email is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!formData.password.trim()) return 'Password is required';
    if (!formData.confirmPassword.trim()) return 'Please confirm password';
    
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    return null;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const userData = {
        email: formData.email.trim(),
        ...(formData.password && { password: formData.password }),
        full_name: formData.full_name.trim(),
        role: formData.role,
        ...(formData.phone && { phone: formData.phone.trim() })
      };
      
      const response = await adminApi.createUser(userData);
      
      if (response.success) {
        setSuccess('User created successfully!');
        onUserCreated?.(response.data);
        
        // Close form after 2 seconds
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(response.message || 'Failed to create user');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        input[type="password"]::-webkit-password-reveal-button,
        input[type="password"]::-ms-reveal {
          display: none;
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 text-left">Create New User</h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'text-white' : 'bg-gray-200 text-gray-600'}`} style={{backgroundColor: currentStep >= 1 ? '#007BFF' : ''}}>
                1
              </div>
              <div className={`w-12 h-1 ${currentStep >= 2 ? 'bg-gray-200' : 'bg-gray-200'}`} style={{backgroundColor: currentStep >= 2 ? '#007BFF' : ''}}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'text-white' : 'bg-gray-200 text-gray-600'}`} style={{backgroundColor: currentStep >= 2 ? '#007BFF' : ''}}>
                2
              </div>
            </div>
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mb-6 text-sm text-gray-600">
            <span className={currentStep === 1 ? 'font-medium' : ''} style={{color: currentStep === 1 ? '#007BFF' : ''}}>Basic Information</span>
            <span className={currentStep === 2 ? 'font-medium' : ''} style={{color: currentStep === 2 ? '#007BFF' : ''}}>Account Details</span>
          </div>

          {/* Form */}
          <form onSubmit={currentStep === 1 ? handleNextStep : handleSubmit} className="space-y-4">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{'--tw-ring-color': '#007BFF'} as any}
                    onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#007BFF'}
                    onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
                    placeholder="Enter full name"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{'--tw-ring-color': '#007BFF'} as any}
                    onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#007BFF'}
                    onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
                    placeholder="Enter email address"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{'--tw-ring-color': '#007BFF'} as any}
                    onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#007BFF'}
                    onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
                    placeholder="Enter phone number"
                  />
                </div>
              </>
            )}

            {/* Step 2: Account Details */}
            {currentStep === 2 && (
              <>
                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{'--tw-ring-color': '#007BFF'} as any}
                    onFocus={(e) => (e.target as HTMLSelectElement).style.borderColor = '#007BFF'}
                    onBlur={(e) => (e.target as HTMLSelectElement).style.borderColor = '#d1d5db'}
                  >
                    <option value="CANDIDATE">Candidate</option>
                    <option value="HR">HR</option>
                    <option value="RECRUITER">Recruiter</option>
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{'--tw-ring-color': '#007BFF'} as any}
                      onFocus={(e) => e.target.style.borderColor = '#007BFF'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-left">
                    Password must be at least 8 characters long
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{'--tw-ring-color': '#007BFF'} as any}
                      onFocus={(e) => e.target.style.borderColor = '#007BFF'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="flex-1 text-white py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                style={{backgroundColor: '#007BFF'}}
                onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#0056b3'}
                onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#007BFF'}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {currentStep === 1 ? 'Processing...' : 'Creating...'}
                  </div>
                ) : (
                  currentStep === 1 ? 'Next' : 'Create User'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminCreateUserForm;