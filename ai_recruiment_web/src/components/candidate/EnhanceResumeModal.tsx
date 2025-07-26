import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiCheck, FiFileText, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { IoSparklesOutline } from 'react-icons/io5';

interface Resume {
  id: number;
  company: string;
  jobCount: number;
  description: string;
  matchScore: number;
  avatar: string;
}

interface EnhanceResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: Resume;
}

// Mock AI suggestions - in a real app, this would come from a backend
const aiSuggestions = {
  description: {
    original: "Nomad is located in Paris, France. Nomad has generated $728.8M in sales (USD).",
    enhanced: "Spearheaded sales strategies for Nomad, a Paris-based company, contributing to a remarkable $728.8M in total revenue. Proven ability to drive growth in a competitive international market.",
    points: [
      "Used stronger action verbs.",
      "Quantified achievements with specific numbers.",
      "Added a summary of key skills."
    ]
  },
  matchScore: {
    original: 80,
    enhanced: 95
  }
};

export const EnhanceResumeModal: React.FC<EnhanceResumeModalProps> = ({ isOpen, onClose, resume }) => {
  const [step, setStep] = useState('initial'); // 'initial', 'preview', 'final'

  const handleEnhance = () => {
    // Simulate API call and processing time
    setStep('loading');
    setTimeout(() => {
      setStep('preview');
    }, 1500);
  };

  const handleAccept = () => {
    // Logic to save the enhanced resume would go here
    setStep('final');
    setTimeout(() => {
      onClose();
      // Reset state for next time
      setTimeout(() => setStep('initial'), 300);
    }, 2000);
  };

  const handleDecline = () => {
    onClose();
    // Reset state for next time
    setTimeout(() => setStep('initial'), 300);
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
                      Let our AI review your resume for the <span className="font-semibold">{resume.company}</span> position.
                    </p>
                    <p className="text-gray-500 mb-6">
                      We'll provide suggestions to improve your match score and highlight your strengths.
                    </p>
                    <button
                      onClick={handleEnhance}
                      className="inline-flex items-center justify-center rounded-lg bg-[#007BFF] px-6 py-3 text-base font-medium text-white shadow-md hover:bg-[#0056b3] transition-colors"
                    >
                      <IoSparklesOutline className="mr-2" />
                      Enhance My Resume
                    </button>
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

                {step === 'preview' && (
                  <div className="mt-6">
                    <p className="text-center text-gray-600 mb-6">Our AI has provided suggestions to improve your resume. Review the changes below.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Original Resume */}
                      <div className="rounded-lg border border-gray-200 p-6">
                        <h4 className="font-semibold text-lg mb-4 text-gray-800">Your Current Resume</h4>
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">{resume.avatar}</div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{resume.company}</h3>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">{aiSuggestions.description.original}</p>
                          <span className="px-3 py-1 text-xs rounded-full font-medium bg-red-100 text-red-700">
                            Match score: {aiSuggestions.matchScore.original}%
                          </span>
                        </div>
                      </div>

                      {/* Enhanced Resume */}
                      <div className="rounded-lg border-2 border-[#007BFF] p-6 bg-[#007BFF]/5">
                        <h4 className="font-semibold text-lg mb-4 text-[#007BFF] flex items-center">
                          <IoSparklesOutline className="mr-2"/>
                          AI-Enhanced Version
                        </h4>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
                          <div className="flex items-center space-x-3 mb-3">
                             <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">{resume.avatar}</div>
                             <div>
                               <h3 className="font-semibold text-gray-900">{resume.company}</h3>
                             </div>
                           </div>
                           <p className="text-gray-800 text-sm mb-4 bg-green-100 p-2 rounded-md">{aiSuggestions.description.enhanced}</p>
                           <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">
                             Match score: {aiSuggestions.matchScore.enhanced}%
                           </span>
                        </div>
                        <div className="mt-4 text-sm">
                            <h5 className="font-semibold mb-2 text-gray-700">Changes Made:</h5>
                            <ul className="space-y-1">
                                {aiSuggestions.description.points.map((point, i) => (
                                    <li key={i} className="flex items-start">
                                        <FiCheck className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"/>
                                        <span className="text-gray-600">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-center gap-4">
                      <button
                        onClick={handleDecline}
                        className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <FiThumbsDown className="mr-2"/>
                        Decline
                      </button>
                      <button
                        onClick={handleAccept}
                        className="inline-flex items-center justify-center rounded-lg bg-[#007BFF] px-6 py-3 text-base font-medium text-white shadow-md hover:bg-[#0056b3] transition-colors"
                      >
                        <FiThumbsUp className="mr-2"/>
                        Accept & Save
                      </button>
                    </div>
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