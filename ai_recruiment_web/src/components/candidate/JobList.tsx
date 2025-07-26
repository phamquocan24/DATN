import React, { useState } from 'react';
import { JobApplication } from './JobApplication';

interface JobListProps {
  onJobClick?: (jobId: string) => void;
  onFindJobsClick: () => void;
}

export const JobList: React.FC<JobListProps> = ({ onJobClick, onFindJobsClick }) => {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const handleApplyClick = (job: any) => {
    onJobClick?.(job.id.toString());
  };

  const handleCloseApplication = () => {
    setIsApplicationOpen(false);
    setSelectedJob(null);
  };

  const featuredJobs = [
    {
      id: 1,
      title: 'Email Marketing',
      company: 'Revolut',
      location: 'Madrid, Spain',
      description: 'Revolut is looking for Email Marketing to help team ma ...',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'R',
      logoColor: 'bg-black text-white',
      featured: true,
      applied: 5,
      capacity: 10
    },
    {
      id: 2,
      title: 'Brand Designer',
      company: 'Dropbox',
      location: 'San Francisco, USA',
      description: 'Dropbox is looking for Brand Designer to help team ma ...',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'D',
      logoColor: 'bg-[#007BFF] text-white',
      featured: true,
      applied: 2,
      capacity: 10
    },
    {
      id: 3,
      title: 'Email Marketing',
      company: 'Pitch',
      location: 'Berlin, Germany',
      description: 'Pitch is looking for Email Marketing to help team ma ...',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'P',
      logoColor: 'bg-black text-white',
      featured: true,
      applied: 0,
      capacity: 10
    },
    {
      id: 4,
      title: 'Visual Designer',
      company: 'Blinkist',
      location: 'Granada, Spain',
      description: 'Blinkist is looking for Visual Designer to help team ma ...',
      type: 'Full Time',
      tags: ['Design'],
      logo: 'C',
      logoColor: 'bg-[#007BFF] text-white',
      featured: true,
      applied: 5,
      capacity: 10
    },
    {
      id: 5,
      title: 'Product Designer',
      company: 'ClassPass',
      location: 'Berlin, Germany',
      description: 'ClassPass is looking for Product Designer to help team ma ...',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'C',
      logoColor: 'bg-[#007BFF] text-white',
      featured: true,
      applied: 5,
      capacity: 10
    },
    {
      id: 6,
      title: 'Lead Engineer',
      company: 'Canva',
      location: 'Ankara, Turkey',
      description: 'Canva is looking for Lead Engineer to help team ma ...',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'C',
      logoColor: 'bg-purple-600 text-white',
      featured: true,
      applied: 5,
      capacity: 10
    },
    {
      id: 7,
      title: 'Product Strategist',
      company: 'Twitter',
      location: 'San Diego, USA',
      description: 'Twitter is looking for Product Strategist to help team ma ...',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'T',
      logoColor: 'bg-[#007BFF] text-white',
      featured: true,
      applied: 5,
      capacity: 10
    },
    {
      id: 8,
      title: 'Customer Manager',
      company: 'Pitch',
      location: 'Berlin, Germany',
      description: 'Pitch is looking for Customer Manager to help team ma ...',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'P',
      logoColor: 'bg-black text-white',
      featured: true,
      applied: 5,
      capacity: 10
    }
  ];

  const latestJobs = [
    {
      id: 9,
      title: 'Social Media Assistant',
      company: 'Nomad',
      location: 'Paris, France',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'N',
      logoColor: 'bg-green-500 text-white',
      applied: 5,
      capacity: 10
    },
    {
      id: 10,
      title: 'Social Media Assistant',
      company: 'Netlify',
      location: 'Paris, France',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'N',
      logoColor: 'bg-teal-500 text-white',
      applied: 5,
      capacity: 10
    },
    {
      id: 11,
      title: 'Brand Designer',
      company: 'Dropbox',
      location: 'San Francisco, USA',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'D',
      logoColor: 'bg-[#007BFF] text-white',
      applied: 2,
      capacity: 10
    },
    {
      id: 12,
      title: 'Brand Designer',
      company: 'Maze',
      location: 'San Francisco, USA',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'M',
      logoColor: 'bg-[#007BFF] text-white',
      applied: 2,
      capacity: 10
    },
    {
      id: 13,
      title: 'Interactive Developer',
      company: 'Terraform',
      location: 'Hamburg, Germany',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'T',
      logoColor: 'bg-[#007BFF] text-white',
      applied: 8,
      capacity: 12
    },
    {
      id: 14,
      title: 'Interactive Developer',
      company: 'Udacity',
      location: 'Hamburg, Germany',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'U',
      logoColor: 'bg-[#007BFF] text-white',
      applied: 8,
      capacity: 12
    },
    {
      id: 15,
      title: 'HR Manager',
      company: 'Packer',
      location: 'Lucern, Switzerland',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'P',
      logoColor: 'bg-red-500 text-white',
      applied: 5,
      capacity: 10
    },
    {
      id: 16,
      title: 'HR Manager',
      company: 'Webflow',
      location: 'Lucern, Switzerland',
      type: 'Full Time',
      tags: ['Marketing', 'Design'],
      logo: 'W',
      logoColor: 'bg-[#007BFF] text-white',
      applied: 5,
      capacity: 10
    }
  ];

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'full time':
        return 'bg-green-100 text-green-700';
      case 'marketing':
        return 'bg-orange-100 text-orange-700';
      case 'design':
        return 'bg-yellow-100 text-yellow-700';
      case 'feature':
      case 'featured':
        return 'bg-[#007BFF]/10 text-[#007BFF]';
      case 'business':
        return 'bg-purple-100 text-purple-700';
      case 'technology':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const JobCard = ({ job, cardStyle, onJobClick, onApply }: { 
    job: any, 
    cardStyle: 'featured' | 'latest',
    onJobClick?: (jobId: string) => void,
    onApply?: (job: any) => void
  }) => {
    const [isFavorited, setIsFavorited] = useState(false);

    const handleFavoriteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsFavorited(!isFavorited);
    };

    const latestJobCard = (
      <>
        {/* Apply Button for Latest */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onApply?.(job);
          }}
          className="absolute top-4 right-4 bg-[#007BFF] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#0056b3] transition-colors"
        >
          Apply
        </button>
        {/* Latest Card Content */}
        <div className="flex items-center space-x-4 mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${job.logoColor} flex-shrink-0`}>
            {job.logo}
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors mb-1 truncate">
              {job.title}
            </h3>
            <p className="text-sm text-gray-500">
              {job.company} &bull; {job.location}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6 justify-between items-center">
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 text-xs rounded-full font-medium ${getTagColor(job.type)}`}>
              {job.type}
            </span>
            {job.tags.map((tag: string, index: number) => (
              <span key={index} className={`px-3 py-1 text-xs rounded-full font-medium ${getTagColor(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500 whitespace-nowrap">
            {job.applied} applied of {job.capacity} capacity
          </p>
        </div>
      </>
    );

    const featuredJobCard = (
      <>
        {/* Featured Card Content */}
        <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${job.logoColor}`}>
          {job.logo}
        </div>
        <span className={`px-3 py-1 text-xs rounded-full font-medium border border-[#007BFF] text-[#007BFF]`}>
          {job.type}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 text-left">{job.title}</h3>
      <p className="text-sm text-gray-500 mb-4 text-left">
        {job.company} &bull; {job.location}
      </p>
      <p className="text-sm text-gray-600 mb-4 text-left truncate">
        {job.description}
      </p>
      <div className="flex flex-wrap gap-2 justify-start">
        {job.tags.map((tag: string, index: number) => (
          <span key={index} className={`px-3 py-1 text-xs rounded-full font-medium ${getTagColor(tag)}`}>
            {tag}
          </span>
        ))}
      </div>
      </>
    );

    return (
      <div 
        className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#007BFF] transition-all duration-300 group cursor-pointer relative hover:shadow-lg hover:-translate-y-1"
        onClick={() => onJobClick?.(job.id.toString())}
      >
        {cardStyle === 'latest' ? latestJobCard : featuredJobCard}
      </div>
    );
  };

  return (
    <>
      {/* Featured Jobs Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Featured <span className="text-[#007BFF]">jobs</span>
            </h2>
            <button onClick={onFindJobsClick} className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
              Show all jobs
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} cardStyle="featured" onJobClick={onJobClick} onApply={handleApplyClick} />
            ))}
          </div>
        </div>
      </div>

      {/* Latest Jobs Section */}
      <div 
        className="py-16 bg-gray-50"
        style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 100% 100%, 0 100%, 0 5%)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Latest <span className="text-[#007BFF]">jobs open</span>
            </h2>
            <button onClick={onFindJobsClick} className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
              Show all jobs
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {latestJobs.map((job) => (
              <JobCard key={job.id} job={job} cardStyle="latest" onJobClick={onJobClick} onApply={handleApplyClick} />
            ))}
          </div>
        </div>
      </div>
      
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

export default JobList; 