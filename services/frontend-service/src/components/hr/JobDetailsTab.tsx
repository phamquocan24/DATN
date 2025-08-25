import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiEdit, FiSave, FiX } from 'react-icons/fi';
import hrApi from '../../services/hrApi';

interface JobDetails {
  job_id: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  benefits: string;
  employment_type: string;
  experience_level: string;
  education_level: string;
  salary_min: number;
  salary_max: number;
  location: string;
  address: string;
  status: string;
  application_deadline: string;
  remote_work_option: string;
  application_count: number;
  max_applications?: number;
  company_name: string;
  created_at: string;
}

const JobDetailsTab: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    
    const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedJob, setEditedJob] = useState<Partial<JobDetails>>({});
    const [saving, setSaving] = useState(false);
    


    // Fetch job details
    const fetchJobDetails = async () => {
        if (!id) return;
        
        try {
            setLoading(true);
            setError(null);
            const response = await hrApi.getJobById(id);
            const jobData = response.data || response;
            
            console.log('Job Details API Response:', jobData);
            console.log('Application count:', jobData.application_count);
            console.log('Max applications:', jobData.max_applications);
            console.log('Remote work option:', jobData.remote_work_option);
            console.log('Address:', jobData.address);
            console.log('Employment type:', jobData.employment_type);
            
            setJobDetails(jobData);
            setEditedJob(jobData);
        } catch (err: any) {
            console.error('Error fetching job details:', err);
            setError('Failed to load job details');
        } finally {
            setLoading(false);
        }
    };

    // Update job details
    const handleUpdateJob = async () => {
        if (!id || !editedJob) return;
        
        try {
            setSaving(true);
            
            // Clean up the data before sending - map to backend field names and filter out undefined values
            const updateData: any = {};
            
            // Map frontend fields to backend validation schema field names
            if (editedJob.title) updateData.job_title = editedJob.title;
            if (editedJob.description) updateData.job_description = editedJob.description;
            if (editedJob.requirements) updateData.job_requirements = editedJob.requirements;
            if (editedJob.responsibilities) updateData.job_responsibilities = editedJob.responsibilities;
            if (editedJob.benefits) updateData.job_benefits = editedJob.benefits;
            if (editedJob.employment_type) updateData.employment_type = editedJob.employment_type;
            if (editedJob.salary_min !== undefined) updateData.salary_min = editedJob.salary_min;
            if (editedJob.salary_max !== undefined) updateData.salary_max = editedJob.salary_max;
            if (editedJob.address) updateData.work_location = editedJob.address;
            if (editedJob.application_deadline) updateData.deadline = editedJob.application_deadline;
            if (editedJob.remote_work_option) updateData.work_type = editedJob.remote_work_option;
            
            console.log('Sending update data:', updateData);
            
            await hrApi.updateJob(id, updateData);
            
            // Refresh job details
            await fetchJobDetails();
            setIsEditing(false);
        } catch (err: any) {
            console.error('Error updating job:', err);
            setError('Failed to update job details');
        } finally {
            setSaving(false);
        }
    };

    // Handle edit field change
    const handleFieldChange = (field: keyof JobDetails, value: string | number) => {
        setEditedJob(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedJob(jobDetails || {});
    };

    // Fetch data on mount
    useEffect(() => {
        fetchJobDetails();
    }, [id]);

    if (loading) {
        return (
            <div className="bg-white text-gray-800 text-left p-6">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007BFF]"></div>
                </div>
            </div>
        );
    }

    if (error) {
    return (
            <div className="bg-white text-gray-800 text-left p-6">
                <div className="text-center text-red-600">
                    <p className="text-lg font-semibold">Error</p>
                    <p>{error}</p>
                    <button 
                        onClick={fetchJobDetails}
                        className="mt-4 px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3]"
                    >
                        Retry
                    </button>
                </div>
                    </div>
        );
    }

    if (!jobDetails) {
        return (
            <div className="bg-white text-gray-800 text-left p-6">
                <div className="text-center text-gray-600">
                    <p>Job not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white text-gray-800 text-left">


            {/* Job Header Card (Full Width) */}
            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-500 text-white flex items-center justify-center rounded-lg text-2xl font-bold">
                        {jobDetails.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedJob.title || ''}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                className="text-2xl font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 min-w-[300px]"
                                placeholder="Job Title"
                            />
                        ) : (
                            <h3 className="text-2xl font-semibold text-gray-900">{jobDetails.title}</h3>
                        )}
                        <p className="text-sm mt-1">
                            <span className={`font-medium ${
                                jobDetails.employment_type === 'FULL_TIME' ? 'text-blue-600' :
                                jobDetails.employment_type === 'PART_TIME' ? 'text-green-600' :
                                jobDetails.employment_type === 'CONTRACT' ? 'text-purple-600' :
                                jobDetails.employment_type === 'INTERNSHIP' ? 'text-orange-600' :
                                'text-gray-600'
                            }`}>
                                {jobDetails.employment_type}
                            </span>
                            <span className="text-gray-500 ml-4">
                                {(jobDetails.application_count || 0) > 0 ? `• ${jobDetails.application_count} Applied` : ''}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        jobDetails.status === 'ACTIVE' ? 'bg-green-100 text-green-600' :
                        jobDetails.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-600' :
                        jobDetails.status === 'PAUSED' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                    }`}>
                        {jobDetails.status}
                    </span>
                    
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleCancelEdit}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
                            >
                                <FiX /> Cancel
                            </button>
                            <button 
                                onClick={handleUpdateJob}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-[#007BFF] text-white rounded-lg text-sm font-medium hover:bg-[#0056b3] disabled:opacity-50"
                            >
                                <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-lg text-sm font-medium hover:bg-blue-50"
                        >
                    <FiEdit /> Edit Job Details
                </button>
                    )}
                </div>
            </div>

            {/* Main Content Grid (Top part) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left/Main Column */}
                <div className="lg:col-span-2 space-y-8">
                    <Section title="Description">
                        {isEditing ? (
                            <textarea
                                value={editedJob.description || ''}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
                                placeholder="Job description..."
                            />
                        ) : (
                            <p className="text-gray-600 whitespace-pre-line">{jobDetails.description}</p>
                        )}
                    </Section>

                    <Section title="Responsibilities">
                        {isEditing ? (
                            <textarea
                                value={editedJob.responsibilities || ''}
                                onChange={(e) => handleFieldChange('responsibilities', e.target.value)}
                                className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
                                placeholder="Job responsibilities (one per line)..."
                            />
                        ) : (
                            <div className="text-gray-600 whitespace-pre-line">{jobDetails.responsibilities}</div>
                        )}
                    </Section>

                    <Section title="Requirements">
                        {isEditing ? (
                            <textarea
                                value={editedJob.requirements || ''}
                                onChange={(e) => handleFieldChange('requirements', e.target.value)}
                                className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
                                placeholder="Job requirements (one per line)..."
                            />
                        ) : (
                            <div className="text-gray-600 whitespace-pre-line">{jobDetails.requirements}</div>
                        )}
                    </Section>
                    
                    <Section title="Benefits">
                        {isEditing ? (
                            <textarea
                                value={editedJob.benefits || ''}
                                onChange={(e) => handleFieldChange('benefits', e.target.value)}
                                className="w-full h-32 border border-gray-300 rounded-lg px-3 py-2 text-gray-600"
                                placeholder="Job benefits (one per line)..."
                            />
                        ) : (
                            <div className="text-gray-600 whitespace-pre-line">{jobDetails.benefits}</div>
                        )}
                    </Section>
                </div>

                {/* Right Column / Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <InfoCard title="About this role">
                        <div className="text-sm">
                            <p>{jobDetails.application_count || 0} applied <span className="text-gray-500">of {jobDetails.max_applications || 1} capacity</span></p>
                            <div className="w-full h-2 bg-gray-200 rounded-full my-2">
                                <div 
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ 
                                        width: `${Math.min(100, ((jobDetails.application_count || 0) / (jobDetails.max_applications || 1)) * 100)}%` 
                                    }}
                                ></div>
                            </div>
                        </div>
                        <InfoRow 
                            label="Apply Before" 
                            value={new Date(jobDetails.application_deadline).toLocaleDateString()} 
                        />
                        <InfoRow 
                            label="Job Posted On" 
                            value={new Date(jobDetails.created_at).toLocaleDateString()} 
                        />
                        <InfoRow 
                            label="Job Type" 
                            value={jobDetails.employment_type} 
                        />
                        <InfoRow 
                            label="Salary" 
                            value={
                                isEditing ? (
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={editedJob.salary_min || ''}
                                            onChange={(e) => handleFieldChange('salary_min', Number(e.target.value))}
                                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                        />
                                        <span>-</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={editedJob.salary_max || ''}
                                            onChange={(e) => handleFieldChange('salary_max', Number(e.target.value))}
                                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                        />
                                    </div>
                                ) : (
                                    `$${jobDetails.salary_min?.toLocaleString() || 'N/A'} - $${jobDetails.salary_max?.toLocaleString() || 'N/A'}`
                                )
                            } 
                        />
                        <InfoRow 
                            label="Experience" 
                            value={
                                isEditing ? (
                                    <select
                                        value={editedJob.experience_level || ''}
                                        onChange={(e) => handleFieldChange('experience_level', e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    >
                                        <option value="">Select Level</option>
                                        <option value="ENTRY">Entry Level</option>
                                        <option value="JUNIOR">Junior Level</option>
                                        <option value="MIDDLE">Middle Level</option>
                                        <option value="SENIOR">Senior Level</option>
                                        <option value="LEAD">Lead Level</option>
                                        <option value="MANAGER">Manager Level</option>
                                        <option value="DIRECTOR">Director Level</option>
                                    </select>
                                ) : (
                                    jobDetails.experience_level
                                )
                            } 
                        />
                        <InfoRow 
                            label="Education" 
                            value={
                                isEditing ? (
                                    <select
                                        value={editedJob.education_level || ''}
                                        onChange={(e) => handleFieldChange('education_level', e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    >
                                        <option value="">Select Level</option>
                                        <option value="HIGH_SCHOOL">High School</option>
                                        <option value="COLLEGE">College</option>
                                        <option value="BACHELOR">Bachelor's Degree</option>
                                        <option value="MASTER">Master's Degree</option>
                                        <option value="PHD">PhD</option>
                                    </select>
                                ) : (
                                    jobDetails.education_level
                                )
                            } 
                        />
                        <InfoRow 
                            label="Location" 
                            value={
                                isEditing ? (
                                    <input
                                        type="text"
                                        value={editedJob.address || ''}
                                        onChange={(e) => handleFieldChange('address', e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                                        placeholder="Job address"
                                    />
                                ) : (
                                    jobDetails.address || 'Not specified'
                                )
                            } 
                        />
                    </InfoCard>
                    
                    <InfoCard title="Job Information">
                        <InfoRow 
                            label="Employment Type" 
                            value={
                                isEditing ? (
                                    <select
                                        value={editedJob.employment_type || ''}
                                        onChange={(e) => handleFieldChange('employment_type', e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="FULL_TIME">Full Time</option>
                                        <option value="PART_TIME">Part Time</option>
                                        <option value="CONTRACT">Contract</option>
                                        <option value="INTERNSHIP">Internship</option>
                                        <option value="FREELANCE">Freelance</option>
                                    </select>
                                ) : (
                                    jobDetails.employment_type
                                )
                            } 
                        />
                        <InfoRow 
                            label="Work Arrangement" 
                            value={
                                isEditing ? (
                                    <select
                                        value={editedJob.remote_work_option || ''}
                                        onChange={(e) => handleFieldChange('remote_work_option', e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    >
                                        <option value="">Select work arrangement</option>
                                        <option value="ONSITE">Onsite</option>
                                        <option value="REMOTE">Remote</option>
                                        <option value="HYBRID">Hybrid</option>
                                    </select>
                                ) : (
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        jobDetails.remote_work_option === 'ONSITE' ? 'bg-red-100 text-red-700' :
                                        jobDetails.remote_work_option === 'REMOTE' ? 'bg-green-100 text-green-700' :
                                        jobDetails.remote_work_option === 'HYBRID' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {jobDetails.remote_work_option || 'Not specified'}
                                    </span>
                                )
                            } 
                        />
                        <InfoRow 
                            label="Application Deadline" 
                            value={
                                isEditing ? (
                                    <input
                                        type="date"
                                        value={editedJob.application_deadline?.split('T')[0] || ''}
                                        onChange={(e) => handleFieldChange('application_deadline', e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    />
                                ) : (
                                    new Date(jobDetails.application_deadline).toLocaleDateString()
                                )
                            } 
                        />
                    </InfoCard>
                </div>
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

const InfoRow: React.FC<{ label: string; value: string | number | React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium">{value}</span>
    </div>
);

export default JobDetailsTab; 