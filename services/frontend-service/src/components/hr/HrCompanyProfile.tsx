import React, { useState, useEffect } from 'react';
import { FiEdit, FiExternalLink, FiPlus, FiArrowRight } from 'react-icons/fi';
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
import hrApi from '../../services/hrApi';


interface CompanyProfile {
  company_id: string;
  company_name: string;
  description?: string;
  website?: string;
  address?: string;
  industry?: string;
  company_size?: string;
  logo_url?: string;
  founded_year?: number;
  created_at?: string;
  // Additional computed fields
  city_name?: string;
  district_name?: string;
}

const HrCompanyProfile: React.FC = () => {
    const [showMoreJobs, setShowMoreJobs] = useState(false);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [companyJobs, setCompanyJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchCompanyData = async () => {
        setIsLoading(true);
        try {
          // Fetch company profile
          const companyResponse = await hrApi.getMyCompanyProfile();
          const company = companyResponse?.data?.company || companyResponse?.company || companyResponse;
          setCompanyProfile(company);

          // Fetch company jobs
          if (company?.company_id) {
            try {
              const jobsResponse = await hrApi.getMyJobs({ limit: 10 });
              setCompanyJobs(jobsResponse?.data || []);
            } catch (jobError) {
              console.error('Error fetching company jobs:', jobError);
              // Don't set error for jobs, just use empty array
            }
          }

          setError(null);
        } catch (err: any) {
          setError(err.message || 'Failed to load company profile');
          console.error('Error fetching company data:', err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCompanyData();
    }, []);

    // Fallback data when API fails or for missing fields
    const getCompanyDetails = () => {
      if (!companyProfile) {
        return {
          companyName: 'Loading...',
          companyLogo: companyLogo,
          companyInfo: {
            address: 'Loading...',
            industry: 'Loading...',
            size: 'Loading...',
            website: '',
          },
          phone: '',
          activeJobs: 0,
          totalCandidates: 0,
        };
      }

      return {
        companyName: companyProfile.company_name || 'Unnamed Company',
        companyLogo: companyProfile.logo_url || companyLogo,
        companyInfo: {
          address: companyProfile.address || `${companyProfile.city_name || ''}, Vietnam`.trim(),
          industry: companyProfile.industry || 'Not specified',
          size: companyProfile.company_size || 'Not specified',
          website: companyProfile.website || '',
        },
        phone: '', // Not available in current schema
        activeJobs: companyJobs.length,
        totalCandidates: companyJobs.reduce((sum, job) => sum + (job.application_count || 0), 0),
        description: companyProfile.description || 'No description available.',
        foundedYear: companyProfile.founded_year,
        email: '', // Not available in current schema
      };
    };

    const companyDetails = getCompanyDetails();

  const getTagStyle = (tag: string) => {
    switch (tag) {
      case 'Full-Time':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'Part-Time':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'Contract':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'Internship':
        return 'bg-orange-100 text-orange-700 border border-orange-200';
      case 'Freelance':
        return 'bg-pink-100 text-pink-700 border border-pink-200';
      case 'ONSITE':
      case 'Onsite':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'REMOTE':
      case 'Remote':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'HYBRID':
      case 'Hybrid':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'ENTRY':
      case 'Entry':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'JUNIOR':
      case 'Junior':
        return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
      case 'MID':
      case 'Mid':
        return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
      case 'SENIOR':
      case 'Senior':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'LEAD':
      case 'Lead':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      case 'Marketing':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'Design':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div style={{fontFamily:'ABeeZee, sans-serif'}} className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{fontFamily:'ABeeZee, sans-serif'}} className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{fontFamily:'ABeeZee, sans-serif'}}>
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-normal text-gray-800">Company Profile</h1>
        </div>

      {/* Header panel */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-8 bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="relative">
          <img src={companyDetails.companyLogo} alt={companyDetails.companyName} className="w-24 h-24 object-contain" />
          <button className="absolute -top-1 -left-1 bg-white border border-gray-300 rounded-md p-1 hover:bg-gray-100 shadow">
              <FiEdit className="w-3 h-3 text-[#007BFF]" />
          </button>
        </div>
        <div className="flex-1 text-left">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-semibold text-gray-900 mb-1" style={{fontFamily:'ABeeZee, sans-serif'}}>{companyDetails.companyName}</h2>
                    <a href={companyDetails.companyInfo.website} className="text-[#007BFF] text-sm hover:underline mb-4">{companyDetails.companyInfo.website}</a>
                </div>
                <div className="flex">
                    <button className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-md bg-white hover:bg-blue-50 text-sm font-medium mr-4">
                        <IoEarth className="w-4 h-4" />
                        Public View
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-md bg-white hover:bg-blue-50 text-sm font-medium">
                        <FiEdit className="w-4 h-4" />
                        Profile Settings
                    </button>
                </div>
            </div>

          {/* Metrics */}
          <div className="flex items-center justify-between text-sm mt-6">
            {[
              { icon: <TbFlame />, label: "Founded", value: companyDetails.foundedYear ? companyDetails.foundedYear.toString() : "Not specified" },
              { icon: <PiUsersThree />, label: "Employees", value: companyDetails.companyInfo.size },
              { icon: <IoLocationOutline />, label: "Location", value: companyDetails.companyInfo.address || "Not specified" },
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
            <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
              <FiEdit className="w-4 h-4 text-[#007BFF]" />
            </button>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{companyDetails.description}</p>
        </div>

        {/* Tech Stack */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tech Stack</h3>
            <div className="flex items-center gap-2">
              <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
                <FiPlus className="w-4 h-4 text-[#007BFF]" />
              </button>
              <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
                <FiEdit className="w-4 h-4 text-[#007BFF]" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-y-6 text-sm font-medium text-center">
            <div className="space-y-2">
              <FaHtml5 className="w-10 h-10 text-orange-500 mx-auto"/>
              <p>HTML 5</p>
            </div>
            <div className="space-y-2">
              <FaCss3Alt className="w-10 h-10 text-blue-600 mx-auto"/>
              <p>CSS 3</p>
            </div>
            <div className="space-y-2">
              <FaJs className="w-10 h-10 text-yellow-400 mx-auto"/>
              <p>JavaScript</p>
            </div>
            <div className="space-y-2">
              <FaGem className="w-10 h-10 text-red-600 mx-auto"/>
              <p>Ruby</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-[#5A45F2] rounded-lg flex items-center justify-center space-x-0.5 mx-auto">
                  <span className="block w-1.5 h-1.5 bg-white rounded-full"></span>
                  <span className="block w-1.5 h-1.5 bg-white rounded-full"></span>
                  <span className="block w-1.5 h-1.5 bg-white rounded-full"></span>
              </div>
              <p>Mixpanel</p>
            </div>
            <div className="space-y-2">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto">
                  <SiFramer className="w-6 h-6 text-white"/>
              </div>
              <p>Framer</p>
            </div>
          </div>
          <button className="mt-6 text-[#007BFF] text-sm font-medium flex items-center gap-1 hover:underline">View tech stack <FiExternalLink/></button>
        </div>
      </div>

      {/* Contact Links */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
          <div className="flex items-center gap-2">
            <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
              <FiPlus className="w-4 h-4 text-[#007BFF]" />
            </button>
            <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
              <FiEdit className="w-4 h-4 text-[#007BFF]" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="#" className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"><FaTwitter className="text-[#007BFF]"/> twitter.com/Nomad</a>
          <a href="#" className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"><FaFacebookF className="text-[#007BFF]"/> facebook.com/NomadHQ</a>
          <a href="#" className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"><FaLinkedinIn className="text-[#007BFF]"/> linkedin.com/company/nomad</a>
          {companyDetails.email && (
            <a href={`mailto:${companyDetails.email}`} className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">
              <FaEnvelope className="text-gray-500"/> {companyDetails.email}
            </a>
          )}
          {companyDetails.phone && (
            <a href={`tel:${companyDetails.phone}`} className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50">
              <FaPhoneAlt className="text-gray-500"/> {companyDetails.phone}
            </a>
          )}
        </div>
      </div>

      {/* Working at Nomad & Office Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Working at Nomad</h3>
            <div className="flex items-center gap-2">
              <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
                <FiPlus className="w-4 h-4 text-[#007BFF]" />
              </button>
              <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
                <FiEdit className="w-4 h-4 text-[#007BFF]" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 h-[450px]">
            <div className="w-2/3">
              <img src={work1} alt="work" className="w-full h-full object-cover rounded-md"/>
            </div>
            <div className="w-1/3 flex flex-col gap-2">
              <img src={work2} alt="work" className="w-full flex-1 object-cover rounded-md min-h-0"/>
              <img src={work3} alt="work" className="w-full flex-1 object-cover rounded-md min-h-0"/>
              <img src={work4} alt="work" className="w-full flex-1 object-cover rounded-md min-h-0"/>
            </div>
          </div>
        </div>

        {/* Office Locations */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Office Locations</h3>
            <div className="flex items-center gap-2">
                <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
                  <FiPlus className="w-4 h-4 text-[#007BFF]" />
                </button>
                <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
                  <FiEdit className="w-4 h-4 text-[#007BFF]" />
                </button>
            </div>
          </div>
          <ul className="space-y-3 text-sm">
            {[
              {name: 'United States', code: 'us', hq: true}, 
              {name: 'England', code: 'gb'}, 
              {name: 'Japan', code: 'jp'}, 
              {name: 'Australia', code: 'au'}, 
              {name: 'China', code: 'cn'}
            ].map((loc,i)=>(
              <li key={i} className="flex items-center gap-3">
                <img src={`https://flagcdn.com/w40/${loc.code}.png`} alt={loc.name}/> 
                <span className="font-medium">{loc.name}</span>
                {loc.hq && <span className="text-xs bg-blue-100 text-[#007BFF] font-semibold px-2 py-1 rounded-full">Head Quarters</span>}
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
          <div className="flex items-center gap-2">
              <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
                <FiPlus className="w-4 h-4 text-[#007BFF]" />
              </button>
              <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
                <FiEdit className="w-4 h-4 text-[#007BFF]" />
              </button>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            {name: 'Célestin Gardinier', role: 'CEO & Co-Founder', avatar: 'https://i.pravatar.cc/100?u=celestin'},
            {name: 'Reynaud Colbert', role: 'Co-Founder', avatar: 'https://i.pravatar.cc/100?u=reynaud'},
            {name: 'Arienne Lyon', role: 'Managing Director', avatar: 'https://i.pravatar.cc/100?u=arienne'},
            {name: 'Marcelin Deschamps', role: 'Lead Engineer', avatar: 'https://i.pravatar.cc/100?u=marcelin'},
            {name: 'Émilie Dubois', role: 'Head of Design', avatar: 'https://i.pravatar.cc/100?u=emilie'},
          ].map((member,i)=>(
            <div key={i} className="border border-gray-200 rounded-lg p-6 text-center">
              <img src={member.avatar} className="w-20 h-20 rounded-full mx-auto mb-4"/>
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
          <div className="flex items-center gap-2">
              <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
                <FiPlus className="w-4 h-4 text-[#007BFF]" />
              </button>
              <button className="p-1 border border-[#007BFF] rounded-md hover:bg-blue-50">
                <FiEdit className="w-4 h-4 text-[#007BFF]" />
              </button>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {icon: <FaStethoscope />, title: 'Full Healthcare', desc: 'We believe in thriving communities and that starts with our team being happy and healthy.'},
            {icon: <FaSwimmingPool />, title: 'Unlimited Vacation', desc: 'We believe you should have a flexible schedule that makes space for family, wellness, and fun.'},
            {icon: <FaVideo />, title: 'Skill Development', desc: 'We believe in always learning and leveling up our skills. Whether it\'s a conference or online course.'},
            {icon: <FaMountain />, title: 'Team Summits', desc: 'Every 6 months we have a full team summit where we have fun, reflect, and plan for the upcoming quarter.'},
            {icon: <FaCoffee />, title: 'Remote Working', desc: 'You know how you perform your best. Work from home, coffee shop or anywhere when you feel like it.'},
            {icon: <FaTrain />, title: 'Commuter Benefits', desc: 'We\'re grateful for all the time and energy each team member puts into getting to work every day.'},
          ].map((benefit,i)=>(
            <div key={i} className="space-y-3">
              <div className="text-[#007BFF]">
                  {React.cloneElement(benefit.icon, { className: 'w-7 h-7' })}
              </div>
              <div>
                  <p className="font-semibold text-gray-900">{benefit.title}</p>
                  <p className="text-gray-600 text-sm mt-1">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Open Positions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Open Positions</h3>
          {!showMoreJobs && companyJobs.length > 4 && (
            <button onClick={()=>setShowMoreJobs(true)} className="text-[#007BFF] text-sm font-medium flex items-center gap-1 hover:underline">
              Show all jobs ({companyJobs.length}) <FiArrowRight/>
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companyJobs.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-gray-500">
              <p>No open positions at the moment.</p>
            </div>
          ) : (
            companyJobs.slice(0, showMoreJobs ? companyJobs.length : 4).map((job, i) => {
              // Map employment type to display format
              const getEmploymentTypeDisplay = (empType: string) => {
                switch (empType) {
                  case 'FULL_TIME': return 'Full-Time';
                  case 'PART_TIME': return 'Part-Time';
                  case 'CONTRACT': return 'Contract';
                  case 'INTERNSHIP': return 'Internship';
                  case 'FREELANCE': return 'Freelance';
                  default: return empType;
                }
              };

              const jobTags = [
                getEmploymentTypeDisplay(job.employment_type),
                job.remote_work_option || 'Onsite',
                job.experience_level || 'Entry'
              ].filter(Boolean);

              return (
                <div key={job.job_id || i} className="border border-gray-200 rounded-lg p-4 flex items-start gap-4 hover:bg-gray-50 transition">
                  <img src={companyDetails.companyLogo} alt={companyDetails.companyName} className="w-12 h-12 rounded-md object-contain"/>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 text-base">{job.title}</h4>
                    <p className="text-sm text-gray-500 my-1">
                      {companyDetails.companyName} • {job.city_name || companyDetails.companyInfo.address}
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {jobTags.map((tag, j) => (
                        <span key={j} className={`px-3 py-1 rounded-full ${getTagStyle(tag)}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {job.application_count || 0} applicants • Posted {new Date(job.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default HrCompanyProfile; 