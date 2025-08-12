import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiCheck, FiFileText, FiThumbsUp, FiThumbsDown, FiAlertCircle } from 'react-icons/fi';
import { IoSparklesOutline } from 'react-icons/io5';
import aiApi from '../../services/aiApi';

interface ResumeCardData {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  isPrimary: boolean;
  createdAt: string;
  extractedData?: any;
  file?: File;
}

interface EnhanceResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: ResumeCardData;
}



export const EnhanceResumeModal: React.FC<EnhanceResumeModalProps> = ({ isOpen, onClose, resume }) => {
  const [step, setStep] = useState('initial'); // 'initial', 'form', 'loading', 'preview', 'final', 'error'
  const [error, setError] = useState<string | null>(null);
  const [improvementSuggestion, setImprovementSuggestion] = useState<string>('');
  
  // Form data for improvement
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [field, setField] = useState('');

  useEffect(() => {
    // Reset state when the modal is closed or the resume changes
    if (!isOpen) {
      setTimeout(() => {
        setStep('initial');
        setError(null);
        setImprovementSuggestion('');
        setCompanyName('');
        setPosition('');
        setField('');
      }, 300);
    }
  }, [isOpen]);

  const handleStartEnhancement = () => {
    setStep('form');
  };

  const handleEnhance = async () => {
    // Validate form data
    if (!companyName.trim() || !position.trim() || !field.trim()) {
      setError('Please fill in all fields (Company, Position, and Field).');
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
      const response = await aiApi.improveCv(resume.file, {
        company: companyName,
        position: position,
        field: field,
      });

      // The improve-cv API returns plain text suggestions
      if (response) {
        setImprovementSuggestion(response);
        setStep('preview');
      } else {
        setError('No improvement suggestions received from the AI service.');
        setStep('error');
      }
    } catch (err: any) {
      console.error('Enhancement Error:', err);
      let errorMessage = 'An unexpected error occurred while enhancing your CV.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setStep('error');
    }
  };

  const handleAccept = async () => {
    try {
      // Save positive feedback to AI service
      await aiApi.saveFeedback(5, `User found the CV improvement suggestions helpful for ${companyName} - ${position} position.`);
      console.log('Positive feedback saved for improvement suggestions');
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
    
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
                  <div className="mt-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-[#007BFF]/10 rounded-full flex items-center justify-center mb-4">
                      <FiFileText className="w-8 h-8 text-[#007BFF]" />
                    </div>
                    <p className="text-lg text-gray-700 mb-2">
                      Let our AI review and improve your resume with personalized suggestions.
                    </p>
                    <p className="text-gray-500 mb-6">
                      We'll analyze your CV and provide specific recommendations based on your target company and position.
                    </p>
                    
                    {resume.extractedData && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <h4 className="font-semibold text-gray-800 mb-2">CV Information Detected:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• File: {resume.fileName}</li>
                          <li>• Size: {(resume.fileSize / 1024 / 1024).toFixed(2)} MB</li>
                          <li>• Name: {resume.extractedData?.personal_info?.name || 'N/A'}</li>
                          <li>• Email: {resume.extractedData?.personal_info?.email || 'N/A'}</li>
                          <li>• Skills: {resume.extractedData?.skills?.length ? resume.extractedData.skills.slice(0, 3).join(', ') + (resume.extractedData.skills.length > 3 ? '...' : '') : 'N/A'}</li>
                        </ul>
                      </div>
                    )}
                    
                    <button
                      onClick={handleStartEnhancement}
                      className="inline-flex items-center justify-center rounded-lg bg-[#007BFF] px-6 py-3 text-base font-medium text-white shadow-md hover:bg-[#0056b3] transition-colors"
                    >
                      <IoSparklesOutline className="mr-2" />
                      Start Enhancement
                    </button>
                  </div>
                )}

                {step === 'form' && (
                  <div className="mt-6">
                    <div className="text-center mb-6">
                      <div className="mx-auto w-16 h-16 bg-[#007BFF]/10 rounded-full flex items-center justify-center mb-4">
                        <IoSparklesOutline className="w-8 h-8 text-[#007BFF]" />
                      </div>
                      <p className="text-lg text-gray-700 mb-2">
                        Tell us about your target position
                      </p>
                      <p className="text-gray-500">
                        This information helps our AI provide more targeted suggestions.
                      </p>
                    </div>
                    
                    <div className="space-y-4 max-w-md mx-auto">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="e.g., Google, Microsoft, Startup Inc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position *
                        </label>
                        <input
                          type="text"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          placeholder="e.g., Software Engineer, Product Manager"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field/Industry *
                        </label>
                        <input
                          type="text"
                          value={field}
                          onChange={(e) => setField(e.target.value)}
                          placeholder="e.g., Technology, Finance, Healthcare"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007BFF] focus:border-transparent outline-none"
                        />
                      </div>
                      
                      {error && (
                        <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-8 flex justify-center gap-4">
                      <button
                        onClick={() => setStep('initial')}
                        className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleEnhance}
                        className="inline-flex items-center justify-center rounded-lg bg-[#007BFF] px-6 py-3 text-base font-medium text-white shadow-md hover:bg-[#0056b3] transition-colors"
                      >
                        <IoSparklesOutline className="mr-2" />
                        Analyze & Enhance
                      </button>
                    </div>
                  </div>
                )}
                
                {step === 'loading' && (
                  <div className="mt-8 text-center animate-pulse">
                     <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                       <IoSparklesOutline className="w-8 h-8 text-gray-400" />
                     </div>
                     <p className="text-lg text-gray-600">Analyzing your resume...</p>
                   </div>
                )}

                {step === 'preview' && improvementSuggestion && (
                  <div className="mt-6">
                    <div className="text-center mb-6">
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <FiCheck className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-lg text-gray-700 mb-2">
                        AI Analysis Complete!
                      </p>
                      <p className="text-gray-500">
                        Here are personalized suggestions for your CV targeting <span className="font-semibold">{companyName}</span> as a <span className="font-semibold">{position}</span>.
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <h4 className="font-semibold text-lg mb-4 text-[#007BFF] flex items-center">
                        <IoSparklesOutline className="mr-2"/>
                        AI Enhancement Suggestions
                      </h4>
                      <div className="bg-white rounded-lg p-4 shadow-sm max-h-96 overflow-y-auto">
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {improvementSuggestion}
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
                        Save Feedback
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
                       <p className="text-lg text-gray-800 font-semibold">Thank You!</p>
                       <p className="text-gray-500">Your feedback has been saved. Use the suggestions to improve your CV!</p>
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