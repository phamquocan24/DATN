import React, { useState } from 'react';
import { FiBriefcase, FiFileText, FiAward, FiClipboard, FiChevronLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Stepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, title: 'Job Information', icon: <FiBriefcase /> },
    { number: 2, title: 'Job Description', icon: <FiFileText /> },
    { number: 3, title: 'Perks & Benefit', icon: <FiAward /> },
    { number: 4, title: 'Mini-test', icon: <FiClipboard /> },
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

const JobInformation = () => (
    <div className="bg-white p-8 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
        <p className="text-gray-500 mb-6">This information will be displayed publicly.</p>
        
        <div className="grid grid-cols-2 gap-8">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <p className="text-xs text-gray-500 mb-2">Job titles must be describe one position.</p>
                <input type="text" placeholder="e.g. Software Engineer" className="w-full border-gray-300 rounded-lg shadow-sm" />
                <p className="text-xs text-gray-500 mt-1 text-right">At least 80 characters</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of Employment</label>
                <p className="text-xs text-gray-500 mb-2">You can select multiple type of employment.</p>
                <div className="space-y-2">
                    {['Full-Time', 'Part-Time', 'Remote', 'Internship', 'Contract'].map(type => (
                        <div key={type} className="flex items-center">
                            <input type="checkbox" id={type} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                            <label htmlFor={type} className="ml-2 block text-sm text-gray-900">{type}</label>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                <p className="text-xs text-gray-500 mb-2">Please specify the estimated salary range for the role. *You can leave this blank.</p>
                <div className="flex items-center gap-4">
                    <span>$</span>
                    <input type="text" defaultValue="5,000" className="w-full border-gray-300 rounded-lg shadow-sm" />
                    <span>to</span>
                    <input type="text" defaultValue="22,000" className="w-full border-gray-300 rounded-lg shadow-sm" />
                </div>
                {/* Placeholder for range slider */}
                <div className="relative h-5 mt-2">
                    <div className="absolute w-full h-1 bg-gray-200 rounded-full top-1/2 -translate-y-1/2"></div>
                    <div className="absolute h-1 bg-blue-500 rounded-full top-1/2 -translate-y-1/2" style={{ left: '10%', width: '50%' }}></div>
                    <div className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full top-1/2 -translate-y-1/2" style={{ left: '10%' }}></div>
                    <div className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full top-1/2 -translate-y-1/2" style={{ left: '60%' }}></div>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                <p className="text-xs text-gray-500 mb-2">You can select multiple job categories.</p>
                <select className="w-full border-gray-300 rounded-lg shadow-sm">
                    <option>Select Job Categories</option>
                </select>
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                 <p className="text-xs text-gray-500 mb-2">Add required skills for the job.</p>
                 <div className="flex flex-wrap items-center gap-2 p-2 border rounded-lg">
                     <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                         <span>Graphic Design</span>
                         <button>x</button>
                     </div>
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                         <span>Communication</span>
                         <button>x</button>
                     </div>
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                         <span>Illustrator</span>
                         <button>x</button>
                     </div>
                     <button className="text-blue-500 ml-2">+ Add Skills</button>
                 </div>
            </div>
        </div>
    </div>
);

const JobDescription = () => (
    <div className="bg-white p-8 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Details</h2>
        <p className="text-gray-500 mb-6">Add the description of the job, responsibilities, who you are, and nice-to-haves.</p>
        
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Descriptions</label>
                <p className="text-xs text-gray-500 mb-2">Job titles must be describe one position</p>
                <textarea rows={5} className="w-full border-gray-300 rounded-lg shadow-sm" placeholder="Enter job description"></textarea>
                <p className="text-xs text-gray-500 mt-1 text-right">Maximum 500 characters</p>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
                <p className="text-xs text-gray-500 mb-2">Outline the core responsibilities of the position</p>
                <textarea rows={5} className="w-full border-gray-300 rounded-lg shadow-sm" placeholder="Enter responsibilities"></textarea>
                <p className="text-xs text-gray-500 mt-1 text-right">Maximum 500 characters</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Who You Are</label>
                <p className="text-xs text-gray-500 mb-2">Add your preferred candidates qualifications</p>
                <textarea rows={5} className="w-full border-gray-300 rounded-lg shadow-sm" placeholder="Enter qualifications"></textarea>
                <p className="text-xs text-gray-500 mt-1 text-right">Maximum 500 characters</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nice-To-Haves</label>
                <p className="text-xs text-gray-500 mb-2">Add nice-to-have skills and qualifications for the role to encourage a more diverse set of candidates to apply</p>
                <textarea rows={5} className="w-full border-gray-300 rounded-lg shadow-sm" placeholder="Enter nice-to-haves"></textarea>
                <p className="text-xs text-gray-500 mt-1 text-right">Maximum 500 characters</p>
            </div>
        </div>
    </div>
);

const PerksAndBenefits = () => (
    <div className="bg-white p-8 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
        <p className="text-gray-500 mb-6">List out your top perks and benefits.</p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Perks and Benefits</label>
        <p className="text-xs text-gray-500 mb-2">Encourage more people to apply by sharing the attractive rewards and benefits you offer your employees.</p>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="border p-4 rounded-lg">Full Healthcare...</div>
            <div className="border p-4 rounded-lg">Unlimited Vacation...</div>
            <div className="border p-4 rounded-lg">Skill Development...</div>
        </div>
        <button className="text-blue-500">+ Add Benefit</button>
    </div>
);

const AiTestGeneration = () => (
    <div className="bg-white p-8 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">AI-Powered Test Generation</h2>
        <p className="text-gray-500 mb-6">Describe your requirements and let AI create the perfect assessment.</p>

        <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Title</label>
                <input type="text" placeholder="e.g. Frontend Developer Assessment" className="w-full border-gray-300 rounded-lg shadow-sm" />
                <p className="text-xs text-gray-500 mt-1 text-right">Maximum 500 characters</p>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Role/Position</label>
                <select className="w-full border-gray-300 rounded-lg shadow-sm">
                    <option>Intern</option>
                    <option>Fresher</option>
                    <option>Middle</option>
                    <option>Junior</option>
                    <option>Senior</option>
                </select>
                <p className="text-xs text-gray-500 mt-1 text-right">Maximum 500 characters</p>
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Description</label>
                <textarea rows={4} className="w-full border-gray-300 rounded-lg shadow-sm" placeholder="Describe your requirements and let AI create the perfect assessment."></textarea>
                <p className="text-xs text-gray-500 mt-1 text-right">Maximum 500 characters</p>
            </div>
             <div className="grid grid-cols-3 gap-4 col-span-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                    <input type="number" defaultValue="31" className="w-full border-gray-300 rounded-lg shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
                    <input type="number" defaultValue="31" className="w-full border-gray-300 rounded-lg shadow-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                    <input type="number" defaultValue="31" className="w-full border-gray-300 rounded-lg shadow-sm" />
                </div>
            </div>
        </div>
        <button className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 mb-6">Generate test with AI</button>
        
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add files test</label>
            <p className="text-xs text-gray-500 mb-2">This image will be shown publicly as company logo.</p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">Click to replace or drag and drop</p>
                <p className="text-xs text-gray-400">SVG, PNG, JPG or GIF (max. 400 x 400px)</p>
            </div>
        </div>
    </div>
);


const PostNewJob: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <JobInformation />;
      case 2:
        return <JobDescription />;
      case 3:
        return <PerksAndBenefits />;
      case 4:
        return <AiTestGeneration />;
      default:
        return <JobInformation />;
    }
  };

  return (
    <div className="p-0 text-left">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate('/hr/test-management')} className="flex items-center text-gray-500 hover:text-gray-700">
          <FiChevronLeft className="w-6 h-6" />
          <span className="text-xl font-bold text-gray-800 ml-2">Post a Job</span>
        </button>
      </div>
      <Stepper currentStep={currentStep} />
      {renderStep()}
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
            if (currentStep === 4) {
              // Handle completion
            } else {
              setCurrentStep(prev => Math.min(prev + 1, 4));
            }
          }}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          {currentStep === 4 ? 'Complete' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};

export default PostNewJob; 