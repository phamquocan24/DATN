import React, { useState } from 'react';
import { FiArrowLeft, FiCheckCircle, FiHeart, FiUmbrella, FiTrendingUp, FiUsers, FiHome, FiTruck, FiGift, FiArrowRight, FiShare2, FiEye } from 'react-icons/fi';
import JobApplication from './JobApplication';
import nomadLogo from '../../assets/Nomad.png'; 
import work1 from '../../assets/work1.png';
import work2 from '../../assets/work2.png';
import work3 from '../../assets/work3.png';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  tags: string[];
  logo: string;
  logoColor: string;
  match: number;
  applied: number;
  capacity: number;
  salary?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  whoYouAre?: string[];
  niceToHaves?: string[];
}

interface SimilarJob {
    id: number;
    title: string;
    company: string;
    location: string;
    tags: string[];
    logo: string;
    logoColor: string;
}

interface JobDetailProps {
  job: Job;
  onBack: () => void;
  applicationStatus?: 'In Review' | 'Hired' | 'Mini-test' | 'Interviewing' | 'Rejected';
}


const JobDetail: React.FC<JobDetailProps> = ({ job, onBack, applicationStatus }) => {
    const [isApplicationOpen, setIsApplicationOpen] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);

    const handleApplyClick = () => {
      setIsApplicationOpen(true);
    };
  
    const handleCloseApplication = () => {
      setIsApplicationOpen(false);
    };

    const handleFavoriteClick = () => {
        setIsFavorited(!isFavorited);
    };

    const perks = [
        { icon: <FiHeart />, title: "Full Healthcare" },
        { icon: <FiUmbrella />, title: "Unlimited Vacation" },
        { icon: <FiTrendingUp />, title: "Skill Development" },
        { icon: <FiUsers />, title: "Team Summits" },
        { icon: <FiHome />, title: "Remote Working" },
        { icon: <FiTruck />, title: "Commuter Benefits" },
        { icon: <FiGift />, title: "We give back" },
    ];

    const getStatusButtonStyle = (status?: string) => {
        switch (status) {
          case 'In Review':
            return 'bg-orange-100 text-orange-700 border border-orange-200 cursor-not-allowed';
          case 'Hired':
            return 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed';
          case 'Mini-test':
            return 'bg-blue-100 text-blue-700 border border-blue-200 cursor-not-allowed';
          case 'Interviewing':
            return 'bg-yellow-100 text-yellow-700 border border-yellow-200 cursor-not-allowed';
          case 'Rejected':
            return 'bg-red-100 text-red-700 border border-red-200 cursor-not-allowed';
          default:
            return 'bg-[#007BFF] text-white hover:bg-[#0056b3] transition-colors';
        }
    };

    const similarJobs: SimilarJob[] = [
        { id: 10, title: 'Social Media Assistant', company: 'Netlify', location: 'Paris, France', tags: ['Full-Time', 'Marketing', 'Design'], logo: 'N', logoColor: 'bg-teal-500' },
        { id: 11, title: 'Brand Designer', company: 'Dropbox', location: 'San Fransisco, USA', tags: ['Full-Time', 'Marketing', 'Design'], logo: 'D', logoColor: 'bg-blue-500' },
        { id: 12, title: 'Interactive Developer', company: 'Terraform', location: 'Hamburg, Germany', tags: ['Full-Time', 'Marketing', 'Design'], logo: 'T', logoColor: 'bg-indigo-500' },
        { id: 13, title: 'HR Manager', company: 'Packer', location: 'Lucern, Switzerland', tags: ['Full-Time', 'Marketing', 'Design'], logo: 'P', logoColor: 'bg-red-500' }
    ];
    

    return (
        <>
            <div className="text-left mb-16">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                        <FiArrowLeft className="w-5 h-5" /> Back to job listings
                    </button>
                </div>

                {/* New Job Header */}
                <div className="border rounded-lg bg-white shadow-sm p-6 mb-8 transition-all duration-300 hover:shadow-lg hover:border-[#007BFF] cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <div className={`w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center rounded-xl text-4xl font-bold`}>
                                {job.logo}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900">{job.title}</h2>
                                <div className="flex items-center gap-3 text-gray-500 mt-2">
                                    <span>{job.company}</span>
                                    <span>&bull;</span>
                                    <span>{job.location}</span>
                                    <span>&bull;</span>
                                    <span>{job.type}</span>
                                    <span>&bull;</span>
                                    <span className="flex items-center gap-1.5"><FiEye /> 1.4k seen</span>
                                    <span>&bull;</span>
                                    <span className="text-green-600">Match: 80%</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="p-3 text-gray-500 hover:text-[#007BFF] transition-colors">
                                <FiShare2 className="w-6 h-6" />
                            </button>
                            <button onClick={handleFavoriteClick} className={`p-3 transition-colors ${isFavorited ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}>
                                <FiHeart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
                            </button>
                            <button 
                                onClick={applicationStatus ? undefined : handleApplyClick}
                                disabled={!!applicationStatus}
                                className={`px-8 py-3 rounded-lg text-lg ${getStatusButtonStyle(applicationStatus)}`}
                            >
                                {applicationStatus || 'Apply'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left/Main Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <Section title="Description">
                            <p className="text-gray-600 leading-relaxed">{job.description || "No description provided."}</p>
                        </Section>

                        <Section title="Responsibilities">
                            <ul className="space-y-2 list-inside">
                                {(job.requirements || []).map((item, index) => <ListItem key={index}>{item}</ListItem>)}
                            </ul>
                        </Section>

                        <Section title="Who You Are">
                            <ul className="space-y-2 list-inside">
                                {(job.whoYouAre || []).map((item, index) => <ListItem key={index}>{item}</ListItem>)}
                            </ul>
                        </Section>
                        
                        <Section title="Nice-To-Haves">
                             <ul className="space-y-2 list-inside">
                                {(job.niceToHaves || []).map((item, index) => <ListItem key={index}>{item}</ListItem>)}
                            </ul>
                        </Section>
                    </div>

                    {/* Right Column / Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <InfoCard title="About this role">
                            <div className="text-sm">
                                <p>{job.applied} applied <span className="text-gray-500">of {job.capacity} capacity</span></p>
                                <div className="w-full h-2 bg-gray-200 rounded-full my-2">
                                    <div style={{width: `${(job.applied/job.capacity)*100}%`}} className="h-full bg-green-500 rounded-full"></div>
                                </div>
                            </div>
                            <InfoRow label="Apply Before" value="July 31, 2021" />
                            <InfoRow label="Job Posted On" value="July 1, 2021" />
                            <InfoRow label="Job Type" value={job.type} />
                            <InfoRow label="Salary" value={job.salary || "$75k-$85k USD"} />
                        </InfoCard>
                        
                        <InfoCard title="Categories">
                            <div className="flex flex-wrap gap-2">
                                {job.tags.map(tag => <Pill key={tag} text={tag} />)}
                            </div>
                        </InfoCard>

                        <InfoCard title="Required Skills">
                            <div className="flex flex-wrap gap-2">
                                {['Project Management', 'Copywriting', 'English', 'Social Media Marketing', 'Copy Editing'].map(skill => (
                                    <span key={skill} className="px-3 py-1 bg-gray-100 text-[#007BFF] rounded-md text-sm font-medium">{skill}</span>
                                ))}
                            </div>
                        </InfoCard>
                    </div>
                </div>

                {/* Divider and Perks section */}
                <div className="border-t border-gray-200 mt-8 pt-8">
                    <Section title="Perks & Benefits">
                        <p className="text-gray-600 mb-6">This job comes with several perks and benefits</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {perks.map(perk => (
                                <div key={perk.title} className="flex items-start text-left gap-4">
                                    <div className="text-blue-500 text-3xl">{perk.icon}</div>
                                    <div>
                                        <h4 className="font-semibold mb-1">{perk.title}</h4>
                                        <p className="text-sm text-gray-600">We believe in thriving communities and that starts with our team being happy and healthy.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>

                {/* About Company Section */}
                <div className="border-t border-gray-200 mt-8 pt-8">
                    <Section title={`About ${job.company}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            <div className="lg:col-span-1 space-y-4">
                                <img src={nomadLogo} alt="Nomad Logo" className="w-16 h-16"/>
                                <a href="#" className="flex items-center gap-2 text-[#007BFF] font-medium hover:underline">
                                    Read more about {job.company} <FiArrowRight />
                                </a>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    {job.company} is a technology company that builds economic infrastructure for the internet. Businesses of every size—from new startups to public companies—use our software to accept payments and manage their businesses online.
                                </p>
                            </div>
                            <div className="lg:col-span-2 flex gap-4 h-80">
                                <div className="w-2/3">
                                    <img src={work1} alt="Office life 1" className="rounded-lg object-cover w-full h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"/>
                                </div>
                                <div className="w-1/3 flex flex-col gap-4">
                                    <img src={work2} alt="Office life 2" className="rounded-lg object-cover w-full h-full flex-1 min-h-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"/>
                                    <img src={work3} alt="Office life 3" className="rounded-lg object-cover w-full h-full flex-1 min-h-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"/>
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Similar Jobs Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[#007BFF] cursor-pointer">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Similar Jobs</h3>
                        <button className="text-[#007BFF] text-sm font-medium flex items-center gap-1 hover:underline">
                            Show all jobs <FiArrowRight/>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {similarJobs.map(sJob => <SimilarJobCard key={sJob.id} job={sJob} />)}
                    </div>
                </div>

                <JobApplication 
                    isOpen={isApplicationOpen}
                    onClose={handleCloseApplication}
                    job={job}
                />
            </div>
        </>
    );
};

const SimilarJobCard: React.FC<{ job: SimilarJob }> = ({ job }) => {
    const getTagStyle = (tag: string) => {
        switch (tag) {
          case 'Full-Time':
            return 'bg-green-100 text-green-700';
          case 'Marketing':
            return 'bg-yellow-100 text-yellow-700';
          case 'Design':
            return 'bg-blue-100 text-blue-700';
          default:
            return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 flex items-start gap-4 hover:bg-gray-50 hover:border-[#007BFF] transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1">
            <div className={`w-12 h-12 ${job.logoColor} text-white flex-shrink-0 flex items-center justify-center rounded-md text-xl font-bold`}>
                {job.logo}
            </div>
            <div className="text-left">
                <h4 className="font-semibold text-gray-900 text-base">{job.title}</h4>
                <p className="text-sm text-gray-500 my-1">{job.company} • {job.location}</p>
                <div className="flex flex-wrap gap-2 text-xs mt-2">
                    {job.tags.map((tag, j) => (
                        <span key={j} className={`px-2 py-1 rounded-full font-medium ${getTagStyle(tag)}`}>
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Helper components
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[#007BFF] cursor-pointer">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
        {children}
    </div>
);

const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start gap-3">
        <FiCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
        <span className="text-gray-700">{children}</span>
    </li>
);

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-6 bg-white border border-gray-200 rounded-lg space-y-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-[#007BFF] cursor-pointer">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        {children}
    </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
    </div>
);

const Pill: React.FC<{ text: string }> = ({ text }) => {
    const colors = {
        'Marketing': 'bg-yellow-100 text-yellow-700',
        'Design': 'bg-green-100 text-green-700'
    };
    const colorClass = colors[text as keyof typeof colors] || 'bg-gray-100 text-gray-700';
    return <span className={`px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}>{text}</span>;
}

export default JobDetail; 