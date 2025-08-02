import React from 'react';
import Avatar from '../../assets/Avatar17.png';

const AdminMyProfileSettings: React.FC = () => {
  return (
    <div className="space-y-8 text-[14px]">
      {/* Basic Information Heading */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-1 text-left">Basic Information</h2>
          <p className="text-gray-500 mb-6 text-left">This is your admin profile information that you can update anytime.</p>
        </div>
      </div>

      {/* Profile Photo */}
      <div className="border-b border-gray-200 pb-6">
        <div className="grid grid-cols-[1fr_120px_1fr] gap-3 items-start">
          {/* Left label & description */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2 text-left">Profile Photo</h3>
            <p className="text-gray-500 leading-relaxed text-left max-w-[250px]">
              This image will be shown publicly as your admin profile picture, helping users identify you as a system administrator.
            </p>
          </div>

          {/* Avatar */}
          <div className="flex items-center justify-center">
            <img src={Avatar} alt="Admin Profile" className="w-20 h-20 rounded-full object-cover" />
          </div>

          {/* Upload area */}
          <div className="border-2 border-dashed border-[#007BFF] rounded-lg p-6 flex flex-col justify-center items-center h-full text-center hover:bg-blue-50 transition-colors cursor-pointer">
            <div className="text-[#007BFF] font-medium">Click to replace or drag and drop</div>
            <div className="text-gray-500 text-sm mt-1">SVG, PNG, JPG or GIF (max. 400x400px)</div>
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
              <input 
                type="text" 
                defaultValue="Admin User" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" 
              />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1 text-left">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input 
                  type="tel" 
                  defaultValue="+1 234 567 890" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" 
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1 text-left">
                  Email <span className="text-red-500">*</span>
                </label>
                <input 
                  type="email" 
                  defaultValue="admin@jobhuntly.com" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF]" 
                />
              </div>
            </div>

            {/* Department + Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-1 text-left">
                  Department <span className="text-red-500">*</span>
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF] appearance-none">
                  <option>Administration</option>
                  <option>HR Management</option>
                  <option>Technical Support</option>
                  <option>System Management</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1 text-left">
                  Role <span className="text-red-500">*</span>
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#007BFF] appearance-none">
                  <option>Super Admin</option>
                  <option>HR Admin</option>
                  <option>Content Admin</option>
                  <option>Support Admin</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Permissions */}
      <div className="border-b border-gray-200 pb-6">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2 text-left">Admin Permissions</h3>
            <p className="text-gray-500 text-left">Select the permissions for this admin account</p>
          </div>
          <div className="col-span-2 space-y-3">
            <div className="flex items-start space-x-3">
              <input 
                type="checkbox" 
                id="user-management" 
                defaultChecked 
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF]" 
              />
              <div>
                <label htmlFor="user-management" className="font-medium text-gray-900 text-left block">
                  User Management
                </label>
                <p className="text-gray-500 text-left">Can manage user accounts and permissions</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <input 
                type="checkbox" 
                id="content-management" 
                defaultChecked 
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF]" 
              />
              <div>
                <label htmlFor="content-management" className="font-medium text-gray-900 text-left block">
                  Content Management
                </label>
                <p className="text-gray-500 text-left">Can manage job postings and company profiles</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <input 
                type="checkbox" 
                id="system-settings" 
                defaultChecked 
                className="mt-1 w-4 h-4 text-[#007BFF] focus:ring-[#007BFF]" 
              />
              <div>
                <label htmlFor="system-settings" className="font-medium text-gray-900 text-left block">
                  System Settings
                </label>
                <p className="text-gray-500 text-left">Can modify system configurations and settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-4">
        <button className="px-6 py-2 bg-[#007BFF] text-white rounded-md font-medium hover:bg-[#0056b3]">
          Save Profile
        </button>
      </div>
    </div>
  );
};

export default AdminMyProfileSettings; 