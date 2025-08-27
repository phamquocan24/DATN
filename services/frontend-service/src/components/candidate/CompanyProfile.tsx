import React, { useState, useEffect } from 'react';
import { FiExternalLink, FiArrowLeft, FiShare2 } from 'react-icons/fi';
import companyLogo from '../../assets/Nomad.png';
import { TbFlame } from "react-icons/tb";
import { PiUsersThree } from "react-icons/pi";
import { IoLocationOutline } from "react-icons/io5";
import { BsBuildings } from "react-icons/bs";
import { Footer } from './Footer';
import api from '../../services/api';


interface CompanyProfileProps {
  companyId?: string;
  onBack?: () => void;
}


export const CompanyProfile: React.FC<CompanyProfileProps> = ({ companyId, onBack }) => {
    console.log('CompanyProfile received companyId:', companyId);
    
    const [isFollowing, setIsFollowing] = useState(false);
    const [companyDetails, setCompanyDetails] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchCompanyProfile = async () => {
      try {
        // Use the correct API endpoint to get company by ID
        const response = await api.get(`/api/v1/companies/${companyId}`);
        if (response.data.success && response.data.data && response.data.data.company) {
          setCompanyDetails(response.data.data.company);
          setError(null);
        } else {
          setError('Company not found.');
        }
      } catch (err: any) {
        setError('Failed to load company profile.');
        console.error('Error fetching company profile:', err);
      }
    };

    fetchCompanyProfile();
  }, [companyId]);




  // Display error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="text-red-500 text-xl mb-4">❌ {error}</div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Display not found state
  if (!companyDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="text-gray-500 text-xl mb-4">🏢 Company not found</div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }








  return (
    <div style={{fontFamily:'ABeeZee, sans-serif'}}>
        <div className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <FiArrowLeft className="w-5 h-5" /> Back to companies
            </button>
        </div>

      {/* Header panel */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-8 bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="relative">
          <img 
            src={companyDetails.logo_url || companyLogo} 
            alt={companyDetails.company_name} 
            className="w-24 h-24 object-contain" 
            onError={(e) => {
              e.currentTarget.src = companyLogo;
            }}
          />
        </div>
        <div className="flex-1 text-left">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-semibold text-gray-900 mb-1" style={{fontFamily:'ABeeZee, sans-serif'}}>
                      {companyDetails.company_name}
                    </h2>
                    {companyDetails.website && (
                      <a 
                        href={companyDetails.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#007BFF] text-sm hover:underline mb-4 block"
                      >
                        {companyDetails.website}
                      </a>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors">
                        <FiShare2 className="w-5 h-5 text-gray-600"/>
                    </button>
              <button 
                onClick={() => setIsFollowing(!isFollowing)}
                        className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                  isFollowing 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-[#007BFF] text-white hover:bg-[#0056b3]'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
                </div>

          {/* Metrics */}
          <div className="flex items-center justify-between text-sm mt-6">
            {[
              { 
                icon: <TbFlame />, 
                label: "Founded", 
                value: companyDetails.founded_year ? companyDetails.founded_year.toString() : "N/A" 
              },
              { 
                icon: <PiUsersThree />, 
                label: "Employees", 
                value: companyDetails.company_size || "N/A" 
              },
              { 
                icon: <IoLocationOutline />, 
                label: "Location", 
                value: `${companyDetails.district_name || ''} ${companyDetails.city_name || ''}`.trim() || "N/A" 
              },
              { 
                icon: <BsBuildings />, 
                label: "Industry", 
                value: companyDetails.industry || "N/A" 
              }
            ].map((metric, index) => (
              <div key={index} className="flex items-center gap-3">
                  <div className="border border-gray-200 rounded-full p-2 text-[#007BFF]">
                      {React.cloneElement(metric.icon, { className: 'w-5 h-5' })}
              </div>
                  <div>
                      <p className="text-gray-500 text-sm">{metric.label}</p>
                      <p className="text-gray-800">{metric.value}</p>
                </div>
              </div>
            ))}
                </div>
              </div>
            </div>

      {/* Company Profile + Tech Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Company Profile */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Company Profile</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {companyDetails.description || "No description provided."}
          </p>
        </div>

        {/* Company Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Company Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Jobs</span>
              <span className="font-semibold text-gray-900">{companyDetails.total_jobs || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Jobs</span>
              <span className="font-semibold text-green-600">{companyDetails.active_jobs || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Recruiters</span>
              <span className="font-semibold text-gray-900">{companyDetails.total_recruiters || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                companyDetails.company_status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {companyDetails.company_status || 'UNKNOWN'}
              </span>
            </div>
            {companyDetails.is_verified && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Verified</span>
                <span className="text-green-600">✓ Verified</span>
              </div>
            )}
          </div>
        </div>
              </div>

      {/* Contact Links */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
                    </div>
        <div className="space-y-3 text-sm">
          {companyDetails.website && (
            <a 
              href={companyDetails.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <FiExternalLink className="text-[#007BFF]" />
              <span>Website</span>
              <span className="text-gray-500 ml-auto">{companyDetails.website}</span>
            </a>
          )}
          
          {companyDetails.address && (
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <IoLocationOutline className="text-gray-500" />
              <span>Address</span>
              <span className="text-gray-600 ml-auto">
                {companyDetails.address}
                {companyDetails.district_name && `, ${companyDetails.district_name}`}
                {companyDetails.city_name && `, ${companyDetails.city_name}`}
              </span>
            </div>
          )}
          
          {companyDetails.tax_code && (
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <BsBuildings className="text-gray-500" />
              <span>Tax Code</span>
              <span className="text-gray-600 ml-auto">{companyDetails.tax_code}</span>
            </div>
          )}
        </div>
              </div>

      {/* Company Jobs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Open Positions at {companyDetails.company_name}
          </h3>
          <span className="text-sm text-gray-500">
            {companyDetails.active_jobs || 0} active positions
          </span>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">💼</div>
          <p>Job listings will be loaded here</p>
          <p className="text-sm">
            Total Jobs: {companyDetails.total_jobs || 0} | 
            Active: {companyDetails.active_jobs || 0}
          </p>
        </div>
      </div>


      <Footer />
    </div>
  );
};

export default CompanyProfile; 