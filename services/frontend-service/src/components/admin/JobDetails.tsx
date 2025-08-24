import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { adminApi } from '../../services/adminApi';

interface JobDetailsProps {
  onBack: () => void;
  jobId?: string;
  onJobUpdate?: () => void; // Callback to refresh job list
}

const JobDetails: React.FC<JobDetailsProps> = ({ onBack, jobId, onJobUpdate }) => {
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatSalary = (min: number, max: number, currency: string) => {
    if (!min && !max) return 'Not specified';
    const curr = currency || 'VND';
    if (min && max) {
      return `${min.toLocaleString()}-${max.toLocaleString()} ${curr}`;
    } else if (min) {
      return `From ${min.toLocaleString()} ${curr}`;
    } else if (max) {
      return `Up to ${max.toLocaleString()} ${curr}`;
    }
    return 'Not specified';
  };

  const formatEmploymentType = (type: string) => {
    if (!type) return 'Not specified';
    const typeMap: { [key: string]: string } = {
      'FULL_TIME': 'Full-Time',
      'PART_TIME': 'Part-Time',
      'CONTRACT': 'Contract',
      'INTERNSHIP': 'Internship',
      'FREELANCE': 'Freelance'
    };
    return typeMap[type.toUpperCase()] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'border-green-500 text-green-500 bg-green-50';
      case 'PENDING': return 'border-yellow-500 text-yellow-500 bg-yellow-50';
      case 'REJECTED': return 'border-red-500 text-red-500 bg-red-50';
      case 'DRAFT': return 'border-gray-500 text-gray-500 bg-gray-50';
      case 'PAUSED': return 'border-orange-500 text-orange-500 bg-orange-50';
      case 'CLOSED': return 'border-purple-500 text-purple-500 bg-purple-50';
      default: return 'border-gray-500 text-gray-500 bg-gray-50';
    }
  };

  const handleApproveJob = () => {
    setApprovalReason('Approved by admin');
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    const jobIdToUse = jobData?.job_id;
    if (!jobIdToUse) return;
    
    try {
      setSubmitting(true);
      await adminApi.approveJob(jobIdToUse, approvalReason || 'Approved by admin');
      
      // Update local job data
      setJobData((prev: any) => ({ ...prev, status: 'ACTIVE' }));
      
      // Call parent callback to refresh job list
      if (onJobUpdate) onJobUpdate();
      
      setShowApprovalModal(false);
      setApprovalReason('');
      
      // Navigate back to job listings
      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (err: any) {
      console.error('Error approving job:', err);
      alert('Failed to approve job: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectJob = () => {
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleConfirmRejection = async () => {
    const jobIdToUse = jobData?.job_id;
    if (!jobIdToUse) return;
    
    if (!rejectionReason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    
    try {
      setSubmitting(true);
      await adminApi.rejectJob(jobIdToUse, rejectionReason);
      
      // Update local job data
      setJobData((prev: any) => ({ ...prev, status: 'REJECTED' }));
      
      // Call parent callback to refresh job list
      if (onJobUpdate) onJobUpdate();
      
      setShowRejectionModal(false);
      setRejectionReason('');
      
      // Navigate back to job listings
      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (err: any) {
      console.error('Error rejecting job:', err);
      alert('Failed to reject job: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) {
        setError('No job ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await adminApi.getJobById(jobId, true); // Include stats
        console.log('JobDetails API response:', response);
        
        // Handle different response structures
        const jobData = response.data || response;
        setJobData(jobData);
      } catch (err: any) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

    if (loading) {
        return (
            <div className="text-left flex items-center justify-center h-64">
                <div className="text-gray-500">Loading job details...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-left">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="text-red-500">{error}</div>
                </div>
            </div>
        );
    }

    if (!jobData) {
        return (
            <div className="text-left">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="text-gray-500">No job data available</div>
                </div>
            </div>
        );
    }

    return (
        <div className="text-left">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{jobData.title}</h2>
                        <p className="text-sm text-gray-500">
                            {jobData.category} • {jobData.employment_type} • 
                            {jobData.application_count} Applications
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(jobData.status)}`}>
                        {jobData.status}
                    </span>
                    
                    {/* Show approve/reject buttons for pending jobs */}
                    {jobData.status?.toUpperCase() === 'PENDING' && (
                        <>
                            <button 
                                onClick={handleApproveJob}
                                className="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-500 bg-green-50 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                            >
                                <FiCheckCircle className="w-4 h-4" /> Approve
                            </button>
                            <button 
                                onClick={handleRejectJob}
                                className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 bg-red-50 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                            >
                                Reject
                </button>
                        </>
                    )}
                    

                </div>
            </div>

            {/* Job Header Card (Full Width) */}
            <div className="flex items-center gap-4 p-4 border rounded-lg mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500 text-white flex items-center justify-center rounded-lg text-2xl font-bold">
                        {jobData?.title?.charAt(0)?.toUpperCase() || 'J'}
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900">{jobData?.title || 'Job Title'}</h3>
                </div>
            </div>

            {/* Main Content Grid (Top part) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left/Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Section title="Description">
                        <div className="text-gray-600 leading-relaxed">
                            {jobData?.description ? (
                                <div 
                                    className="whitespace-pre-line space-y-3"
                                    dangerouslySetInnerHTML={{
                                        __html: jobData.description
                                            .replace(/\n\n/g, '</p><p class="mt-4">')
                                            .replace(/\n/g, '<br/>')
                                            .replace(/^/, '<p>')
                                            .replace(/$/, '</p>')
                                            .replace(/- /g, '• ')
                                    }}
                                />
                            ) : (
                                <p className="text-gray-400 italic">No description available.</p>
                            )}
                        </div>
                    </Section>

                    {jobData?.responsibilities && (
                    <Section title="Responsibilities">
                            <div className="text-gray-600 leading-relaxed">
                                <div 
                                    className="whitespace-pre-line space-y-2"
                                    dangerouslySetInnerHTML={{
                                        __html: jobData.responsibilities
                                            .replace(/\n\n/g, '</p><p class="mt-3">')
                                            .replace(/\n/g, '<br/>')
                                            .replace(/^/, '<p>')
                                            .replace(/$/, '</p>')
                                            .replace(/- /g, '• ')
                                            .replace(/\* /g, '• ')
                                    }}
                                />
                            </div>
                    </Section>
                    )}

                    {jobData?.requirements && (
                        <Section title="Requirements">
                            <div className="text-gray-600 leading-relaxed">
                                <div 
                                    className="whitespace-pre-line space-y-2"
                                    dangerouslySetInnerHTML={{
                                        __html: jobData.requirements
                                            .replace(/\n\n/g, '</p><p class="mt-3">')
                                            .replace(/\n/g, '<br/>')
                                            .replace(/^/, '<p>')
                                            .replace(/$/, '</p>')
                                            .replace(/- /g, '• ')
                                            .replace(/\* /g, '• ')
                                    }}
                                />
                            </div>
                    </Section>
                    )}
                    
                    {jobData?.benefits && (
                        <Section title="Benefits">
                            <div className="text-gray-600 leading-relaxed">
                                <div 
                                    className="whitespace-pre-line space-y-2"
                                    dangerouslySetInnerHTML={{
                                        __html: jobData.benefits
                                            .replace(/\n\n/g, '</p><p class="mt-3">')
                                            .replace(/\n/g, '<br/>')
                                            .replace(/^/, '<p>')
                                            .replace(/$/, '</p>')
                                            .replace(/- /g, '• ')
                                            .replace(/\* /g, '• ')
                                    }}
                                />
                            </div>
                    </Section>
                    )}
                </div>

                {/* Right Column / Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="About this role">
                        {jobData?.statistics && (
                        <div className="text-sm">
                                <p>{jobData.statistics.total_applications || 0} applied <span className="text-gray-500">of {jobData.max_applications || 'unlimited'} capacity</span></p>
                            <div className="w-full h-2 bg-gray-200 rounded-full my-2">
                                    <div 
                                        className="h-full bg-green-500 rounded-full" 
                                        style={{ 
                                            width: jobData.max_applications 
                                                ? `${Math.min(100, (jobData.statistics.total_applications / jobData.max_applications) * 100)}%`
                                                : '0%'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        <InfoRow label="Apply Before" value={formatDate(jobData?.application_deadline)} />
                        <InfoRow label="Job Posted On" value={formatDate(jobData?.created_at)} />
                        <InfoRow label="Job Type" value={formatEmploymentType(jobData?.employment_type)} />
                        <InfoRow label="Salary" value={formatSalary(jobData?.salary_min, jobData?.salary_max, jobData?.currency)} />
                        {jobData?.company_name && (
                            <InfoRow label="Company" value={jobData.company_name} />
                        )}
                        {jobData?.city_name && (
                            <InfoRow label="Location" value={`${jobData.city_name}${jobData.district_name ? `, ${jobData.district_name}` : ''}`} />
                        )}
                    </InfoCard>
                    

                    {jobData?.required_skills && jobData.required_skills.length > 0 && (
                    <InfoCard title="Required Skills">
                        <div className="flex flex-wrap gap-2">
                                {jobData.required_skills.map((skill: any, index: number) => (
                                    <span 
                                        key={skill.skill_id || index} 
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            skill.is_required 
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                                        }`}
                                    >
                                        {skill.skill_name}
                                        {skill.is_required && ' *'}
                                    </span>
                            ))}
                        </div>
                    </InfoCard>
                    )}
                </div>
            </div>

            {/* Additional Info */}
            {(jobData?.work_arrangement || jobData?.education_requirements || jobData?.language_requirements) && (
            <div className="border-t border-gray-200 mt-8 pt-8">
                    <Section title="Additional Requirements">
                        <div className="space-y-4">
                            {jobData?.work_arrangement && (
                                <div>
                                    <h4 className="font-medium text-gray-900">Work Arrangement</h4>
                                    <p className="text-gray-600">{jobData.work_arrangement}</p>
                                </div>
                            )}
                            {jobData?.education_requirements && (
                                <div>
                                    <h4 className="font-medium text-gray-900">Education Requirements</h4>
                                    <p className="text-gray-600">{jobData.education_requirements}</p>
                                </div>
                            )}
                            {jobData?.language_requirements && (
                                <div>
                                    <h4 className="font-medium text-gray-900">Language Requirements</h4>
                                    <p className="text-gray-600">{jobData.language_requirements}</p>
                            </div>
                            )}
                    </div>
                </Section>
            </div>
            )}

            {/* Approval Modal */}
            {showApprovalModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">Approve Job</h3>
                        <p className="text-gray-600 mb-4">Please provide a reason for approving this job posting.</p>
                        
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                            rows={4}
                            placeholder="Enter approval reason (optional)"
                            value={approvalReason}
                            onChange={(e) => setApprovalReason(e.target.value)}
                        />
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowApprovalModal(false);
                                    setApprovalReason('');
                                }}
                                disabled={submitting}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmApproval}
                                disabled={submitting}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Approving...
                                    </>
                                ) : (
                                    <>
                                        <FiCheckCircle className="w-4 h-4" />
                                        Approve Job
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">Reject Job</h3>
                        <p className="text-gray-600 mb-4">Please provide a reason for rejecting this job posting. This is required.</p>
                        
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                            rows={4}
                            placeholder="Enter rejection reason (required)"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                        
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowRejectionModal(false);
                                    setRejectionReason('');
                                }}
                                disabled={submitting}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRejection}
                                disabled={submitting || !rejectionReason.trim()}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Rejecting...
                                    </>
                                ) : (
                                    'Reject Job'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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

export default JobDetails; 