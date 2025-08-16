import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiCheck, FiFileText, FiThumbsUp, FiThumbsDown, FiAlertCircle } from 'react-icons/fi';
import { IoSparklesOutline } from 'react-icons/io5';
import cvApi from '../../services/cvApi';
// import api from '../../services/api'; // Commented out business service

interface Resume {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  objective: string;
  file?: File;
  extractedData?: any;
  uploadedAt: Date;
}

interface EnhanceResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: Resume;
}

// Interface for future use when parsing AI response
// interface AIEnhancementResult {
//   original_objective: string;
//   enhanced_suggestions: string;
//   improvement_areas: string[];
//   visual_feedback: string;
//   content_feedback: string;
// }

export const EnhanceResumeModal: React.FC<EnhanceResumeModalProps> = ({ isOpen, onClose, resume }) => {
  const [step, setStep] = useState('initial'); // 'initial', 'loading', 'preview', 'final', 'error'
  const [enhancementResult, setEnhancementResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [field, setField] = useState('');

  useEffect(() => {
    // Reset state when the modal is closed or the resume changes
    if (!isOpen) {
      setTimeout(() => {
        setStep('initial');
        setEnhancementResult(null);
        setError(null);
        setCompanyName('');
        setPosition('');
        setField('');
      }, 300);
    }
  }, [isOpen]);

  const handleEnhance = async () => {
    if (!companyName || !position || !field) {
      setError("Please fill in all fields (Company, Position, Field)");
      return;
    }

    setStep('loading');
    setError(null);

    if (!resume.file) {
      setError("No resume file found for enhancement.");
      setStep('error');
      return;
    }

    try {
      const result = await cvApi.improveCV({
        cv: resume.file,
        cong_ty_ung_tuyen: companyName,
        vi_tri_ung_tuyen: position,
        linh_vuc: field,
      });

      setEnhancementResult(result);
      setStep('preview');
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred while enhancing the CV.';
      console.error('Enhancement Error:', err);
      setError(errorMessage);
      setStep('error');
    }
  };

  const handleAccept = () => {
    // Logic to save the enhanced resume would go here
    // This could involve another API call to update the resume record
    console.log('Accepted enhancement:', enhancementResult);
    setStep('final');
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleDecline = () => {
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-gray-900 flex items-center"
                >
                  <IoSparklesOutline className="mr-3 text-[#007BFF]" />
                  Enhance Your Resume with AI
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={24} />
                </button>

                {step === 'initial' && (
                  <div className="mt-6">
                    <div className="text-center mb-6">
                      <div className="mx-auto w-16 h-16 bg-[#007BFF]/10 rounded-full flex items-center justify-center mb-4">
                        <FiFileText className="w-8 h-8 text-[#007BFF]" />
                      </div>
                      <p className="text-lg text-gray-700 mb-2">
                        Let our AI enhance your resume for <span className="font-semibold">{resume.full_name}</span>
                      </p>
                      <p className="text-gray-500 mb-6">
                        Provide job details to get personalized improvement suggestions.
                      </p>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Company
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g. Google, Microsoft, Startup XYZ"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position
                        </label>
                        <input
                          type="text"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          placeholder="e.g. Software Engineer, Product Manager"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field/Industry
                        </label>
                        <input
                          type="text"
                          value={field}
                          onChange={(e) => setField(e.target.value)}
                          placeholder="e.g. Technology, Finance, Healthcare"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <button
                        onClick={handleEnhance}
                        className="inline-flex items-center justify-center rounded-lg bg-[#007BFF] px-6 py-3 text-base font-medium text-white shadow-md hover:bg-[#0056b3] transition-colors"
                      >
                        <IoSparklesOutline className="mr-2" />
                        Enhance My Resume
                      </button>
                    </div>
                  </div>
                )}
                
                {step === 'loading' && (
                  <div className="mt-8 text-center animate-pulse">
                     <div className="mx-auto w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mb-4">
                       <IoSparklesOutline className="w-8 h-8 text-blue-600" />
                     </div>
                     <p className="text-lg text-gray-600">AI is analyzing your resume...</p>
                     <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                   </div>
                )}

                {step === 'preview' && enhancementResult && (
                  <div className="mt-6">
                    <p className="text-center text-gray-600 mb-6">Our AI has analyzed your resume and provided improvement suggestions.</p>
                    
                    <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
                      <h4 className="font-semibold text-lg mb-4 text-[#007BFF] flex items-center">
                        <IoSparklesOutline className="mr-2"/>
                        AI Enhancement Report
                      </h4>
                      
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {enhancementResult}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-blue-50 rounded-lg p-4">
                      <h5 className="font-semibold text-blue-800 mb-2">Resume Information</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Name:</strong> {resume.full_name}</p>
                          <p><strong>Email:</strong> {resume.email}</p>
                        </div>
                        <div>
                          <p><strong>Target Company:</strong> {companyName}</p>
                          <p><strong>Position:</strong> {position}</p>
                          <p><strong>Field:</strong> {field}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-center gap-4">
                      <button
                        onClick={handleDecline}
                        className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <FiThumbsDown className="mr-2"/>
                        Close
                      </button>
                      <button
                        onClick={handleAccept}
                        className="inline-flex items-center justify-center rounded-lg bg-[#007BFF] px-6 py-3 text-base font-medium text-white shadow-md hover:bg-[#0056b3] transition-colors"
                      >
                        <FiThumbsUp className="mr-2"/>
                        Save Report
                      </button>
                    </div>
                  </div>
                )}
                 {step === 'error' && (
                    <div className="mt-8 text-center">
                       <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                         <FiAlertCircle className="w-8 h-8 text-red-600" />
                       </div>
                       <p className="text-lg text-red-800 font-semibold">Enhancement Failed</p>
                       <p className="text-gray-600">{error}</p>
                       <button
                         onClick={() => setStep('initial')}
                         className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-200 px-6 py-3 text-base font-medium text-gray-800 shadow-sm hover:bg-gray-300 transition-colors"
                       >
                         Try Again
                       </button>
                     </div>
                  )}
                {step === 'final' && (
                    <div className="mt-8 text-center">
                       <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                         <FiCheck className="w-8 h-8 text-green-600" />
                       </div>
                       <p className="text-lg text-gray-800 font-semibold">Resume Updated!</p>
                       <p className="text-gray-500">Your enhanced resume has been saved.</p>
                     </div>
                  )}

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}; 