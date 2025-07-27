import React, { useState, useEffect } from 'react';
import { FiEdit, FiExternalLink, FiPlus, FiArrowRight, FiArrowLeft, FiShare2 } from 'react-icons/fi';
import { FaHtml5, FaCss3Alt, FaJs, FaGem, FaTwitter, FaFacebookF, FaLinkedinIn, FaEnvelope, FaPhoneAlt, FaInstagram, FaStethoscope, FaSwimmingPool, FaVideo, FaMountain, FaCoffee, FaTrain } from 'react-icons/fa';
import { SiFramer } from 'react-icons/si';
import companyLogo from '../../assets/Nomad.png';
import { TbFlame } from "react-icons/tb";
import { PiUsersThree } from "react-icons/pi";
import { IoLocationOutline, IoEarth } from "react-icons/io5";
import { BsBuildings } from "react-icons/bs";
import work1 from '../../assets/work1.png';
import work2 from '../../assets/work2.png';
import work3 from '../../assets/work3.png';
import work4 from '../../assets/work4.png';
import { Footer } from './Footer';
import api from '../../services/api';


interface CompanyProfileProps {
  companyId?: string;
  onBack?: () => void;
}


export const CompanyProfile: React.FC<CompanyProfileProps> = ({ companyId, onBack }) => {
    const [showMoreJobs, setShowMoreJobs] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
    const [companyDetails, setCompanyDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchCompanyProfile = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/companies/${companyId}/profile`);
        setCompanyDetails(response.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load company profile.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyProfile();
  }, [companyId]);


  // Mock data - replace with actual API call
  const companyDetails_mock = {
    companyName: 'Nomad',
    companyLogo: companyLogo,
    companyInfo: {
      address: 'District 1, Ho Chi Minh City, Vietnam',
      industry: 'Social & Non-Profit',
      size: '4000+',
      website: 'https://nomad.com',
    },
    phone: '+84 123 456 789',
    activeJobs: 15,
    totalCandidates: 245,
  };

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'Full-Time':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'Marketing':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Design':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading company profile...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  if (!companyDetails) {
    return <div className="text-center p-10">Company not found.</div>;
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
          <img src={companyDetails.companyLogo || companyLogo} alt={companyDetails.companyName} className="w-24 h-24 object-contain" />
                </div>
        <div className="flex-1 text-left">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-semibold text-gray-900 mb-1" style={{fontFamily:'ABeeZee, sans-serif'}}>{companyDetails.companyName}</h2>
                    <a href={companyDetails.companyInfo.website} className="text-[#007BFF] text-sm hover:underline mb-4">{companyDetails.companyInfo.website}</a>
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
              { icon: <TbFlame />, label: "Founded", value: companyDetails.foundedDate || "N/A" },
              { icon: <PiUsersThree />, label: "Employees", value: companyDetails.companyInfo.size },
              { icon: <IoLocationOutline />, label: "Location", value: companyDetails.companyInfo.location || "N/A" },
              { icon: <BsBuildings />, label: "Industry", value: companyDetails.companyInfo.industry }
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
          <p className="text-sm text-gray-700 leading-relaxed">{companyDetails.about || "No description provided."}</p>
        </div>

        {/* Tech Stack */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tech Stack</h3>
              </div>
          <div className="grid grid-cols-3 gap-y-6 text-sm font-medium text-center">
            {companyDetails.techStack && companyDetails.techStack.map((tech: any, index: number) => (
              <div className="space-y-2" key={index}>
                {/* A simple way to display an icon, could be improved */}
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-lg font-bold">{tech.name.charAt(0)}</span>
                </div>
                <p>{tech.name}</p>
              </div>
            ))}
          </div>
          <button className="mt-6 text-[#007BFF] text-sm font-medium flex items-center gap-1 hover:underline">View tech stack <FiExternalLink/></button>
                </div>
              </div>

      {/* Contact Links */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
                    </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {companyDetails.socialLinks && Object.entries(companyDetails.socialLinks).map(([platform, link]) => (
             <a href={link as string} key={platform} className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"><FaTwitter className="text-[#007BFF]"/> {link as string}</a>
                  ))}
          <a href={`mailto:${companyDetails.email}`} className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"><FaEnvelope className="text-gray-500"/>{companyDetails.email}</a>
          <a href={`tel:${companyDetails.phone}`} className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"><FaPhoneAlt className="text-gray-500"/> {companyDetails.phone}</a>
                </div>
              </div>

      {/* Working at Nomad & Office Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Working at {companyDetails.companyName}</h3>
          </div>
          <div className="flex gap-2 h-[450px]">
            <div className="w-2/3">
              <img src={companyDetails.gallery && companyDetails.gallery[0] ? companyDetails.gallery[0].url : work1} alt="work" className="w-full h-full object-cover rounded-md"/>
            </div>
            <div className="w-1/3 flex flex-col gap-2">
              <img src={companyDetails.gallery && companyDetails.gallery[1] ? companyDetails.gallery[1].url : work2} alt="work" className="w-full flex-1 object-cover rounded-md min-h-0"/>
              <img src={companyDetails.gallery && companyDetails.gallery[2] ? companyDetails.gallery[2].url : work3} alt="work" className="w-full flex-1 object-cover rounded-md min-h-0"/>
              <img src={companyDetails.gallery && companyDetails.gallery[3] ? companyDetails.gallery[3].url : work4} alt="work" className="w-full flex-1 object-cover rounded-md min-h-0"/>
                    </div>
                  </div>
                    </div>

        {/* Office Locations */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Office Locations</h3>
                  </div>
          <ul className="space-y-3 text-sm">
            {companyDetails.officeLocations && companyDetails.officeLocations.map((loc: any, i: number)=>(
              <li key={i} className="flex items-center gap-3">
                <img src={`https://flagcdn.com/w80/${loc.countryCode.toLowerCase()}.png`} alt={loc.name} className="w-12"/> 
                <span className="font-medium">{loc.name}</span>
                {loc.isHeadquarters && <span className="text-xs bg-blue-100 text-[#007BFF] font-semibold px-2 py-1 rounded-full">Head Quarters</span>}
              </li>
            ))}
          </ul>
          <button className="mt-4 text-[#007BFF] text-sm font-medium flex items-center gap-1 hover:underline">View countries <FiExternalLink className="w-4 h-4" /></button>
                    </div>
                  </div>

      {/* Team Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
         <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Team</h3>
                </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {companyDetails.team && companyDetails.team.map((member: any,i: number)=>(
            <div key={i} className="border border-gray-200 rounded-lg p-6 text-center">
              <img src={member.avatarUrl || `https://i.pravatar.cc/100?u=${member.name}`} className="w-20 h-20 rounded-full mx-auto mb-4"/>
              <div>
                <p className="text-base font-semibold text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500 mt-1">{member.role}</p>
              </div>
              <div className="flex justify-center gap-3 mt-4">
                  <a href="#" className="p-2 border border-gray-200 rounded-md hover:bg-gray-100">
                      <FaInstagram className="w-4 h-4 text-gray-500" />
                  </a>
                  <a href="#" className="p-2 border border-gray-200 rounded-md hover:bg-gray-100">
                      <FaLinkedinIn className="w-4 h-4 text-gray-500" />
                  </a>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-4 text-[#007BFF] text-sm font-medium flex items-center gap-1 hover:underline">View all core teams <FiExternalLink/></button>
          </div>

      {/* Benefits */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Benefit</h3>
            </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {companyDetails.benefits && companyDetails.benefits.map((benefit: any,i: number)=>(
            <div key={i} className="space-y-3">
              <div className="text-[#007BFF]">
                  {/* Could map icon names to react-icons */}
                  <FaStethoscope className="w-7 h-7" />
                  </div>
              <div>
                  <p className="font-semibold text-gray-900">{benefit.title}</p>
                  <p className="text-gray-600 text-sm mt-1">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

      {/* Open Positions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Open Positions</h3>
          {!showMoreJobs && <button onClick={()=>setShowMoreJobs(true)} className="text-[#007BFF] text-sm font-medium flex items-center gap-1 hover:underline">Show all jobs <FiArrowRight/></button>}
                  </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companyDetails.openJobs && companyDetails.openJobs.slice(0, showMoreJobs ? companyDetails.openJobs.length : 4).map((job: any,i: number)=>(
            <div key={i} className="border border-gray-200 rounded-lg p-4 flex items-start gap-4 hover:bg-gray-50 transition">
              <img src={job.logoUrl || companyDetails.companyLogo} alt={job.companyName} className="w-12 h-12 rounded-md"/>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 text-base">{job.title}</h4>
                <p className="text-sm text-gray-500 my-1">{job.companyName} • {job.location}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  {job.tags.map((tag: string, j: number) => (
                    <span key={j} className={`px-3 py-1 rounded-full ${getTagStyle(tag)}`}>
                      {tag}
                    </span>
              ))}
            </div>
          </div>
            </div>
              ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CompanyProfile; 