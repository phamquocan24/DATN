import React, { useState, useEffect } from 'react';
import { JobApplication } from './JobApplication';
import candidateApi from '../../services/candidateApi';

interface JobListProps {
  onJobClick?: (jobId: string) => void;
  onFindJobsClick: () => void;
}

export const JobList: React.FC<JobListProps> = ({ onJobClick, onFindJobsClick }) => {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [latestJobs, setLatestJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // Use correct API endpoints - try getFeaturedJobs for featured jobs  
        const [allJobsResponse, latestJobsResponse] = await Promise.all([
          candidateApi.getFeaturedJobs().catch(() => candidateApi.getAllJobs()),
          candidateApi.getLatestJobs().catch(() => candidateApi.getAllJobs())
        ]);

        // Handle different API response structures
        const allJobsArray = Array.isArray(allJobsResponse) 
          ? allJobsResponse 
          : (allJobsResponse?.data || allJobsResponse?.jobs || []);
          
        const latestJobsArray = Array.isArray(latestJobsResponse) 
          ? latestJobsResponse 
          : (latestJobsResponse?.data || latestJobsResponse?.jobs || []);

        // Transform API data to match component interface
        const transformJob = (job: any, index: number) => ({
          id: job.id || job._id,
          title: job.title || 'Job Title',
          company: job.company?.name || job.companyName || 'Company',
          location: job.location || 'Location',
          type: job.type || job.jobType || 'Full Time',
          description: job.description || 'Job description not available.',
          tags: job.skills?.slice(0, 3) || job.tags?.slice(0, 3) || ['Business'],
          logo: (job.company?.name || job.companyName || job.title || 'C').charAt(0).toUpperCase(),
          logoColor: `bg-${['blue', 'green', 'purple', 'red', 'teal', 'orange'][index % 6]}-500 text-white`,
          applied: job.applicationsCount || job.applied || 0,
          capacity: job.openPositions || job.capacity || 1
        });

        // Use first 4 jobs as featured (or could be jobs with featured flag)
        const featuredJobsData = allJobsArray.slice(0, 4).map(transformJob);
        const latestJobsData = latestJobsArray.slice(0, 6).map(transformJob);

        setFeaturedJobs(featuredJobsData);
        setLatestJobs(latestJobsData);
        setError(null);
      } catch (err) {
        setError('Failed to load job listings.');
        console.error('Error fetching jobs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleApplyClick = (job: any) => {
    onJobClick?.(job.id.toString());
  };

  const handleCloseApplication = () => {
    setIsApplicationOpen(false);
    setSelectedJob(null);
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-white text-center">
        <svg className="animate-spin h-8 w-8 text-[#007BFF] mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-gray-600">Loading Jobs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 bg-red-50 text-center">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );
  }

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
      // TODO: Implement API call to add/remove from favorites
      console.log(`${isFavorited ? 'Removing' : 'Adding'} job ${job.id} to favorites`);
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
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-lg transition-colors ${
              isFavorited 
                ? 'text-red-500 hover:bg-red-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </button>
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
        <div className="flex items-center space-x-2">
          <button
            onClick={handleFavoriteClick}
            className={`p-2 rounded-lg transition-colors ${
              isFavorited 
                ? 'text-red-500 hover:bg-red-50' 
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </button>
          <span className={`px-3 py-1 text-xs rounded-full font-medium border border-[#007BFF] text-[#007BFF]`}>
            {job.type}
          </span>
        </div>
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