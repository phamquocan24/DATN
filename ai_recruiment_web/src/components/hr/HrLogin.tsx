import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../assets/Logo.png';
import Man2 from '../../assets/man2.png';
import Avatar17 from '../../assets/Avatar17.png';

const HrLogin: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const navigate = useNavigate();

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
    console.log('Form submitted:', { formData });
    navigate('/hr/dashboard'); // Or wherever you want to redirect after login
  };

  const handleGoogleAuth = () => {
    // Handle Google authentication
    console.log('Google auth clicked');
  };

  const handleSignUpClick = () => {
    navigate('/hr/signup');
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex h-[550px]">
        {/* Left side - Image and testimonial */}
        <div className="hidden lg:flex lg:w-2/5 bg-gray-50 rounded-l-2xl p-8 flex-col justify-between relative">
            <div className="absolute top-6 left-6 z-10">
                <img src={Logo} alt="JobHuntly" className="h-8" />
            </div>
            <div className="w-full h-full flex items-center justify-center">
                <img src={Man2} alt="Professional person" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="bg-white rounded-lg p-4 shadow-lg z-10">
                <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        <img src={Avatar17} alt="Adam Sandler" className="w-full h-full object-cover" />
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

        {/* Right side - Form */}
        <div className="w-full lg:w-3/5 p-8 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login</h2>
          <p className="text-gray-600 mb-6">Welcome back! Please enter your details.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="rememberMe"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#007BFF] border-gray-300 rounded focus:ring-[#007BFF]"
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                        Remember me
                    </label>
                </div>
                <a href="#" className="text-sm text-[#007BFF] hover:underline">
                    Forgot password?
                </a>
            </div>

            <button
              type="submit"
              className="w-full bg-[#007BFF] text-white py-2.5 rounded-lg font-semibold hover:bg-[#0056b3] transition-colors"
            >
              Login
            </button>

             <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full mt-4 flex items-center justify-center space-x-2 border border-gray-300 rounded-lg py-2.5 px-4 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-gray-700 font-medium">Login with Google</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={handleSignUpClick}
                className="font-medium text-[#007BFF] hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrLogin; 