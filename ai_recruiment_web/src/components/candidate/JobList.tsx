import React, { useState } from 'react';
import { JobApplication } from './JobApplication';

interface JobListProps {
  onJobClick?: (jobId: string) => void;
}

export const JobList: React.FC<JobListProps> = ({ onJobClick }) => {
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

  const featuredJobs = [
    {
      id: 1,
      title: 'Email Marketing',
      company: 'Revolut',
      location: 'Madrid, Spain',
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Feature'],
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
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Feature'],
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
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Feature'],
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
      type: 'Full Time',
      tags: ['Design', 'Featured'],
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
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Feature'],
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
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Feature'],
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
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Feature'],
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
      type: 'Full Time',
      tags: ['Marketing', 'Design', 'Featured'],
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

  const JobCard = ({ job, showFeaturedTag = false, onJobClick, onApply }: { 
    job: any, 
    showFeaturedTag?: boolean,
    onJobClick?: (jobId: string) => void,
    onApply?: (job: any) => void
  }) => (
    <div 
      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-[#007BFF]/30 transition-all duration-200 group cursor-pointer relative"
      onClick={() => onJobClick?.(job.id.toString())}
    >
      {/* Heart icon - top right */}
      <button 
        className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      {/* Company logo and job info */}
      <div className="flex items-start space-x-3 mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${job.logoColor}`}>
          {job.logo}
        </div>
        <div className="flex-1 pr-8">
          <h3 className="font-semibold text-gray-900 group-hover:text-[#007BFF] transition-colors mb-1">
            {job.title}
          </h3>
          <p className="text-sm text-gray-600">{job.company}</p>
          <p className="text-sm text-gray-500">{job.location}</p>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`px-3 py-1 text-xs rounded-full font-medium ${getTagColor(job.type)}`}>
          {job.type}
        </span>
        {job.tags.map((tag: string, index: number) => (
          <span key={index} className={`px-3 py-1 text-xs rounded-full font-medium ${getTagColor(tag)}`}>
            {tag}
          </span>
        ))}
        {showFeaturedTag && job.featured && (
          <span className={`px-3 py-1 text-xs rounded-full font-medium ${getTagColor('featured')}`}>
            Featured
          </span>
        )}
      </div>

      {/* Apply section */}
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          {job.applied} applied of {job.capacity} capacity
        </p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onApply?.(job);
          }}
          className="w-full bg-[#007BFF] text-white py-2.5 rounded-lg font-medium hover:bg-[#0056b3] transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured Jobs Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Featured <span className="text-[#007BFF]">jobs</span>
            </h2>
            <button className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
              Show all jobs
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} showFeaturedTag={true} onJobClick={onJobClick} onApply={handleApplyClick} />
            ))}
          </div>
        </div>

        {/* Latest Jobs Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Latest <span className="text-[#007BFF]">jobs open</span>
            </h2>
            <button className="text-[#007BFF] hover:text-[#007BFF] font-medium flex items-center">
              Show all jobs
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {latestJobs.map((job) => (
              <JobCard key={job.id} job={job} onJobClick={onJobClick} onApply={handleApplyClick} />
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
    </div>
  );
};

export default JobList; 