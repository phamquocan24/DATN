import React, { useState } from 'react';
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


const HrCompanyProfile: React.FC = () => {
    const [showMoreJobs, setShowMoreJobs] = useState(false);

  // Mock data - replace with actual API call
  const companyDetails = {
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
              { icon: <TbFlame />, label: "Founded", value: "July 31, 2011" },
              { icon: <PiUsersThree />, label: "Employees", value: companyDetails.companyInfo.size },
              { icon: <IoLocationOutline />, label: "Location", value: "20 countries" },
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
          <p className="text-sm text-gray-700 leading-relaxed">Nomad is a software platform for starting and running internet businesses. Millions of businesses rely on Stripe’s software tools to accept payments, expand globally, and manage their businesses online. Stripe has been at the forefront of expanding internet commerce, powering new business models, and supporting the latest platforms, from marketplaces to mobile commerce sites. We believe that growing the GDP of the internet is a problem rooted in code and design, not finance. Stripe is built for developers, makers, and creators. We work on solving the hard technical problems necessary to build global economic infrastructure—from designing highly reliable systems to developing advanced machine learning algorithms to prevent fraud.</p>
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
          <a href="#" className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"><FaEnvelope className="text-gray-500"/> nomad@gmail.com</a>
          <a href={`tel:${companyDetails.phone}`} className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"><FaPhoneAlt className="text-gray-500"/> {companyDetails.phone}</a>
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
          {!showMoreJobs && <button onClick={()=>setShowMoreJobs(true)} className="text-[#007BFF] text-sm font-medium flex items-center gap-1 hover:underline">Show all jobs <FiArrowRight/></button>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {title: 'Social Media Assistant', company: 'Nomad', location: 'Paris, France', tags:['Full-Time', 'Marketing', 'Design'], logo: companyLogo},
            {title: 'Brand Designer', company: 'Dropbox', location: 'San Fransisco, USA', tags:['Full-Time', 'Marketing', 'Design'], logo: companyLogo},
            {title: 'Interactive Developer', company: 'Terraform', location: 'Hamburg, Germany', tags:['Full-Time', 'Marketing', 'Design'], logo: companyLogo},
            {title: 'HR Manager', company: 'Packer', location: 'Lucern, Switzerland', tags:['Full-Time', 'Marketing', 'Design'], logo: companyLogo},
          ].slice(0, showMoreJobs ? 4 : 4).map((job,i)=>(
            <div key={i} className="border border-gray-200 rounded-lg p-4 flex items-start gap-4 hover:bg-gray-50 transition">
              <img src={job.logo} alt={job.company} className="w-12 h-12 rounded-md"/>
              <div className="text-left">
                <h4 className="font-semibold text-gray-900 text-base">{job.title}</h4>
                <p className="text-sm text-gray-500 my-1">{job.company} • {job.location}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  {job.tags.map((tag, j) => (
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
    </div>
  );
};

export default HrCompanyProfile; 