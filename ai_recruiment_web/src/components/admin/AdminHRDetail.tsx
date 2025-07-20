import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { FiArrowLeft, FiEdit, FiExternalLink } from 'react-icons/fi';
import { FaHtml5, FaCss3Alt, FaJs, FaGem, FaTwitter, FaFacebookF, FaLinkedinIn, FaEnvelope } from 'react-icons/fa';

interface HRDetails {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  position: string;
  status: 'Active' | 'Locked';
  avatar: string;
  companyLogo: string;
  companyInfo: {
    address: string;
    industry: string;
    size: string;
    website: string;
  };
  activeJobs: number;
  totalCandidates: number;
}

const AdminHRDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showMoreJobs, setShowMoreJobs] = useState(false);

  // Mock data - replace with actual API call
  const hrDetails: HRDetails = {
    id: Number(id),
    fullName: 'John Smith',
    email: 'john.smith@company.com',
    phone: '+84 987 654 321',
    companyName: 'Tech Solutions Inc.',
    position: 'Senior HR Manager',
    status: 'Active',
    avatar: `https://i.pravatar.cc/150?u=${id}`,
    companyLogo: 'https://placehold.co/100x100',
    companyInfo: {
      address: 'District 1, Ho Chi Minh City, Vietnam',
      industry: 'Information Technology',
      size: '100-500 employees',
      website: 'www.techsolutions.com',
    },
    activeJobs: 15,
    totalCandidates: 245,
  };

  return (
    <AdminLayout>
      <div className="p-8" style={{fontFamily:'ABeeZee, sans-serif'}}>
        {/* Back + Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-normal text-gray-800">Account Details</h1>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium">
            <FiEdit className="w-4 h-4" />
            Edit information
          </button>
        </div>

        {/* Header panel */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <img src={hrDetails.companyLogo} alt={hrDetails.companyName} className="w-32 h-32 object-contain" />
          <div className="flex-1">
            <h2 className="text-3xl font-semibold text-gray-900 mb-1" style={{fontFamily:'ABeeZee, sans-serif'}}>{hrDetails.companyName}</h2>
            <a href={`https://${hrDetails.companyInfo.website}`} className="text-blue-600 text-sm flex items-center gap-1 hover:underline mb-4"><FiExternalLink /> {hrDetails.companyInfo.website}</a>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Founded</p>
                <p className="font-medium">July 31, 2011</p>
              </div>
              <div>
                <p className="text-gray-500">Employees</p>
                <p className="font-medium">4000+</p>
              </div>
              <div>
                <p className="text-gray-500">Location</p>
                <p className="font-medium">20 countries</p>
              </div>
              <div>
                <p className="text-gray-500">Industry</p>
                <p className="font-medium">{hrDetails.companyInfo.industry}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Profile + Tech Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Company Profile */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Company Profile</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">Nomad is a software platform for starting and running internet businesses. Millions of businesses rely on Stripe's software tools to accept payments, expand globally, and manage their businesses online. Stripe has been at the forefront of expanding internet commerce, powering new business models, and supporting the latest platforms, from marketplaces to mobile commerce tools...</p>
          </div>

          {/* Tech Stack */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tech Stack</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center text-sm font-medium">
              <div className="space-y-2"><FaHtml5 className="w-8 h-8 text-orange-500 mx-auto"/><p>HTML 5</p></div>
              <div className="space-y-2"><FaCss3Alt className="w-8 h-8 text-blue-600 mx-auto"/><p>CSS 3</p></div>
              <div className="space-y-2"><FaJs className="w-8 h-8 text-yellow-400 mx-auto"/><p>JavaScript</p></div>
              <div className="space-y-2"><FaGem className="w-8 h-8 text-red-600 mx-auto"/><p>Ruby</p></div>
              <div className="space-y-2"><img src="https://placehold.co/32x32" className="mx-auto" alt="Mixpanel"/><p>Mixpanel</p></div>
              <div className="space-y-2"><img src="https://placehold.co/32x32" className="mx-auto" alt="Framer"/><p>Framer</p></div>
            </div>
            <button className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">View tech stack <FiExternalLink/></button>
          </div>
        </div>

        {/* Contact Links */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="#" className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"><FaTwitter className="text-blue-400"/> twitter.com/Nomad</a>
            <a href="#" className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"><FaFacebookF className="text-blue-600"/> facebook.com/NomadHQ</a>
            <a href="#" className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"><FaLinkedinIn className="text-blue-700"/> linkedin.com/company/nomad</a>
            <a href="#" className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"><FaEnvelope className="text-gray-500"/> nomad@gmail.com</a>
          </div>
        </div>

        {/* Working at Nomad & Office Locations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">Working at Nomad</h3></div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({length:6}).map((_,i)=>(<img key={i} src={`https://placehold.co/240x160?text=Img+${i+1}`} alt="work" className="w-full h-40 object-cover rounded"/>))}
            </div>
          </div>

          {/* Office Locations */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Office Locations</h3>
            <ul className="space-y-3 text-sm">
              {['United States (Head Quarters)','England','Japan','Australia','China'].map((loc,i)=>(<li key={i} className="flex items-center gap-2"><span className="w-4 h-4 bg-gray-300 rounded-full"/> {loc}</li>))}
            </ul>
            <button className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">View countries <FiExternalLink/></button>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {['https://i.pravatar.cc/100?u=1','https://i.pravatar.cc/100?u=2','https://i.pravatar.cc/100?u=3'].map((src,i)=>(
              <div key={i} className="text-center border border-gray-100 rounded-lg p-3">
                <img src={src} className="w-16 h-16 rounded-full mx-auto mb-2"/>
                <p className="text-sm font-medium text-gray-900">Name {i+1}</p>
                <p className="text-xs text-gray-500">Role</p>
              </div>
            ))}
          </div>
          <button className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">View all core teams <FiExternalLink/></button>
        </div>

        {/* Benefits */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Benefit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            {['Full Healthcare','Unlimited Vacation','Skill Development','Team Summits','Remote Working','Commuter Benefits'].map((benefit,i)=>(
              <div key={i} className="space-y-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 flex items-center justify-center rounded">{i+1}</div>
                <p className="font-semibold text-gray-900">{benefit}</p>
                <p className="text-gray-600 text-xs">Short description about {benefit.toLowerCase()}...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Open Positions</h3>
            {!showMoreJobs && <button onClick={()=>setShowMoreJobs(true)} className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">Show all jobs <FiExternalLink/></button>}
          </div>
          <div className="space-y-4">
            {(showMoreJobs?['Social Media Assistant','Brand Designer','Interactive Developer','HR Manager']:['Social Media Assistant','Brand Designer']).map((title,i)=>(
              <div key={i} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <h4 className="font-medium text-gray-900 text-sm mb-1">{title}</h4>
                <p className="text-xs text-gray-500">{hrDetails.companyName} • Paris, France</p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600">Full-Time</span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600">Marketing</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">Design</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminHRDetail; 