import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit, FiHeart, FiUmbrella, FiTrendingUp, FiUsers, FiHome, FiTruck, FiGift, FiTrash2, FiToggleLeft, FiToggleRight, FiMoreVertical } from 'react-icons/fi';
import hrApi from '../../services/hrApi';

interface JobData {
  job_id: string;
  title: string;
  description: string;
  requirements: string;
  benefits: string;
  employment_type: string;
  remote_work_option: string;
  salary_min: number;
  salary_max: number;
  currency: string;
  experience_level: string;
  status: string;
  application_deadline: string;
  created_at: string;
  max_applications: number;
  application_count?: number;
  company_name: string;
  logo_url?: string;
  address?: string;
  skills?: string[];
}

const JobDetailsTab: React.FC = () => {
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch job details
  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.action-menu')) {
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) {
        setError('Job ID not found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await hrApi.getJobById(jobId, false); // Don't request stats since applications table doesn't exist
        
        if (response.success && response.data) {
          setJobData(response.data);
        } else {
          setError(response.message || 'Failed to load job details');
        }
      } catch (err: any) {
        console.error('Error fetching job details:', err);
        const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load job details';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  // Handle edit job
  const handleEditJob = () => {
    // TODO: Implement edit job route
    alert('Edit job functionality will be implemented soon');
    // navigate(`/hr/job-management/edit/${jobId}`);
  };

  // Handle delete job
  const handleDeleteJob = async () => {
    if (!jobId || !window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await hrApi.deleteJob(jobId);
      if (response.success) {
        alert('Job deleted successfully');
        navigate('/hr/job-management');
      } else {
        throw new Error(response.message || 'Failed to delete job');
      }
    } catch (err: any) {
      console.error('Error deleting job:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to delete job';
      
      // Check if it's a database column error and provide helpful message
      if (errorMessage.includes('created_by does not exist')) {
        alert('Error: Database schema issue detected. Please contact the system administrator to update the database schema.');
      } else {
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  // Handle status toggle (ACTIVE/INACTIVE)
  const handleStatusToggle = async () => {
    if (!jobId || !jobData) return;

    const newStatus = jobData.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    
    if (!window.confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'activate' : 'deactivate'} this job?`)) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const response = await hrApi.updateJobStatus(jobId, newStatus);
      
      if (response.success) {
        // Update local state
        setJobData(prev => prev ? { ...prev, status: newStatus } : null);
        alert(`Job ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully`);
      } else {
        throw new Error(response.message || 'Failed to update job status');
      }
    } catch (err: any) {
      console.error('Error updating job status:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update job status';
      
      // Check if it's a database column error and provide helpful message
      if (errorMessage.includes('created_by does not exist')) {
        alert('Error: Database schema issue detected. Please contact the system administrator to update the database schema.');
      } else {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'VND') => {
    if (amount === 0) return 'Negotiable';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Get status color and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'bg-green-100 text-green-600', text: 'Active' };
      case 'PENDING':
        return { color: 'bg-yellow-100 text-yellow-600', text: 'Pending Approval' };
      case 'PAUSED':
        return { color: 'bg-blue-100 text-blue-600', text: 'Paused' };
      case 'CLOSED':
        return { color: 'bg-red-100 text-red-600', text: 'Closed' };
      default:
        return { color: 'bg-gray-100 text-gray-600', text: status };
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white text-gray-800 text-left p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading job details...</div>
        </div>
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="bg-white text-gray-800 text-left p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">{error || 'Job not found'}</div>
            <button 
              onClick={() => navigate('/hr/job-management')}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Back to Job Management
            </button>
          </div>
        </div>
      </div>
    );
  }
    
    const perks = [
        { icon: <FiHeart />, title: "Full Healthcare" },
        { icon: <FiUmbrella />, title: "Unlimited Vacation" },
        { icon: <FiTrendingUp />, title: "Skill Development" },
        { icon: <FiUsers />, title: "Team Summits" },
        { icon: <FiHome />, title: "Remote Working" },
        { icon: <FiTruck />, title: "Commuter Benefits" },
        { icon: <FiGift />, title: "We give back" },
    ];

    return (
        <div className="bg-white text-gray-800 text-left">


            {/* Job Header Card (Full Width) */}
            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg mb-8">
                <div className="flex items-center gap-4">
                    {jobData.logo_url ? (
                        <img 
                            src={jobData.logo_url} 
                            alt={jobData.company_name}
                            className="w-12 h-12 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-purple-500 text-white flex items-center justify-center rounded-lg text-2xl font-bold">
                            {jobData.title?.charAt(0)?.toUpperCase() || 'J'}
                        </div>
                    )}
                    <div>
                        <h3 className="text-2xl font-semibold text-gray-900">{jobData.title}</h3>
                        <p className="text-sm text-gray-500">{jobData.company_name}</p>
                    </div>
                </div>

                {/* Action Menu */}
                <div className="relative action-menu">
                    <button 
                        onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                        className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-lg text-sm font-medium hover:bg-blue-50"
                    >
                        <FiMoreVertical /> More Actions
                    </button>
                    
                    {isActionMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                            <button
                                onClick={() => {
                                    handleEditJob();
                                    setIsActionMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <FiEdit className="text-blue-500" /> Edit Job Details
                            </button>
                            
                            <button
                                onClick={() => {
                                    handleStatusToggle();
                                    setIsActionMenuOpen(false);
                                }}
                                disabled={isUpdatingStatus}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
                            >
                                {jobData.status === 'ACTIVE' ? (
                                    <>
                                        <FiToggleRight className="text-orange-500" /> Deactivate Job
                                    </>
                                ) : (
                                    <>
                                        <FiToggleLeft className="text-green-500" /> Activate Job
                                    </>
                                )}
                            </button>
                            
                            <hr className="my-1" />
                            
                            <button
                                onClick={() => {
                                    handleDeleteJob();
                                    setIsActionMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                                <FiTrash2 /> Delete Job
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Grid (Top part) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left/Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Section title="Description">
                        <div className="text-gray-600 whitespace-pre-line">
                            {jobData.description || 'No description provided.'}
                        </div>
                    </Section>

                    <Section title="Requirements">
                        <div className="text-gray-600 whitespace-pre-line">
                            {jobData.requirements || 'No requirements specified.'}
                        </div>
                    </Section>

                    <Section title="Benefits">
                        <div className="text-gray-600 whitespace-pre-line">
                            {jobData.benefits || 'No benefits specified.'}
                        </div>
                    </Section>
                    
                    {jobData.address && (
                        <Section title="Location">
                            <p className="text-gray-600">{jobData.address}</p>
                        </Section>
                    )}
                </div>

                {/* Right Column / Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="About this role">
                        <div className="text-sm">
                            <p>{jobData.application_count || 0} applied <span className="text-gray-500">of {jobData.max_applications || 0} capacity</span></p>
                            <div className="w-full h-2 bg-gray-200 rounded-full my-2">
                                <div 
                                    className="h-full bg-green-500 rounded-full transition-all duration-300" 
                                    style={{ 
                                        width: `${Math.min(100, ((jobData.application_count || 0) / (jobData.max_applications || 1)) * 100)}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                        <InfoRow label="Apply Before" value={formatDate(jobData.application_deadline)} />
                        <InfoRow label="Job Posted On" value={formatDate(jobData.created_at)} />
                        <InfoRow label="Job Type" value={jobData.employment_type?.replace('_', ' ') || 'N/A'} />
                        <InfoRow label="Work Type" value={jobData.remote_work_option || 'N/A'} />
                        <InfoRow label="Experience Level" value={jobData.experience_level || 'N/A'} />
                        <InfoRow 
                            label="Salary" 
                            value={
                                jobData.salary_min && jobData.salary_max 
                                    ? `${formatCurrency(jobData.salary_min, jobData.currency)} - ${formatCurrency(jobData.salary_max, jobData.currency)}`
                                    : 'Negotiable'
                            } 
                        />
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Status</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusInfo(jobData.status).color}`}>
                                {getStatusInfo(jobData.status).text}
                            </span>
                        </div>
                    </InfoCard>
                    
                    {jobData.skills && jobData.skills.length > 0 && (
                        <InfoCard title="Required Skills">
                            <div className="flex flex-wrap gap-2">
                                {jobData.skills.map((skill, index) => (
                                    <span key={index} className="px-3 py-1 bg-gray-100 text-[#007BFF] rounded-md text-sm font-medium">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </InfoCard>
                    )}
                </div>
            </div>

            {/* Divider and Perks section (Full Width) */}
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
        </div>
    );
};

// Helper components
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        {children}
    </div>
);



const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-4 border rounded-lg space-y-4">
        <h4 className="font-semibold">{title}</h4>
        {children}
    </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium">{value}</span>
    </div>
);



export default JobDetailsTab; 