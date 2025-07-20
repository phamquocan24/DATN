import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { FiArrowLeft, FiStar, FiEdit, FiMessageSquare, FiDownload, FiCheckCircle, FiClock, FiCalendar } from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import { BiWorld } from 'react-icons/bi';

interface CandidateDetails {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  status: 'Active' | 'Locked';
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
}

const AdminCandidateDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'progress' | 'schedule'>('profile');

  // Mock data - replace with actual API call
  const candidateDetails: CandidateDetails = {
    id: Number(id),
    fullName: 'Jerome Bell',
    email: 'jeromeBell45@email.com',
    phone: '+44 1245 572 135',
    address: '4517 Washington Ave. Manchester, Kentucky 39495',
    status: 'Active',
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
    }
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
          <button className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] rounded text-[#007BFF] hover:bg-blue-50 text-sm font-medium">
            <FiEdit className="w-4 h-4" />
            Edit information
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg p-6">
            {/* Avatar & Basic Info */}
            <div className="flex items-center gap-4 mb-6">
              <img src={candidateDetails.avatar} alt={candidateDetails.fullName} className="w-24 h-24 rounded-full object-cover" />
              <div className="h-24 flex flex-col justify-between">
                <h2 className="text-lg font-semibold text-gray-900">{candidateDetails.fullName}</h2>
                <p className="text-sm text-gray-500">Product Designer</p>
                <div className="flex items-center gap-1 mt-1">
                  <FiStar className="text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">4.0</span>
                </div>
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

            {/* Tab Content */}
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
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Summary / Details */}
                <div className="flex-1 space-y-4 text-sm text-left">
                  <h4 className="text-lg font-semibold text-gray-900">Resume Details</h4>
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="text-gray-900 font-medium">{candidateDetails.fullName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Education</p>
                    <p className="text-gray-900 font-medium">{candidateDetails.education}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Experience</p>
                    <ul className="list-disc ml-5 space-y-1">
                      {candidateDetails.experience.map((exp, idx) => (
                        <li key={idx}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#007BFF] text-white rounded hover:bg-blue-600 text-sm">
                    <FiDownload className="w-4 h-4" /> Download Resume
                  </button>
                </div>

                {/* Resume Preview */}
                <div className="flex-1">
                  <div className="border border-gray-200 rounded-lg overflow-hidden h-[500px] flex items-center justify-center bg-gray-50">
                    {/* Replace with actual embed/iframe */}
                    <span className="text-gray-400 text-sm">Resume preview (PDF)</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'progress' && (
              <div className="space-y-6 text-left">
                {hiringTimeline.map(step => (
                  <div key={step.id} className="flex items-start gap-3">
                    {step.status === 'completed' && <FiCheckCircle className="w-5 h-5 text-green-500 mt-0.5" />}
                    {step.status === 'current' && <FiClock className="w-5 h-5 text-[#007BFF] mt-0.5" />}
                    {step.status === 'upcoming' && <FiClock className="w-5 h-5 text-gray-300 mt-0.5" />}
                    <div>
                      <p className={`font-medium ${step.status === 'current' ? 'text-[#007BFF]' : 'text-gray-900'}`}>{step.label}</p>
                      <p className="text-xs text-gray-500">{step.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-4 text-left">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#007BFF] text-white rounded hover:bg-blue-600 text-sm mb-2">
                  <FiCalendar className="w-4 h-4" /> Schedule New Interview
                </button>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-left">Interviewer</th>
                        <th className="px-3 py-2 text-left">Mode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {interviewSchedule.map(row => (
                        <tr key={row.id} className="border-t">
                          <td className="px-3 py-2">{row.date}</td>
                          <td className="px-3 py-2">{row.time}</td>
                          <td className="px-3 py-2">{row.interviewer}</td>
                          <td className="px-3 py-2">{row.mode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCandidateDetail; 