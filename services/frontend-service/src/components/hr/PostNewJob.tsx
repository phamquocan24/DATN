import React, { useState } from 'react';
import { FiBriefcase, FiFileText, FiAward, FiChevronLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import hrApi from '../../services/hrApi';

const Stepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, title: 'Job Information', icon: <FiBriefcase /> },
    { number: 2, title: 'Job Description', icon: <FiFileText /> },
    { number: 3, title: 'Perks & Benefits', icon: <FiAward /> },
  ];

  return (
    <div className="flex items-center w-full mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className={`flex items-center p-4 rounded-lg ${currentStep === step.number ? 'bg-blue-50 border border-blue-200' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= step.number ? 'bg-[#007BFF] text-white' : 'bg-gray-100 text-gray-500'}`}>
              {step.icon}
            </div>
            <div className="ml-4">
                <p className={`text-sm ${currentStep >= step.number ? 'text-[#007BFF]' : 'text-gray-500'}`}>{`Step ${step.number}/${steps.length}`}</p>
                <p className="font-semibold">{step.title}</p>
            </div>
          </div>
          {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-200"></div>}
        </React.Fragment>
      ))}
    </div>
  );
};

const JobInformation = ({ jobData, handleInputChange }: { jobData: any, handleInputChange: (e: any) => void }) => (
    <div className="bg-white p-8 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
        <p className="text-gray-500 mb-6">This information will be displayed publicly.</p>
        
        <div className="grid grid-cols-2 gap-8">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <p className="text-xs text-gray-500 mb-2">Job titles must describe one position.</p>
                <input 
                  type="text" 
                  name="title"
                  value={jobData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Software Engineer" 
                  className="w-full border-gray-300 rounded-lg shadow-sm"
                  required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
                <p className="text-xs text-gray-500 mb-2">Select the type of employment.</p>
                <select 
                  name="employment_type"
                  value={jobData.employment_type}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-lg shadow-sm"
                  required
                >
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="FREELANCE">Freelance</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Type *</label>
                <p className="text-xs text-gray-500 mb-2">Select work arrangement.</p>
                <select 
                  name="work_type"
                  value={jobData.work_type}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-lg shadow-sm"
                  required
                >
                    <option value="ONSITE">Onsite</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level *</label>
                <p className="text-xs text-gray-500 mb-2">Required experience level.</p>
                <select 
                  name="experience_level"
                  value={jobData.experience_level}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-lg shadow-sm"
                  required
                >
                    <option value="ENTRY">Entry Level</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="MIDDLE">Middle</option>
                    <option value="SENIOR">Senior</option>
                    <option value="LEAD">Lead</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <p className="text-xs text-gray-500 mb-2">Job location or "Remote" for remote positions.</p>
                <input 
                  type="text" 
                  name="location"
                  value={jobData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Ho Chi Minh City, Vietnam" 
                  className="w-full border-gray-300 rounded-lg shadow-sm"
                  required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                <p className="text-xs text-gray-500 mb-2">Last date to apply for this position.</p>
                <input 
                  type="date" 
                  name="application_deadline"
                  value={jobData.application_deadline}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-lg shadow-sm"
                  required
                />
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                <p className="text-xs text-gray-500 mb-2">Please specify the estimated salary range for the role. *You can leave this blank.</p>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Currency</label>
                        <select 
                          name="currency"
                          value={jobData.currency}
                          onChange={handleInputChange}
                          className="w-full border-gray-300 rounded-lg shadow-sm"
                        >
                            <option value="VND">VND</option>
                            <option value="USD">USD</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Minimum Salary</label>
                        <input 
                          type="number" 
                          name="salary_min"
                          value={jobData.salary_min}
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full border-gray-300 rounded-lg shadow-sm" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Maximum Salary</label>
                        <input 
                          type="number" 
                          name="salary_max"
                          value={jobData.salary_max}
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full border-gray-300 rounded-lg shadow-sm" 
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const JobDescription = ({ jobData, handleInputChange }: { jobData: any, handleInputChange: (e: any) => void }) => (
    <div className="bg-white p-8 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Job Details</h2>
        <p className="text-gray-500 mb-6">Provide detailed information about the job position.</p>
        
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                <p className="text-xs text-gray-500 mb-2">Provide a comprehensive description of the job role and responsibilities.</p>
                <textarea 
                  rows={6} 
                  name="description"
                  value={jobData.description}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-lg shadow-sm" 
                  placeholder="Describe the job role, main responsibilities, and what the candidate will be working on..."
                  required
                ></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements *</label>
                <p className="text-xs text-gray-500 mb-2">List the essential skills, qualifications, and experience required for this position.</p>
                <textarea 
                  rows={6} 
                  name="requirements"
                  value={jobData.requirements}
                  onChange={handleInputChange}
                  className="w-full border-gray-300 rounded-lg shadow-sm" 
                  placeholder="• 3+ years of experience in software development&#10;• Proficiency in React, Node.js, and TypeScript&#10;• Bachelor's degree in Computer Science or related field&#10;• Strong problem-solving skills..."
                  required
                ></textarea>
            </div>
        </div>
    </div>
);

const PerksAndBenefits = ({ jobData, handleInputChange }: { jobData: any, handleInputChange: (e: any) => void }) => (
    <div className="bg-white p-8 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Perks & Benefits</h2>
        <p className="text-gray-500 mb-6">List out your top perks and benefits to attract candidates.</p>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Benefits *</label>
            <p className="text-xs text-gray-500 mb-2">Encourage more people to apply by sharing the attractive rewards and benefits you offer your employees.</p>
            <textarea 
              rows={8} 
              name="benefits"
              value={jobData.benefits}
              onChange={handleInputChange}
              className="w-full border-gray-300 rounded-lg shadow-sm" 
              placeholder="• Health insurance (Medical, Dental, Vision)&#10;• Competitive salary with performance bonuses&#10;• Flexible working hours and remote work options&#10;• Professional development opportunities&#10;• Paid time off and holidays&#10;• 401(k) retirement plan with company matching&#10;• Team building activities and company events&#10;• Modern office space with free snacks and drinks"
              required
            ></textarea>
        </div>
    </div>
);




const PostNewJob: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    requirements: '',
    benefits: '',
    employment_type: 'FULL_TIME',
    work_type: 'ONSITE',
    salary_min: 0,
    salary_max: 0,
    currency: 'VND',
    experience_level: 'ENTRY',
    location: '',
    application_deadline: '',
    skills: [] as string[],
    // Legacy fields for UI compatibility
    category: '',
    responsibilities: '',
    whoYouAre: '',
    niceToHaves: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJobData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    // Validation
    if (!jobData.title || !jobData.description || !jobData.requirements || !jobData.benefits || !jobData.location || !jobData.application_deadline) {
      setSubmitError('Please fill in all required fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Format the data as per API requirements
      const payload = {
        job_title: jobData.title,
        description: jobData.description,
        requirements: jobData.requirements,
        benefits: jobData.benefits,
        employment_type: jobData.employment_type,
        work_type: jobData.work_type,
        salary_min: Number(jobData.salary_min) || 0,
        salary_max: Number(jobData.salary_max) || 0,
        currency: jobData.currency,
        experience_level: jobData.experience_level,
        location: jobData.location,
        application_deadline: jobData.application_deadline,
      };

      console.log('Creating job with payload:', payload);
      const response = await hrApi.createJob(payload);
      console.log('Job creation response:', response);
      
      if (response.success) {
        alert(`Job "${payload.job_title}" posted successfully!`);
        navigate('/hr/job-management');
      } else {
        throw new Error(response.message || 'Failed to create job');
      }
    } catch (err: any) {
      console.error('Error creating job:', err);
      
      let errorMessage = 'Failed to post job. ';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const validationErrors = err.response.data.errors
          .map((error: any) => `${error.field}: ${error.message}`)
          .join('\n');
        errorMessage += `\nValidation errors:\n${validationErrors}`;
      } else if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please check the details and try again.';
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <JobInformation jobData={jobData} handleInputChange={handleInputChange} />;
      case 2:
        return <JobDescription jobData={jobData} handleInputChange={handleInputChange} />;
      case 3:
        return <PerksAndBenefits jobData={jobData} handleInputChange={handleInputChange} />;
      default:
        return <JobInformation jobData={jobData} handleInputChange={handleInputChange} />;
    }
  };

  return (
    <div className="p-0 text-left">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/hr/job-management')} className="flex items-center text-gray-500 hover:text-gray-700">
          <FiChevronLeft className="w-6 h-6" />
          <span className="text-xl font-bold text-gray-800 ml-2">Post a Job</span>
        </button>
      </div>
      <Stepper currentStep={currentStep} />
      {renderStep()}
      {submitError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm whitespace-pre-line">{submitError}</p>
        </div>
      )}
       
      <div className="flex justify-between mt-8">
         <button 
          onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
          disabled={currentStep === 1}
        >
          Previous
        </button>
        <button 
          onClick={() => {
            if (currentStep === 3) { // Change from 4 to 3 since we're skipping AI test step for now
              handleSubmit();
            } else {
              setCurrentStep(prev => Math.min(prev + 1, 3));
            }
          }}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Posting Job...' : currentStep === 3 ? 'Post Job' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};

export default PostNewJob; 