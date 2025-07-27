import { useState, useEffect } from 'react';
import { Footer } from './Footer';
import GroupUnderline from '../../assets/Group.png';
import { EnhanceResumeModal } from './EnhanceResumeModal';
import api from '../../services/api';

interface Resume {
  id: number;
  company: string;
  jobCount: number;
  description: string;
  matchScore: number;
  avatar: string;
  hasEnhanced?: boolean;
}

export const Resume: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [matchScore, setMatchScore] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchResumes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/cvs');
      setResumes(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load resumes.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleOpenEnhanceModal = (resume: Resume) => {
    setSelectedResume(resume);
    setIsEnhanceModalOpen(true);
  };

  const handleCloseEnhanceModal = () => {
    setIsEnhanceModalOpen(false);
    setSelectedResume(null);
  };

  const processAndUploadFile = async (file: File) => {
    if (file && file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
      setUploadedFile(file);
      setUploadError(null);
      setUploadSuccess(false);
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('cv', file);

      try {
        await api.post('/cvs/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        setUploadSuccess(true);
        // Refetch resumes to show the new one
        await fetchResumes(); 
      } catch (err) {
        setUploadError('File upload failed. Please try again.');
        console.error('Upload error:', err);
      } finally {
        setIsUploading(false);
      }

    } else {
      setUploadError('Please select a PDF file under 5MB');
      setUploadedFile(null);
    }
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      processAndUploadFile(file);
    }
  };

  const ResumeCard = ({ resume }: { resume: Resume }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
            {resume.avatar}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{resume.company}</h3>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[#007BFF] text-sm font-medium">{resume.jobCount} Jobs</span>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
        {resume.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 text-xs rounded-full font-medium ${
            resume.matchScore >= 80 ? 'bg-green-100 text-green-700' :
            resume.matchScore >= 60 ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            Match score: {resume.matchScore}%
          </span>
        </div>
        
        {resume.hasEnhanced && (
          <button 
            onClick={() => handleOpenEnhanceModal(resume)}
            className="bg-[#007BFF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0056b3] transition-colors"
          >
            Enhanced resume
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Build your <span className="text-[#007BFF] relative inline-block">
                  dream resume
                  <img 
                    src={GroupUnderline} 
                    alt="underline" 
                    className="absolute -bottom-6 left-0 w-full h-6 object-contain transform scale-125"
                  />
                </span>
              </h1>
              <p className="text-gray-600 mt-4">
                Custom the dream resumes you dream work for
              </p>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center px-4 py-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Resume name or keyword"
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
                <div className="w-px bg-gray-200 hidden md:block"></div>
                <div className="flex-1 flex items-center px-4 py-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <input
                    type="text"
                    value={matchScore}
                    onChange={(e) => setMatchScore(e.target.value)}
                    placeholder="Match score"
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
                <button className="bg-[#007BFF] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#0056b3] transition-colors">
                  Search
                </button>
              </div>
            </div>

            {/* Popular Suggestions */}
            <div className="text-left text-sm text-gray-600">
              <span className="mr-2">Popular:</span>
              <span className="text-gray-800">Twitter, Microsoft, Apple, Facebook</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
          {/* All Your Resumes Section */}
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">All Your Resumes</h2>
              <p className="text-gray-600">
                Based on your profile, company preferences, and recent activity
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? <p>Loading resumes...</p> : error ? <p className="text-red-500">{error}</p> : resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))}
            </div>
          </div>

          {/* Add Your Resumes Section */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Your Resumes</h2>
              <p className="text-gray-600">
                Based on your profile, company preferences, and recent activity
              </p>
            </div>

            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#007BFF]/40 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <div className="mx-auto w-16 h-16 bg-[#007BFF]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              {isUploading ? (
                <div>
                  <p className="text-gray-600 font-medium mb-2">Uploading...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-[#007BFF] h-2.5 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ) : uploadSuccess ? (
                <div>
                  <p className="text-green-600 font-medium mb-2">
                    File uploaded successfully!
                  </p>
                  <p className="text-gray-600 text-sm">
                    {uploadedFile?.name}
                  </p>
                </div>
              ) : uploadError ? (
                 <div>
                  <p className="text-red-500 font-medium mb-2">
                    {uploadError}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Please try again.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium mb-2">
                    Click to replace or drag and drop
                  </p>
                  <p className="text-gray-500 text-sm">
                    A file pdf max size 5MB
                  </p>
                </div>
              )}
              
              <input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>
      
      <Footer />

      {selectedResume && (
        <EnhanceResumeModal
          isOpen={isEnhanceModalOpen}
          onClose={handleCloseEnhanceModal}
          resume={selectedResume}
        />
      )}
    </>
  );
};

export default Resume; 