import React, { useState } from 'react';
import Logo from '../assets/Logo.png';
import Man2 from '../assets/man2.png';
import Avatar17 from '../assets/Avatar17.png';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [userType, setUserType] = useState<'job-seeker' | 'company'>('job-seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    rememberMe: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', { mode, userType, formData });
    onClose();
  };

  const handleGoogleAuth = () => {
    // Handle Google authentication
    console.log('Google auth clicked');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full h-[550px] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Logo at top left - Desktop only */}
        <div className="hidden lg:block absolute top-6 left-6 z-10">
          <img src={Logo} alt="JobHuntly" className="h-8" />
        </div>
        
        <div className="flex h-[550px]">
          {/* Left side - Image and testimonial */}
          <div className="hidden lg:block lg:w-2/5 bg-gray-50 rounded-l-2xl p-6 pt-16 relative">
            <div className="h-full relative">
              {/* Person image - full height of container */}
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <img 
                  src={Man2} 
                  alt="Professional person" 
                  className="w-full h-full object-cover object-center"
                  style={{ objectPosition: 'center top' }}
                />
              </div>
              
              {/* Stats card */}
              <div className="absolute top-6 left-6 bg-white rounded-lg p-3 shadow-lg z-10 min-w-[120px]">
                <div className="flex items-end space-x-1 mb-2">
                  <div className="w-3 h-8 bg-[#007BFF] rounded-sm"></div>
                  <div className="w-3 h-6 bg-[#007BFF] rounded-sm"></div>
                  <div className="w-3 h-10 bg-[#007BFF] rounded-sm"></div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">100K+</div>
                  <div className="text-xs text-gray-500">People got hired</div>
                </div>
              </div>

              {/* Testimonial card */}
              <div className="absolute bottom-6 left-6 right-6 bg-white rounded-lg p-4 shadow-lg z-10">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={Avatar17} 
                      alt="Adam Sandler" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 text-sm">Adam Sandler</div>
                    <div className="text-xs text-gray-500">Lead Engineer at Canva</div>
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="text-[#007BFF] text-lg">"</span>
                      Great platform for the job seeker that searching for new career heights.
                      <span className="text-[#007BFF] text-lg">"</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="w-full lg:w-3/5 p-6 pt-6 lg:pt-8 rounded-2xl lg:rounded-l-none">
            {/* Logo for mobile only */}
            <div className="lg:hidden mb-3">
              <img src={Logo} alt="JobHuntly" className="h-7" />
            </div>

            {/* User type tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button
                onClick={() => setUserType('job-seeker')}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                  userType === 'job-seeker' 
                    ? 'bg-[#007BFF] text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Job Seeker
              </button>
              <button
                onClick={() => setUserType('company')}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                  userType === 'company' 
                    ? 'bg-[#007BFF] text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Company
              </button>
            </div>

            {/* Title */}
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {mode === 'signup' ? 'Get more opportunities' : 'Welcome Back, Dude'}
            </h2>

            {/* Google Auth Button */}
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center space-x-2 border border-gray-300 rounded-lg py-1.5 px-3 mb-3 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium text-sm">
                {mode === 'signup' ? 'Sign Up with Google' : 'Login with Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">
                  Or {mode === 'signup' ? 'sign up' : 'login'} with email
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold text-gray-700 mb-1 text-left">
                    Full name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent text-sm"
                    required
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-700 mb-1 text-left">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-gray-700 mb-1 text-left">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    className="w-full px-3 py-1.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-3 h-3 text-[#007BFF] border-gray-300 rounded focus:ring-[#007BFF]"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-xs text-gray-700">
                    Remember me
                  </label>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#007BFF] text-white py-1.5 rounded-lg font-medium hover:bg-[#0056b3] transition-colors text-sm"
              >
                {mode === 'signup' ? 'Continue' : 'Login'}
              </button>
            </form>

            {/* Switch mode link */}
            <div className="mt-3 text-center">
              <span className="text-gray-600 text-xs">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
              </span>
              <button
                onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                className="text-[#007BFF] hover:text-[#007BFF] font-medium text-xs"
              >
                {mode === 'signup' ? 'Login' : 'Sign Up'}
              </button>
            </div>

            {/* Terms and Privacy (only for signup) */}
            {mode === 'signup' && (
              <div className="mt-3 text-center text-xs text-gray-500 leading-tight">
                By clicking 'Continue', you acknowledge that you have read and accept the{' '}
                <a href="#" className="text-[#007BFF] hover:text-[#007BFF]">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-[#007BFF] hover:text-[#007BFF]">Privacy Policy</a>.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal; 