import { useState } from 'react';
import { Footer } from './Footer';
import { JobApplication } from './JobApplication';

interface CompanyProfileProps {
  companyId?: string;
  onBack?: () => void;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ companyId: _, onBack: _onBack }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const handleApplyClick = (job: any) => {
    setSelectedJob(job);
    setIsApplicationOpen(true);
  };

  const handleCloseApplication = () => {
    setIsApplicationOpen(false);
    setSelectedJob(null);
  };

  // Sample company data - in real app, this would be fetched based on companyId
  const company = {
    id: 1,
    name: 'Stripe',
    website: 'https://stripe.com',
    founded: 'July 31, 2021',
    employment: '400+',
    locations: '20 countries',
    industry: 'Payment Gateway',
    logo: 'S',
    logoColor: 'bg-[#007BFF] text-white',
    description: `Stripe is a software platform for starting and running internet businesses. Millions of businesses rely on Stripe's software tools to accept payments, expand globally, and manage their businesses online. Stripe has been at the forefront of expanding internet commerce, representing hundreds of billions of dollars in transactions each year for businesses of all sizes from new startups to large enterprise companies. Stripe also helps companies of all sizes beat fraud. The company builds the most powerful and flexible tools for internet commerce. Our world is becoming increasingly digital, so commerce and businesses have to become more global.`,
    contact: {
      phone: '251220103',
      email: 'info@stripe.com',
      address: '60L Nguyễn Thành Nam - San Fran - HN'
    },
    techStack: [
      { name: 'HTML5', icon: '🌐', color: 'bg-orange-100 text-orange-600' },
      { name: 'CSS3', icon: '🎨', color: 'bg-[#007BFF]/10 text-[#007BFF]' },
      { name: 'JavaScript', icon: 'JS', color: 'bg-yellow-100 text-yellow-600' },
      { name: 'Ruby', icon: '💎', color: 'bg-red-100 text-red-600' },
      { name: 'Discord', icon: '💬', color: 'bg-purple-100 text-purple-600' },
      { name: 'Notion', icon: '📝', color: 'bg-gray-100 text-gray-600' }
    ],
    officeLocations: [
      { country: 'United States', flag: '🇺🇸' },
      { country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { country: 'Japan', flag: '🇯🇵' },
      { country: 'Australia', flag: '🇦🇺' },
      { country: 'China', flag: '🇨🇳' }
    ],
    team: [
      { name: 'Calvin Gardiner', role: 'UI Designer', avatar: '👨‍💻' },
      { name: 'Reynuad Colbert', role: 'UI Designer', avatar: '👨‍🎨' },
      { name: 'Arienne Lyon', role: 'Marketing Manager', avatar: '👩‍💼' },
      { name: 'Bernard Alexander', role: 'Managing Director', avatar: '👨‍💼' },
      { name: 'Christine Johnson', role: 'Managing Director', avatar: '👩‍💼' }
    ],
    perks: [
      {
        title: 'Full Healthcare',
        description: 'We believe in thriving communities and that starts with our team being happy and healthy.',
        icon: '🏥'
      },
      {
        title: 'Unlimited Vacation',
        description: 'We believe you should have a flexible schedule that makes space for family, wellness, and fun.',
        icon: '🏖️'
      },
      {
        title: 'Skill Development',
        description: 'We believe in always learning and leveling up our skills. Whether its conference or online course.',
        icon: '📚'
      },
      {
        title: 'Team Summits',
        description: 'Every 6 months we have a full team retreat where we have fun, reflect, and plan for the upcoming quarter.',
        icon: '🚀'
      },
      {
        title: 'Remote Working',
        description: 'You know how you perform your best. Work from home, coffee shop or anywhere when you feel productive.',
        icon: '💻'
      },
      {
        title: 'Commuter Benefits',
        description: "We're grateful for all the time and energy each team member puts into getting to work every day.",
        icon: '🚗'
      },
      {
        title: 'We give back',
        description: 'We anonymously match any donations to organizations they care about.',
        icon: '❤️'
      }
    ],
    openJobs: [
      {
        id: 1,
        title: 'Social Media Assistant',
        company: 'Stripe',
        location: 'Paris, France',
        type: 'Full Time',
        tags: ['Marketing', 'Design'],
        logo: 'S',
        logoColor: 'bg-green-500 text-white'
      },
      {
        id: 2,
        title: 'Social Media Assistant',
        company: 'Maze',
        location: 'Paris, France',
        type: 'Full Time',
        tags: ['Marketing', 'Design'],
        logo: 'M',
        logoColor: 'bg-[#007BFF] text-white'
      },
      {
        id: 3,
        title: 'Brand Designer',
        company: 'Dropbox',
        location: 'San Francisco, USA',
        type: 'Full Time',
        tags: ['Marketing', 'Design'],
        logo: 'D',
        logoColor: 'bg-[#007BFF] text-white'
      },
      {
        id: 4,
        title: 'Brand Designer',
        company: 'Maze',
        location: 'San Francisco, USA',
        type: 'Full Time',
        tags: ['Marketing', 'Design'],
        logo: 'M',
        logoColor: 'bg-[#007BFF] text-white'
      },
      {
        id: 5,
        title: 'Interactive Developer',
        company: 'Terraform',
        location: 'Hamburg, Germany',
        type: 'Full Time',
        tags: ['Development', 'Design'],
        logo: 'T',
        logoColor: 'bg-[#007BFF] text-white'
      },
      {
        id: 6,
        title: 'Interactive Developer',
        company: 'Udacity',
        location: 'Hamburg, Germany',
        type: 'Full Time',
        tags: ['Development', 'Design'],
        logo: 'U',
        logoColor: 'bg-[#007BFF] text-white'
      },
      {
        id: 7,
        title: 'HR Manager',
        company: 'Packer',
        location: 'Lucern, Switzerland',
        type: 'Full Time',
        tags: ['Management', 'HR'],
        logo: 'P',
        logoColor: 'bg-red-500 text-white'
      },
      {
        id: 8,
        title: 'HR Manager',
        company: 'WebFlow',
        location: 'Lucern, Switzerland',
        type: 'Full Time',
        tags: ['Management', 'HR'],
        logo: 'W',
        logoColor: 'bg-[#007BFF] text-white'
      }
    ]
  };

  const JobCard = ({ job }: { job: any }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#007BFF]/30 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${job.logoColor}`}>
            {job.logo}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors text-sm">
              {job.title}
            </h3>
            <p className="text-xs text-gray-500">{job.company} • {job.location}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-1 mb-3">
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
          {job.type}
        </span>
        {job.tags.map((tag: string, index: number) => (
          <span 
            key={index} 
            className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          2 applied of 10 capacity
        </span>
        <button 
          onClick={() => handleApplyClick(job)}
          className="bg-[#007BFF] text-white px-3 py-1 rounded text-xs font-medium hover:bg-[#0056b3] transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
            {/* Company Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`w-20 h-20 rounded-lg flex items-center justify-center font-bold text-2xl ${company.logoColor}`}>
                  {company.logo}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
                  <a href={company.website} className="text-[#007BFF] hover:text-[#007BFF] text-sm">
                    {company.website}
                  </a>
                </div>
              </div>

              <button 
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isFollowing 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-[#007BFF] text-white hover:bg-[#0056b3]'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>

            {/* Company Stats */}
            <div className="grid grid-cols-4 gap-8 mt-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500">Founded</span>
                </div>
                <p className="font-semibold text-gray-900">{company.founded}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">Employees</span>
                </div>
                <p className="font-semibold text-gray-900">{company.employment}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="text-sm text-gray-500">Location</span>
                </div>
                <p className="font-semibold text-gray-900">{company.locations}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-sm text-gray-500">Industry</span>
                </div>
                <p className="font-semibold text-gray-900">{company.industry}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Company Profile */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Company Profile</h2>
                <p className="text-gray-600 leading-relaxed">{company.description}</p>
              </div>

              {/* Pages */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Pages</h2>
                <div className="flex flex-wrap gap-3">
                  <button className="px-4 py-2 bg-[#007BFF]/10 text-[#007BFF] rounded-lg text-sm font-medium">
                    company-overview
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    facebook.com/Stripe
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    twitter.com/stripe
                  </button>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tech stack</h2>
                <p className="text-gray-600 mb-4">Learn about the technology and tools that Stripe uses.</p>
                <div className="grid grid-cols-3 gap-4">
                  {company.techStack.map((tech, index) => (
                    <div key={index} className={`p-4 rounded-lg text-center ${tech.color}`}>
                      <div className="text-2xl mb-2">{tech.icon}</div>
                      <p className="font-medium text-sm">{tech.name}</p>
                    </div>
                  ))}
                </div>
              </div>


            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact */}
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-900">{company.contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{company.contact.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-900">{company.contact.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Location */}
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Office Location</h3>
                <p className="text-gray-600 mb-4">Stripe offices spread across 20 countries</p>
                <div className="space-y-3">
                  {company.officeLocations.map((location, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <span className="text-2xl">{location.flag}</span>
                      <span className="text-gray-700">{location.country}</span>
                    </div>
                  ))}
                </div>
                <button className="text-[#007BFF] hover:text-[#007BFF] text-sm font-medium mt-4">
                  View countries →
                </button>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Team</h2>
              <button className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
                See all (67)
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid md:grid-cols-5 gap-6">
              {company.team.map((member, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl">
                    {member.avatar}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{member.name}</h3>
                  <p className="text-xs text-gray-500">{member.role}</p>
                  <div className="flex justify-center space-x-2 mt-2">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Perks & Benefits */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Perks & Benefits</h2>
            <p className="text-gray-600 mb-8">This job comes with several perks and benefits</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {company.perks.map((perk, index) => (
                <div key={index} className="bg-white rounded-lg p-6">
                  <div className="w-12 h-12 bg-[#007BFF]/10 rounded-lg flex items-center justify-center text-2xl mb-4">
                    {perk.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{perk.title}</h3>
                  <p className="text-gray-600 text-sm">{perk.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Open Jobs */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Open Jobs</h2>
              <button className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
                Show all jobs
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {company.openJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />

      {/* Job Application Modal */}
      {selectedJob && (
        <JobApplication 
          isOpen={isApplicationOpen}
          onClose={handleCloseApplication}
          job={{
            id: selectedJob.id,
            title: selectedJob.title,
            company: selectedJob.company,
            location: selectedJob.location,
            type: selectedJob.type,
            logo: selectedJob.logo,
            logoColor: selectedJob.logoColor
          }}
        />
      )}
    </>
  );
};

export default CompanyProfile; 