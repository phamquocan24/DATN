import React, { useState, useEffect } from 'react';
import candidateApi from '../../services/candidateApi';
import Avatar from '../../assets/Avatar17.png';

const MyProfileSettings: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: '',
    accountType: 'job-seeker',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await candidateApi.getProfile();
        const profile = response.data;
        setFormData({
          fullName: profile.name || '',
          phone: profile.phone || '',
          email: profile.email || '',
          birthDate: profile.birthDate ? profile.birthDate.split('T')[0] : '',
          gender: profile.gender || '',
          accountType: profile.accountType || 'job-seeker',
        });
      } catch (err) {
        setError('Failed to load profile data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      await candidateApi.updateProfile({
        name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        birth_date: formData.birthDate,
        gender: formData.gender,
      });
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 text-[14px]">
      {/* Basic Information Heading */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-1 text-left">Basic Information</h2>
          <p className="text-gray-500 mb-6 text-left">This is your personal information that you can update anytime.</p>
        </div>
      </div>

      {/* Profile Photo */}
      <div className="border-b border-gray-200 pb-6">
        <div className="grid grid-cols-[1fr_120px_1fr] gap-3 items-start">
          {/* Left label & description */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 text-left">Profile Photo</h3>
            <p className="text-gray-500 leading-relaxed text-left max-w-[250px]">
              This image will be shown publicly as your profile picture, it will help recruiters recognize you!
            </p>
          </div>

          {/* Avatar */}
          <div className="flex items-center justify-center">
            <img src={Avatar} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
          </div>

          {/* Upload area */}
          <div className="max-w-[350px]">
            <div className="border-2 border-dashed border-[#4C8DFF] rounded-md h-32 flex flex-col items-center justify-center text-center text-gray-600 cursor-pointer px-4">
              <svg className="w-6 h-6 text-[#4C8DFF] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[14px] font-medium"><span className="text-[#007BFF]">Click to replace</span><span className="text-gray-500 font-normal"> or drag and drop</span></p>
              <p className="text-gray-500 text-[12px]">SVG, PNG, JPG or GIF (max. 400 × 400px)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Details */}
      <div className="border-b border-gray-200 pb-6">
        <div className="grid grid-cols-3 gap-6 mb-2">
          <div className="font-medium text-gray-900 text-left">Personal Details</div>
          {/* Inputs */}
          <div className="col-span-2 space-y-4">
            {/* Full Name */}
            <div>
              <label className="block font-medium text-gray-700 mb-1 text-left">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1 text-left">Phone Number <span className="text-red-500">*</span></label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1 text-left">Email <span className="text-red-500">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" />
              </div>
            </div>

            {/* Date + Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1 text-left">Date of Birth <span className="text-red-500">*</span></label>
                <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" />
              </div>
              <div className="relative">
                <label className="block font-medium text-gray-700 mb-1 text-left">Gender <span className="text-red-500">*</span></label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF] appearance-none pr-8">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <svg className="absolute right-3 top-9 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Type */}
      <div className="border-b border-gray-200 pb-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="font-medium text-gray-900 text-left">
            Account Type
            <p className="text-gray-500 font-normal text-sm mt-1">You can update your account type</p>
          </div>
          <div className="col-span-2 space-y-3">
            <div className="flex items-start space-x-3">
              <input type="radio" id="job" defaultChecked name="acc" className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF]" />
              <div>
                <label htmlFor="job" className="font-medium text-gray-900 text-left block">Job Seeker</label>
                <p className="text-gray-500 text-left">Looking for a job</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <input type="radio" id="emp" name="acc" className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF]" />
              <div>
                <label htmlFor="emp" className="font-medium text-gray-900 text-left block">Employer</label>
                <p className="text-gray-500 text-left">Hiring, sourcing candidates, or posting a jobs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {error && <div className="text-red-500 text-center">{error}</div>}
      {success && <div className="text-green-500 text-center">{success}</div>}

      {/* Save button */}
      <div className="flex justify-end pt-4">
        <button type="submit" disabled={isLoading} className="px-6 py-2 bg-[#007BFF] text-white rounded-md font-medium hover:bg-[#0056b3] disabled:bg-gray-400">
            {isLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

export default MyProfileSettings; 