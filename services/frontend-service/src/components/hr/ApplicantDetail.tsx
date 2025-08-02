import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiStar, FiEdit, FiMessageSquare, FiDownload, FiCheckCircle, FiClock, FiCalendar, FiCheck, FiX, FiMoreHorizontal, FiPlus, FiChevronDown } from 'react-icons/fi';
import { FaInstagram, FaThumbtack } from 'react-icons/fa';
import { BiWorld } from 'react-icons/bi';
import DashboardSidebar from './DashboardSidebar';
import { IoLocationSharp } from "react-icons/io5";

interface CandidateDetails {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  education: string;
  experience: string[];
  skills: string[];
  resumeUrl: string;
  gender: string;
  dateOfBirth: string;
  languages: string[];
  aboutMe: string;
  currentJob: {
    title: string;
    years: string;
  };
  professionalInfo: {
    aboutMe: string;
    experience: string;
    currentJob: {
      title: string;
      years: string;
    };
    education: string;
    skills: string[];
  };
  matchPercentage: number;
}

const ApplicantDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'progress' | 'schedule'>('profile');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Mock data - replace with actual API call
  const candidateDetails: CandidateDetails = {
    id: Number(id),
    fullName: 'Jerome Bell',
    email: 'jeromeBell45@email.com',
    phone: '+44 1245 572 135',
    address: '4517 Washington Ave. Manchester, Kentucky 39495',
    avatar: `https://i.pravatar.cc/150?u=${id}`,
    education: 'Bachelors in Engineering',
    gender: 'Male',
    dateOfBirth: 'March 23, 1995',
    languages: ['English', 'French', 'Bahasa'],
    experience: [
      'Software Engineer at ABC Corp (2020-2023)',
      'Junior Developer at DEF Tech (2018-2020)',
    ],
    skills: ['Project Management', 'Copywriting', 'English'],
    resumeUrl: '#',
    aboutMe: "I'm a product designer + filmmaker currently working remotely at Twitter from beautiful Manchester, United Kingdom. I'm passionate about designing digital products that have a positive impact on the world.",
    currentJob: {
      title: 'Product Designer',
      years: '4 Years'
    },
    professionalInfo: {
      aboutMe: "I'm a product designer + filmmaker currently working remotely at Twitter from beautiful Manchester, United Kingdom. I'm passionate about designing digital products that have a positive impact on the world.",
      experience: "For 10 years, I've specialised in interface, experience & interaction design as well as working in user research and product strategy for product agencies, big tech companies & start-ups.",
      currentJob: {
        title: 'Product Designer',
        years: '4 Years'
      },
      education: 'Bachelors in Engineering',
      skills: ['Project Management', 'Copywriting', 'English']
    },
    matchPercentage: 90,
  };

  // Mock hiring timeline data
  const hiringTimeline = [
    { id: 1, label: 'Application Submitted', date: 'Jan 10, 2024', status: 'completed' },
    { id: 2, label: 'HR Screening', date: 'Jan 12, 2024', status: 'completed' },
    { id: 3, label: 'Interview', date: 'Jan 15, 2024', status: 'current' },
    { id: 4, label: 'Offer', date: '--', status: 'upcoming' },
    { id: 5, label: 'Hired', date: '--', status: 'upcoming' },
  ];

  // Mock interview schedule data
  const interviewSchedule = [
    { id: 1, date: 'Jan 15, 2024', time: '10:00 AM - 11:00 AM', interviewer: 'John Doe', mode: 'Video Call' },
    { id: 2, date: 'Jan 20, 2024', time: '2:00 PM - 3:00 PM', interviewer: 'Jane Smith', mode: 'Onsite' },
  ];

  const handleRejectConfirm = () => {
    // In a real app, you would send the rejectionReason to an API
    console.log("Rejection Reason:", rejectionReason);
    setIsRejectModalOpen(false);
    setRejectionReason(''); // Reset reason
  };

  return (
    <div className="flex min-h-screen bg-white">
      <div className="w-64 bg-white shadow-lg min-h-screen border-l border-r-0 border-gray-200 sticky top-0 z-10 flex flex-col overflow-y-auto">
        <DashboardSidebar activeTab="applicants" hasUnreadMessages={false} onNavigate={() => {}} />
      </div>
      <div className="flex-1 flex flex-col overflow-visible bg-white">
        <main className="flex-1 p-8">
          <div style={{fontFamily:'ABeeZee, sans-serif'}}>
            {/* Back + Title */}
            <div className="flex justify-between items-center pb-6">
              <div className="flex items-center">
                <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 mr-4">
                  <FiArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-normal text-gray-800">Applicant Details</h1>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsRejectModalOpen(true)}
                  className="bg-white border border-red-500 text-red-500 px-4 py-1 rounded-lg image.png flex items-center gap-2 hover:bg-red-50"
                >
                  <FiX /> Reject
                </button>
                <button className="bg-white border border-green-500 text-green-500 px-4 py-1 rounded-lg flex items-center gap-2 hover:bg-green-50">
                  <FiCheck /> Accept
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg p-6">
                {/* Avatar & Basic Info */}
                <div className="flex items-center gap-4 mb-6">
                  <img src={candidateDetails.avatar} alt={candidateDetails.fullName} className="w-24 h-24 rounded-full object-cover" />
                  <div className="h-24 flex flex-col justify-between text-left">
                    <h2 className="text-lg font-semibold text-gray-900">{candidateDetails.fullName}</h2>
                    <p className="text-sm text-gray-500">Product Designer</p>
                    <p className="text-sm font-semibold">
                      <span className="text-gray-800">Match: </span>
                      <span className="text-green-500">{candidateDetails.matchPercentage}%</span>
                    </p>
                  </div>
                </div>

                {/* Applied Job Card */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>Applied Jobs</span>
                    <span>2 days ago</span>
                  </div>
                  <div className="h-px bg-gray-200 mb-2" />
                  <h3 className="font-semibold text-gray-800 text-sm">Product Development</h3>
                  <p className="text-xs text-gray-500">Marketing • Full-Time</p>
                </div>

                {/* Stage Progress */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Stage</span>
                    <span className="text-[#007BFF]">Interview</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 h-2 rounded-full ${idx < 3 ? 'bg-[#007BFF]' : 'bg-gray-200'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Schedule Interview */}
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 text-[#007BFF] border border-[#007BFF] rounded-lg text-sm font-semibold hover:bg-blue-50">Schedule Interview</button>
                  <button className="p-2 border border-[#007BFF] rounded-lg hover:bg-blue-50">
                    <FiMessageSquare className="h-5 w-5 text-[#007BFF]" />
                  </button>
                </div>

                {/* Contact */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h4 className="text-gray-800 font-semibold mb-4 text-left">Contact</h4>
                  <div className="space-y-4 text-sm">
                    {/* Email */}
                    <div className="flex items-start gap-3 text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#007BFF] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-gray-500 text-xs">Email</p>
                        <p className="text-gray-900">{candidateDetails.email}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3 text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#007BFF] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <div>
                        <p className="text-gray-500 text-xs">Phone</p>
                        <p className="text-gray-900">{candidateDetails.phone}</p>
                      </div>
                    </div>

                    {/* Instagram */}
                    <div className="flex items-start gap-3 text-left">
                      <FaInstagram className="h-5 w-5 text-[#007BFF] mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Instagram</p>
                        <a href="https://instagram.com/jeromebell" target="_blank" rel="noopener noreferrer" className="text-[#007BFF] hover:underline">instagram.com/jeromebell</a>
                      </div>
                    </div>

                    {/* Twitter */}
                    <div className="flex items-start gap-3 text-left">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#007BFF] mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.564-2.005.974-3.127 1.195-.896-.954-2.173-1.55-3.591-1.55-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.247-2.228-.616v.06c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.419-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.022-1.17-.065 2.189 1.402 4.768 2.22 7.557 2.22 9.054 0 14.002-7.496 14.002-13.986 0-.21 0-.423-.015-.636.961-.694 1.8-1.562 2.46-2.549z" />
                      </svg>
                      <div>
                        <p className="text-gray-500 text-xs">Twitter</p>
                        <a href="https://twitter.com/jeromebell" target="_blank" rel="noopener noreferrer" className="text-[#007BFF] hover:underline">twitter.com/jeromebell</a>
                      </div>
                    </div>

                    {/* Website */}
                    <div className="flex items-start gap-3 text-left">
                      <BiWorld className="h-5 w-5 text-[#007BFF] mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs">Website</p>
                        <a href="https://www.jeromebell.com" target="_blank" rel="noopener noreferrer" className="text-[#007BFF] hover:underline">www.jeromebell.com</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
                {/* Tabs */}
                <div className="flex gap-6 border-b mb-6">
                  {[
                    {key:'profile',label:'Applicant Profile'},
                    {key:'resume',label:'Resume'},
                    {key:'progress',label:'Hiring Progress'},
                    {key:'schedule',label:'Interview Schedule'},
                  ].map(t => (
                    <button 
                      key={t.key} 
                      className={`relative pb-3 text-sm font-medium ${activeTab===t.key ? 'text-blue-600' : 'text-gray-600'}`} 
                      onClick={()=>setActiveTab(t.key as any)}
                    >
                      {t.label}
                      {activeTab===t.key && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"/>}
                    </button>
                  ))}
                </div>

                {activeTab === 'profile' && (
                  <div className="space-y-8">
                    {/* Personal Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Personal Info</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-left">
                        <div>
                          <p className="text-gray-500">Full Name</p>
                          <p className="font-medium text-gray-900">{candidateDetails.fullName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Gender</p>
                          <p className="font-medium text-gray-900">{candidateDetails.gender}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Date of Birth</p>
                          <p className="font-medium text-gray-900">{candidateDetails.dateOfBirth} (26 y.o)</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Language</p>
                          <p className="font-medium text-gray-900">{candidateDetails.languages.join(', ')}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-gray-500">Address</p>
                          <p className="font-medium text-gray-900">{candidateDetails.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Professional Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Professional Info</h3>
                      <div className="space-y-6 text-left">
                        <div>
                          <p className="text-gray-500">About Me</p>
                          <p className="mt-1 text-gray-900">{candidateDetails.professionalInfo.aboutMe}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Experience</p>
                          <p className="mt-1 text-gray-900">{candidateDetails.professionalInfo.experience}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-gray-500">Current Job</p>
                            <p className="mt-1 text-gray-900">{candidateDetails.currentJob.title}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Experience in Years</p>
                            <p className="mt-1 text-gray-900">{candidateDetails.currentJob.years}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-gray-500">Highest Qualification Held</p>
                            <p className="mt-1 text-gray-900">{candidateDetails.education}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Skill set</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {candidateDetails.skills.map((skill, index) => (
                                <span key={index} className="px-3 py-1 bg-blue-50 text-[#007BFF] rounded-full text-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'resume' && (
                  <div className="p-6 bg-white rounded-lg shadow-md text-left border border-gray-300">
                    <div className="grid grid-cols-3 gap-8">
                      {/* Left Column */}
                      <div className="col-span-2">
                        <h2 className="text-4xl font-bold">Jerome Bell</h2>
                        <p className="text-xl text-gray-600 mb-6">Product Designer</p>

                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Experience</h3>
                        <div className="space-y-6">
                          <div>
                            <p className="font-semibold">Senior UI/UX Product Designer</p>
                            <p className="text-gray-600">Enterprise name</p>
                            <p className="text-gray-500 text-xs">Aug 2018 - Present • 1 year, Paris</p>
                            <p className="mt-2">Directly collaborated with CEO and Product team to prototype, design and deliver the UI and UX experience with a lean design process: research, design, test, and iterate.</p>
                          </div>
                          <div>
                            <p className="font-semibold">UI/UX Product Designer</p>
                            <p className="text-gray-600">Enterprise name</p>
                            <p className="text-gray-500 text-xs">Aug 2013 - Aug 2018 • 5 years, Paris</p>
                            <p className="mt-2">Lead the UI design with the accountability of the design system, collaborated with product and development teams on core projects to improve product interfaces and experiences.</p>
                          </div>
                          <div>
                            <p className="font-semibold">UI Designer</p>
                            <p className="text-gray-600">Enterprise name</p>
                            <p className="text-gray-500 text-xs">Aug 2012 - Jul 2013 • 1 year, Paris</p>
                            <p className="mt-2">Designed mobile UI applications for Orange R&D departement, BNP Paribas, La Poste, Le Cned...</p>
                          </div>
                          <div>
                            <p className="font-semibold">Graphic Designer</p>
                            <p className="text-gray-600">Enterprise name</p>
                            <p className="text-gray-500 text-xs">Sept 2010 - Jul 2012 • 2 years, Paris</p>
                            <p className="mt-2">Designed print and web applications for Pau Brasil, Renault, Le théatre du Mantois, La mairie de Mantes la Ville...</p>
                          </div>
                        </div>
                        
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-8 mb-4">Education</h3>
                        <div className="space-y-4">
                          <div>
                            <p className="font-semibold">Bachelor European in Graphic Design</p>
                            <p className="text-gray-600">School name</p>
                            <p className="text-gray-500 text-xs">2006 - 2010, Bagnolet</p>
                          </div>
                          <div>
                            <p className="font-semibold">BTS Communication Visuelle option Multimédia</p>
                            <p className="text-gray-600">School name</p>
                            <p className="text-gray-500 text-xs">2007 - 2009, Bagnolet</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div>
                        <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Jerome Bell" className="w-24 h-24 rounded-full mb-4" />
                        <div>
                          <p>jeromebell@gmail.com</p>
                          <p>+44 1245 572 135</p>
                          <p>Vernouillet</p>
                        </div>
                        <div className="mt-6">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Industry Knowledge</h3>
                          <p>Product Design</p>
                          <p>User Interface</p>
                          <p>User Experience</p>
                          <p>Interaction Design</p>
                          <p>Wireframing</p>
                          <p>Rapid Prototyping</p>
                          <p>Design Research</p>

                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-4">Tools & Technologies</h3>
                          <p>Figma, Sketch, Protopie, Framer, Invision, Abstract, Zeplin, Google Analytics, Amplitude, Fullstory...</p>

                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-4">Other Skills</h3>
                          <p>HTML, CSS, JQuery</p>

                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-4">Languages</h3>
                          <p>French (native)</p>
                          <p>English (professionnal)</p>

                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-6 mb-4">Social</h3>
                          <p className="text-blue-600 hover:underline cursor-pointer">yoursite.com</p>
                          <p className="text-blue-600 hover:underline cursor-pointer">linkedin.com/in/yourname</p>
                          <p className="text-blue-600 hover:underline cursor-pointer">dribbble.com/yourname</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'progress' && (
                  <div className="p-6 bg-white rounded-lg shadow-md border border-gray-300">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold">Current Stage</h3>
                      <button className="flex items-center border border-gray-300 rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-50" style={{ color: '#007BFF' }}>
                        <FiChevronDown className="mr-2" /> Give Rating
                      </button>
                    </div>
                    
                    <div className="flex items-center bg-gray-100 rounded-full p-1">
                      <div className="flex-1 py-2 text-center text-sm font-semibold rounded-full" style={{ color: '#007BFF' }}>
                        In-Review
                      </div>
                      <div className="flex-1 py-2 text-center text-sm font-semibold rounded-full" style={{ color: '#007BFF' }}>
                        Approve
                      </div>
                      <div className="flex-1 py-2 text-center text-white text-sm font-semibold rounded-full shadow-md" style={{ backgroundColor: '#007BFF' }}>
                        Interview
                      </div>
                      <div className="flex-1 py-2 text-center text-gray-400 text-sm font-semibold rounded-full">
                        Mini-test
                      </div>
                      <div className="flex-1 py-2 text-center text-gray-400 text-sm font-semibold rounded-full">
                        Hired / Declined
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-300">
                      <h4 className="font-semibold mb-4 text-left">Stage Info</h4>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-left">
                        <div>
                          <p className="text-sm text-gray-500">Interview Date</p>
                          <p>10 - 13 July 2021</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Interview Status</p>
                          <p className="font-semibold">
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">On Progress</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Interview Location</p>
                          <p>
                            Silver Crysta Room, Nomad Office<br />
                            3517 W. Gray St. Utica,<br />
                            Pennsylvania 57867
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Assigned to</p>
                          <div className="flex -space-x-2 overflow-hidden">
                            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://i.pravatar.cc/50?u=a" alt="User 1" />
                            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://i.pravatar.cc/50?u=b" alt="User 2" />
                            <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white" src="https://i.pravatar.cc/50?u=c" alt="User 3" />
                          </div>
                        </div>
                      </div>
                      <div className="text-left mt-6">
                        <button className="border px-4 py-2 rounded-md hover:bg-gray-50 text-sm font-semibold" style={{ borderColor: '#007BFF', color: '#007BFF' }}>
                          Move To Next Step
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-left">Notes</h4>
                        <button className="flex items-center text-sm font-semibold" style={{ color: '#007BFF' }}>
                          <FiPlus className="mr-1" /> Add Notes
                        </button>
                      </div>
                      <div className="space-y-4 text-left">
                        <div className="p-4 border rounded-md">
                          <div className="flex items-start">
                            <img src="https://i.pravatar.cc/50?u=maria" alt="Maria Kelly" className="w-10 h-10 rounded-full mr-4" />
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold">Maria Kelly</p>
                                <p className="text-xs text-gray-500">10 July, 2021 • 11:30 AM</p>
                              </div>
                              <p className="text-sm mt-1">Please, do an interview stage immediately. The design division needs more new employee now</p>
                              <button className="text-sm font-semibold mt-2" style={{ color: '#007BFF' }}>2 Replies</button>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 border rounded-md">
                          <div className="flex items-start">
                            <img src="https://i.pravatar.cc/50?u=maria" alt="Maria Kelly" className="w-10 h-10 rounded-full mr-4" />
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className="font-semibold">Maria Kelly</p>
                                <p className="text-xs text-gray-500">10 July, 2021 • 10:30 AM</p>
                              </div>
                              <p className="text-sm mt-1">Please, do an interview stage immediately.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-300">
                    <div className="flex justify-between items-center mb-4 text-left">
                      <h3 className="text-lg font-semibold">Interview List</h3>
                      <button className="flex items-center gap-2 px-4 py-2 bg-[#007BFF] text-white rounded-lg"><FiPlus /> Add Schedule Interview</button>
                    </div>
                    <div className="space-y-4 text-left">
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">Tomorrow - 10 July, 2021</p>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <img src="https://i.pravatar.cc/48?u=d" className="w-12 h-12 rounded-full"/>
                            <div>
                              <p className="font-bold">Kathryn Murphy</p>
                              <p className="text-sm text-gray-500">Written Test</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm">10:00 AM - 11:30 AM</p>
                            <p className="text-sm text-gray-500">Silver Crysta Room, Nomad</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#007BFF] text-[#007BFF] font-semibold rounded-lg text-sm"><FiEdit /> Add Feedback</button>
                            <button><FiMoreHorizontal /></button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">11 July, 2021</p>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <img src="https://i.pravatar.cc/48?u=e" className="w-12 h-12 rounded-full"/>
                            <div>
                              <p className="font-bold">Jenny Wilson</p>
                              <p className="text-sm text-gray-500">Written Test 2</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm">10:00 AM - 11:00 AM</p>
                            <p className="text-sm text-gray-500">Silver Crysta Room, Nomad</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#007BFF] text-[#007BFF] font-semibold rounded-lg text-sm"><FiEdit /> Add Feedback</button>
                            <button><FiMoreHorizontal /></button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">12 July, 2021</p>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <img src="https://i.pravatar.cc/48?u=f" className="w-12 h-12 rounded-full"/>
                            <div>
                              <p className="font-bold">Thad Eddings</p>
                              <p className="text-sm text-gray-500">Skill Test</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm">10:00 AM - 11:00 AM</p>
                            <p className="text-sm text-gray-500">Silver Crysta Room, Nomad</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#007BFF] text-[#007BFF] font-semibold rounded-lg text-sm"><FiEdit /> Add Feedback</button>
                            <button><FiMoreHorizontal /></button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500 mb-2">13 July, 2021</p>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center gap-4">
                            <img src="https://i.pravatar.cc/48?u=g" className="w-12 h-12 rounded-full"/>
                            <div>
                              <p className="font-bold">Thad Eddings</p>
                              <p className="text-sm text-gray-500">Final Test</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm">10:00 AM - 11:00 AM</p>
                            <p className="text-sm text-gray-500">Silver Crysta Room, Nomad</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-[#007BFF] text-[#007BFF] font-semibold rounded-lg text-sm"><FiEdit /> Add Feedback</button>
                            <button><FiMoreHorizontal /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl relative text-left">
            <button
                onClick={() => setIsRejectModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
                <FiX className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold mb-4">Confirm Rejection</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to reject this applicant? This action cannot be undone.</p>
            <div className="mb-6">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection
              </label>
              <textarea
                id="rejectionReason"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantDetail; 