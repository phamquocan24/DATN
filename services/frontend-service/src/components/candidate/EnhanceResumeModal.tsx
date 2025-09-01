import { useState, Fragment, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { FiX, FiCheck, FiFileText, FiThumbsUp, FiAlertCircle } from 'react-icons/fi';
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

// Interface for parsed AI enhancement result
interface ParsedEnhancementResult {
  strengths: string[];
  visualFeedback: string[];
  contentFeedback: string[];
  rawText: string;
}

export const EnhanceResumeModal: React.FC<EnhanceResumeModalProps> = ({ isOpen, onClose, resume }) => {
  const [step, setStep] = useState('initial'); // 'initial', 'loading', 'preview', 'final', 'error'
  const [enhancementResult, setEnhancementResult] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedEnhancementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [field, setField] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');


  // Function to parse AI enhancement result
  const parseEnhancementResult = (rawText: string): ParsedEnhancementResult => {
    const strengths: string[] = [];
    const visualFeedback: string[] = [];
    const contentFeedback: string[] = [];

    // Split the text by sections using different patterns
    const lines = rawText.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Check if this is a section header
      if (trimmedLine.match(/^#{1,3}/) || 
          trimmedLine.toLowerCase().includes('điểm mạnh') ||
          trimmedLine.toLowerCase().includes('ngoại quan') ||
          trimmedLine.toLowerCase().includes('nhận xét') ||
          trimmedLine.toLowerCase().includes('đánh giá') ||
          trimmedLine.toLowerCase().includes('nội dung')) {
        
        if (trimmedLine.toLowerCase().includes('điểm mạnh') || 
            trimmedLine.toLowerCase().includes('ưu điểm')) {
          currentSection = 'strengths';
        } else if (trimmedLine.toLowerCase().includes('ngoại quan') || 
                   trimmedLine.toLowerCase().includes('phần nhìn') ||
                   trimmedLine.toLowerCase().includes('bố cục') ||
                   (trimmedLine.toLowerCase().includes('nhận xét') && trimmedLine.toLowerCase().includes('ngoại quan'))) {
          currentSection = 'visual';
        } else if (trimmedLine.toLowerCase().includes('nội dung') || 
                   trimmedLine.toLowerCase().includes('phù hợp') ||
                   trimmedLine.toLowerCase().includes('cải thiện') ||
                   (trimmedLine.toLowerCase().includes('nhận xét') && trimmedLine.toLowerCase().includes('nội dung'))) {
          currentSection = 'content';
        }
        continue;
      }

      // Extract content based on current section
      const cleanLine = cleanTextLine(trimmedLine);
      if (cleanLine && cleanLine.length > 10) {
        switch (currentSection) {
          case 'strengths':
            strengths.push(cleanLine);
            break;
          case 'visual':
            visualFeedback.push(cleanLine);
            break;
          case 'content':
            contentFeedback.push(cleanLine);
            break;
          default:
            // If no section detected yet, try to categorize by content
            if (trimmedLine.toLowerCase().includes('thông tin') && trimmedLine.toLowerCase().includes('đầy đủ')) {
              strengths.push(cleanLine);
            } else if (trimmedLine.toLowerCase().includes('phông chữ') || 
                       trimmedLine.toLowerCase().includes('căn lề') ||
                       trimmedLine.toLowerCase().includes('bố cục')) {
              visualFeedback.push(cleanLine);
            } else if (trimmedLine.toLowerCase().includes('kinh nghiệm') ||
                       trimmedLine.toLowerCase().includes('kỹ năng') ||
                       trimmedLine.toLowerCase().includes('học vấn')) {
              contentFeedback.push(cleanLine);
            }
            break;
        }
      }
    }

    return {
      strengths,
      visualFeedback,
      contentFeedback,
      rawText
    };
  };

  // Helper function to clean text lines but preserve **text** formatting
  const cleanTextLine = (line: string): string => {
    return line
      .replace(/^[-+•]\s+/, '') // Remove bullet points (-, +, •) followed by space
      .replace(/^\*\s+/, '') // Remove single * bullet points followed by space
      .replace(/^\d+\.\s*/, '') // Remove numbered lists only  
      .replace(/^[:\-]\s*/, '') // Remove leading colons and dashes
      .trim();
  };

  // Helper function to render text with **bold** formatting
  const renderFormattedText = (text: string) => {
    // More comprehensive regex to match **text** patterns including multiword and special chars
    const parts = text.split(/(\*\*[^*]+?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        // Remove the ** markers and make it bold
        const boldText = part.slice(2, -2).trim();
        if (boldText) {
          return <strong key={index} className="font-semibold">{boldText}</strong>;
        }
      }
      // Clean up any remaining single or malformed asterisks
      return part.replace(/^\*{1}\s*|\s*\*{1}$/g, '').replace(/\*{1}([^*])/g, '$1');
    });
  };



  useEffect(() => {
    // Reset state when the modal is closed or the resume changes
    if (!isOpen) {
      setTimeout(() => {
        setStep('initial');
        setEnhancementResult(null);
        setParsedResult(null);
        setError(null);
        setCompanyName('');
        setPosition('');
        setField('');
        setFeedbackRating(null);
        setFeedbackComment('');

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

    // Check if we have a valid File object
    let fileToProcess = resume.file;
    
    // If the file is not available or not a proper File object
    if (!fileToProcess || typeof fileToProcess !== 'object' || !fileToProcess.name) {
      console.error('🚫 No file object found in resume:', {
        hasFile: !!fileToProcess,
        fileType: typeof fileToProcess,
        fileName: fileToProcess?.name,
        cv_id: resume.cv_id,
        filePath: resume.filePath
      });
      
      setError("Resume file is not available. Please try clicking the 'Enhance resume' button again to download the CV file.");
      setStep('error');
      return;
    }

    // Additional check to ensure it's a proper File object
    if (!(fileToProcess instanceof File)) {
      console.error('🚫 Invalid file object type:', {
        fileToProcess,
        isFile: fileToProcess instanceof File,
        constructor: fileToProcess.constructor.name
      });
      
      setError("Invalid file format detected. Please try clicking the 'Enhance resume' button again to re-download the CV file.");
      setStep('error');
      return;
    }

    console.log('✅ File validation passed:', {
      fileName: fileToProcess.name,
      fileSize: fileToProcess.size,
      fileType: fileToProcess.type
    });

    try {
      const result = await cvApi.improveCV({
        cv: fileToProcess,
        cong_ty_ung_tuyen: companyName,
        vi_tri_ung_tuyen: position,
        linh_vuc: field,
      });

      setEnhancementResult(result);
      const parsed = parseEnhancementResult(result);
      setParsedResult(parsed);
      setStep('preview');
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred while enhancing the CV.';
      console.error('Enhancement Error:', err);
      setError(errorMessage);
      setStep('error');
    }
  };

  const handleAccept = async () => {
    if (feedbackRating === null) {
      setError("Please provide a rating before saving feedback.");
      return;
    }

    try {
      // Send feedback to AI service
      await cvApi.saveFeedback(feedbackRating, feedbackComment);
      console.log('Feedback saved successfully');
    setStep('final');
    setTimeout(() => {
      onClose();
    }, 2000);
    } catch (err: any) {
      console.error('Failed to save feedback:', err);
      setError('Failed to save feedback. Please try again.');
    }
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

                {step === 'preview' && enhancementResult && parsedResult && (
                  <div className="mt-6">
                    <p className="text-center text-gray-600 mb-6">Our AI has analyzed your resume and provided improvement suggestions.</p>
                    
                    <div className="max-h-96 overflow-y-auto space-y-4">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{parsedResult.strengths.length}</div>
                          <div className="text-sm text-green-700">Điểm Mạnh</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{parsedResult.visualFeedback.length}</div>
                          <div className="text-sm text-blue-700">Đánh Giá UI/UX</div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-amber-600">{parsedResult.contentFeedback.length}</div>
                          <div className="text-sm text-amber-700">Gợi Ý Cải Thiện</div>
                        </div>
                      </div>
                      {/* Strengths Section */}
                      {parsedResult.strengths.length > 0 && (
                        <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-4">
                          <h4 className="font-semibold text-lg mb-3 text-green-800 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Điểm Mạnh Của CV
                          </h4>
                          <ul className="space-y-2">
                            {parsedResult.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-green-700 text-sm leading-relaxed">{renderFormattedText(strength)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Visual Feedback Section */}
                      {parsedResult.visualFeedback.length > 0 && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                          <h4 className="font-semibold text-lg mb-3 text-blue-800 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Đánh Giá Ngoại Quan
                          </h4>
                          <ul className="space-y-2">
                            {parsedResult.visualFeedback.map((feedback, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-blue-700 text-sm leading-relaxed">{renderFormattedText(feedback)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Content Feedback Section */}
                      {parsedResult.contentFeedback.length > 0 && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4">
                          <h4 className="font-semibold text-lg mb-3 text-amber-800 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Gợi Ý Cải Thiện Nội Dung
                          </h4>
                          <ul className="space-y-2">
                            {parsedResult.contentFeedback.map((feedback, index) => (
                              <li key={index} className="flex items-start">
                                <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-amber-700 text-sm leading-relaxed">{renderFormattedText(feedback)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Fallback: Show raw text if parsing didn't work well */}
                      {parsedResult.strengths.length === 0 && parsedResult.visualFeedback.length === 0 && parsedResult.contentFeedback.length === 0 && (
                        <div className="bg-gray-50 rounded-lg p-6">
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
                      )}
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

                    {/* Feedback Section */}
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                      <h5 className="font-semibold text-gray-800 mb-4">Rate this AI Enhancement Report</h5>
                      
                      {/* Rating Stars */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFeedbackRating(star)}
                              className={`w-8 h-8 transition-colors ${
                                feedbackRating && star <= feedbackRating 
                                  ? 'text-yellow-400 hover:text-yellow-500' 
                                  : 'text-gray-300 hover:text-yellow-300'
                              }`}
                            >
                              <svg fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                        {feedbackRating && (
                          <p className="text-sm text-gray-600 mt-1">
                            {feedbackRating === 1 ? 'Poor' : 
                             feedbackRating === 2 ? 'Fair' : 
                             feedbackRating === 3 ? 'Good' : 
                             feedbackRating === 4 ? 'Very Good' : 'Excellent'}
                          </p>
                        )}
                      </div>

                      {/* Comment */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Comments (Optional)
                        </label>
                        <textarea
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          placeholder="Share your thoughts about this AI enhancement report..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-8 flex justify-center gap-4">
                      <button
                        onClick={handleDecline}
                        className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-50 transition-colors"
                      >
                        <FiX className="mr-2"/>
                        Close
                      </button>
                      <button
                        onClick={handleAccept}
                        disabled={feedbackRating === null}
                        className={`inline-flex items-center justify-center rounded-lg px-6 py-3 text-base font-medium shadow-md transition-colors ${
                          feedbackRating === null 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-[#007BFF] text-white hover:bg-[#0056b3]'
                        }`}
                      >
                        <FiThumbsUp className="mr-2"/>
                        Submit Feedback
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
                       <p className="text-lg text-gray-800 font-semibold">Feedback Submitted!</p>
                       <p className="text-gray-500">Thank you for your feedback. It will help us improve our AI enhancement service.</p>
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