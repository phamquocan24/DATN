import React, { useState } from 'react';
import MatchScoreDisplay from './MatchScoreDisplay';
import { useNavigate } from 'react-router-dom';

interface Resume {
  id: string;
  cv_id?: string;
  candidate_id?: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  objective: string;
  file?: File;
  fileName?: string;
  fileType?: string;
  filePath?: string; // Server file path (stored in database)
  extractedData?: any;
  uploadedAt: Date;
  matchingScore?: number;
  isCalculatingMatch?: boolean;
  jobMatchScores?: MatchScore[];
  bestMatchScore?: number;
  bestMatchJob?: string;
  hasJobMatches?: boolean;
  is_primary?: boolean;
}

interface MatchScore {
  job_id: string;
  job_title: string;
  company_name: string;
  match_score: number;
  match_grade: string;
  detailed_scores?: {
    skill_match: number;
    experience_match: number;
    education_match: number;
    description_match: number;
    overall_match: number;
  };
}

interface CVDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resume: Resume | null;
}

export const CVDetailModal: React.FC<CVDetailModalProps> = ({ isOpen, onClose, resume }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'preview' | 'match'>('info');
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainData, setExplainData] = useState<any>(null);
  const [isLoadingExplain, setIsLoadingExplain] = useState(false);
  const navigate = useNavigate();
  
  if (!isOpen || !resume) return null;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  const handleExplainMatch = async (jobId: string) => {
    setIsLoadingExplain(true);
    try {
      // Use the new CV-Job match analysis endpoint
      const token = localStorage.getItem('token');
      console.log('🔐 Token for API call:', token ? 'exists' : 'null');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:8001/api/v1/ai/cv-job-match-analysis/${resume.cv_id}/${jobId}`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setExplainData(data);
        setShowExplainModal(true);
      } else {
        // Fallback: Show basic explanation based on scores
        const match = resume.jobMatchScores?.find(m => m.job_id === jobId);
        if (match) {
          const mockExplanation = {
            reasoning: {
              summary: `Độ phù hợp tổng thể: ${Math.round(match.match_score)}%`,
              strengths: [
                match.detailed_scores?.skills_similarity > 0.5 ? "Kỹ năng phù hợp tốt" : null,
                match.detailed_scores?.overall_similarity > 0.4 ? "Tương thích chung cao" : null
              ].filter(Boolean),
              weaknesses: [
                match.detailed_scores?.experience_similarity === 0 ? "Thiếu thông tin kinh nghiệm" : null,
                match.detailed_scores?.education_similarity === 0 ? "Thiếu thông tin học vấn" : null
              ].filter(Boolean),
              recommendations: ["Cập nhật thêm thông tin kinh nghiệm và học vấn để tăng độ phù hợp"]
            }
          };
          setExplainData(mockExplanation);
          setShowExplainModal(true);
        }
      }
    } catch (error) {
      console.error('Error explaining match:', error);
      // Show basic explanation on error
      const match = resume.jobMatchScores?.find(m => m.job_id === jobId);
      if (match) {
        const mockExplanation = {
          reasoning: {
            summary: `Độ phù hợp tổng thể: ${Math.round(match.match_score)}%`,
            strengths: ["Có thể phù hợp với vị trí này"],
            weaknesses: ["Cần thêm thông tin để đánh giá chính xác hơn"],
            recommendations: ["Cập nhật CV với thông tin chi tiết hơn"]
          }
        };
        setExplainData(mockExplanation);
        setShowExplainModal(true);
      }
    } finally {
      setIsLoadingExplain(false);
    }
  };

  const renderPDFPreviewTab = () => {
    // Debug log to see what data we have
    console.log('🖼️ PDF Preview Data for', resume.full_name, {
      filePath: resume.filePath,
      fileName: resume.fileName,
      fileType: resume.fileType,
      file: resume.file ? 'has file object' : 'no file object',
      extractedData: resume.extractedData ? 'has extracted data' : 'no extracted data'
    });

    // Check all possible sources for file data
    const hasFilePath = resume.filePath;
    const hasFileObject = resume.file;
    
    if (!hasFilePath && !hasFileObject) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-gray-100 rounded-full p-4 mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PDF File Available</h3>
          <p className="text-gray-500 mb-2">The CV file has not been uploaded or is not accessible.</p>
          <p className="text-xs text-gray-400">Please re-upload your CV to enable PDF preview.</p>
        </div>
      );
    }

    // Get file URL from multiple sources
    let fileUrl = '';
    let fileName = '';
    let fileType = '';
    
    if (hasFilePath && resume.filePath) {
      // Convert server file path to full URL
      fileUrl = resume.filePath.startsWith('http') ? resume.filePath : `http://localhost:5001${resume.filePath}`;
      fileName = resume.fileName || 'CV.pdf';
      fileType = resume.fileType || 'pdf';
    } else if (hasFileObject && resume.file) {
      fileUrl = URL.createObjectURL(resume.file);
      fileName = resume.file.name;
      fileType = resume.file.type;
    }
    
    // Check if it's a PDF file
    const isPdf = fileType === 'pdf' || 
                  fileType.includes('pdf') || 
                  fileName.toLowerCase().endsWith('.pdf') ||
                  fileUrl.includes('pdf');
    
    if (isPdf) {
      return (
        <div className="h-full">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">PDF Preview</h3>
            <div className="flex items-center space-x-2">
              {fileName && (
                <span className="text-sm text-gray-500">{fileName}</span>
              )}
              {fileUrl && (
                <a 
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Open in new tab
                </a>
              )}
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50" style={{ height: 'calc(100vh - 200px)' }}>
            {fileUrl ? (
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                className="w-full h-full"
                title="CV Preview"
                style={{ minHeight: '600px' }}
                onError={() => console.error('PDF loading error')}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-gray-500">Unable to load PDF preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-blue-100 rounded-full p-4 mb-4">
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document Available</h3>
          <p className="text-gray-500 mb-4">
            File: {fileName || 'CV Document'} ({fileType?.toUpperCase() || 'DOC'})
          </p>
          {fileUrl && (
            <a 
              href={fileUrl}
              download={fileName}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Download File
            </a>
          )}
        </div>
      );
    }
  };

  const renderCVInfoTab = () => (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Personal Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Full Name</label>
            <p className="text-gray-900 text-left">{resume.full_name || 'No information'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Email</label>
            <p className="text-gray-900 text-left">{resume.email || 'No information'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Phone Number</label>
            <p className="text-gray-900 text-left">{resume.phone || 'No information'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Address</label>
            <p className="text-gray-900 text-left">{resume.address || 'No information'}</p>
          </div>
        </div>
        {resume.objective && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Career Objective</label>
            <p className="text-gray-900 text-left">{resume.objective}</p>
          </div>
        )}
      </div>

      {/* Extracted Data */}
      {renderExtractedData()}
    </div>
  );

  const renderExtractedData = () => {
    if (!resume.extractedData) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Extracted CV Information</h3>
          <p className="text-gray-500 text-left">No extracted data available</p>
        </div>
      );
    }

    const data = resume.extractedData;
    
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Extracted CV Information</h3>
        
        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-2 text-left">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill: any, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm text-left">
                  {skill.skill_name}
                  {skill.proficiency && (
                    <span className="ml-1 text-xs opacity-75">({skill.proficiency})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-2 text-left">Work Experience</h4>
            <div className="space-y-3">
              {data.experience.map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-blue-200 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-900 text-left">{exp.position}</h5>
                      <p className="text-gray-700 text-left">{exp.company}</p>
                    </div>
                    <span className="text-sm text-gray-500 text-left">
                      {exp.start_date} - {exp.end_date || 'Present'}
                    </span>
                  </div>
                  {exp.description && (
                    <p className="text-gray-600 text-sm mt-1 text-left">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-2 text-left">Education</h4>
            <div className="space-y-3">
              {data.education.map((edu: any, index: number) => (
                <div key={index} className="border-l-2 border-green-200 pl-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-gray-900 text-left">{edu.degree}</h5>
                      <p className="text-gray-700 text-left">{edu.school}</p>
                      {edu.field && <p className="text-gray-600 text-sm text-left">Field of Study: {edu.field}</p>}
                    </div>
                    <span className="text-sm text-gray-500 text-left">
                      {edu.start_date} - {edu.end_date || 'Present'}
                    </span>
                  </div>
                  {edu.gpa && (
                    <p className="text-gray-600 text-sm mt-1 text-left">GPA: {edu.gpa}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-2 text-left">Projects</h4>
            <div className="space-y-3">
              {data.projects.map((project: any, index: number) => (
                <div key={index} className="border-l-2 border-purple-200 pl-4">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium text-gray-900 text-left">{project.name}</h5>
                    <span className="text-sm text-gray-500 text-left">
                      {project.start_date} - {project.end_date || 'Present'}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-gray-600 text-sm mt-1 text-left">{project.description}</p>
                  )}
                  {project.technologies && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.technologies.map((tech: string, techIndex: number) => (
                        <span key={techIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs text-left">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 mb-2 text-left">Certifications</h4>
            <div className="space-y-2">
              {data.certifications.map((cert: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div>
                    <h5 className="font-medium text-gray-900 text-left">{cert.name}</h5>
                    {cert.issuer && <p className="text-gray-600 text-sm text-left">{cert.issuer}</p>}
                  </div>
                  {cert.date && (
                    <span className="text-sm text-gray-500 text-left">{cert.date}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2 text-left">Languages</h4>
            <div className="flex flex-wrap gap-2">
              {data.languages.map((lang: any, index: number) => (
                <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm text-left">
                  {lang.language}
                  {lang.proficiency && (
                    <span className="ml-1 text-xs opacity-75">({lang.proficiency})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMatchTab = () => {
    console.log('📊 Rendering Match Tab for', resume.full_name, {
      hasJobMatches: resume.hasJobMatches,
      bestMatchScore: resume.bestMatchScore,
      bestMatchJob: resume.bestMatchJob,
      jobMatchScoresCount: resume.jobMatchScores?.length || 0,
      jobMatchScores: resume.jobMatchScores
    });

    if (!resume.hasJobMatches || !resume.jobMatchScores || resume.jobMatchScores.length === 0) {
      return (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Job Matching Scores</h3>
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 text-lg">No job matching scores available</p>
              <p className="text-gray-400 text-sm mt-2">The system will automatically calculate matching scores when suitable jobs are found</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Match Overview */}
        {resume.bestMatchScore !== undefined && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Matching Overview</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-md font-medium text-blue-900 text-left">Best Matching Job</h4>
                {resume.bestMatchJob && (
                  <p className="text-blue-800 mt-1 text-left">{resume.bestMatchJob}</p>
                )}
              </div>
              <MatchScoreDisplay 
                score={resume.bestMatchScore} 
                grade={resume.jobMatchScores[0]?.match_grade || 'POOR'}
                size="large"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{Math.min(resume.jobMatchScores.length, 10)}</p>
                <p className="text-sm text-gray-600">Jobs Analyzed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {resume.jobMatchScores.slice(0, 10).filter(job => job.match_score >= 70).length}
                </p>
                <p className="text-sm text-gray-600">Good Match (≥70%)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {Math.round(resume.jobMatchScores.slice(0, 10).reduce((sum, job) => sum + job.match_score, 0) / Math.min(resume.jobMatchScores.length, 10))}%
                </p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Match Scores */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Detailed Job Matching</h3>
          <div className="space-y-4">
            {resume.jobMatchScores
              .sort((a, b) => b.match_score - a.match_score)
              .slice(0, 10)
              .map((match, index) => (
                <div 
                  key={match.job_id} 
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => {
                    if (match.job_id) {
                      onClose(); // Close modal before navigation
                      navigate(`/candidate/job-detail/${match.job_id}`);
                    }
                  }}
                >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 text-blue-800 font-semibold text-sm px-2 py-1 rounded-full min-w-[24px] text-center">
                      {index + 1}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 text-left hover:text-blue-600 transition-colors">{match.job_title}</h5>
                      <p className="text-gray-600 text-sm mt-1 text-left">{match.company_name}</p>
                    </div>
                  </div>
                  <MatchScoreDisplay 
                    score={match.match_score} 
                    grade={match.match_grade}
                    size="medium"
                  />
                </div>
                
                {/* Detailed Scores */}
                {match.detailed_scores && (
                                      <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <h6 className="text-sm font-medium text-gray-700 mb-3 text-left">Detailed Analysis:</h6>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">{Math.round((match.detailed_scores.skills_similarity || 0) * 100)}%</div>
                        <div className="text-xs text-gray-600">Skills</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{Math.round((match.detailed_scores.experience_similarity || 0) * 100)}%</div>
                        <div className="text-xs text-gray-600">Experience</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{Math.round((match.detailed_scores.education_similarity || 0) * 100)}%</div>
                        <div className="text-xs text-gray-600">Education</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">{Math.round((match.detailed_scores.overall_similarity || 0) * 100)}%</div>
                        <div className="text-xs text-gray-600">Overall</div>
                      </div>
                    </div>
                    
                    {/* Explain Match Button */}
                    <div className="mt-3 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent parent div click
                          console.log('🔍 Explain match clicked for job:', match.job_id);
                          handleExplainMatch(match.job_id);
                        }}
                        className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="Xem phân tích chi tiết về độ phù hợp"
                      >
                        🔍 Detail
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-6xl max-h-[90vh] w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div className="text-left">
                <h2 className="text-2xl font-bold text-gray-900">CV Details</h2>
                <p className="text-gray-600 text-sm">{resume.full_name}</p>
              </div>
              <div className="text-right">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Date</label>
                <p className="text-gray-900 text-sm">{formatDate(resume.uploadedAt)}</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors ml-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>CV Information</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>PDF Preview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('match')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'match'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Job Matching</span>
                {resume.hasJobMatches && resume.jobMatchScores && resume.jobMatchScores.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {Math.min(resume.jobMatchScores.length, 10)}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === 'info' ? renderCVInfoTab() : 
           activeTab === 'preview' ? renderPDFPreviewTab() : 
           renderMatchTab()}
        </div>
      </div>
      
      {/* Explanation Modal */}
      {showExplainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xl">🔍</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Chi tiết phân tích độ phù hợp</h3>
                  </div>
                  {explainData?.job_title && (
                    <p className="text-blue-700 font-medium ml-13">Vị trí: {explainData.job_title}</p>
                  )}
                  {explainData?.similarity_scores && (
                    <div className="flex space-x-4 mt-2 ml-13">
                      <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Tổng thể: {Math.round(explainData.similarity_scores.overall * 100)}%
                      </span>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                        Kỹ năng: {Math.round(explainData.similarity_scores.skills * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowExplainModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {isLoadingExplain ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang phân tích...</p>
                </div>
              ) : explainData?.reasoning ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-lg">📊</span>
                      </div>
                      <h4 className="font-bold text-blue-900 text-lg">Tổng quan phân tích</h4>
                    </div>
                    <p className="text-blue-800 text-base leading-relaxed">{explainData.reasoning.summary}</p>
                  </div>
                  
                  {/* Strengths */}
                  {explainData.reasoning.strengths?.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-lg">✅</span>
                        </div>
                        <h4 className="font-bold text-green-900 text-lg">Điểm mạnh của CV</h4>
                      </div>
                      <div className="space-y-2">
                        {explainData.reasoning.strengths.map((strength: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <p className="text-green-800 text-base leading-relaxed">{strength}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Weaknesses */}
                  {explainData.reasoning.weaknesses?.length > 0 && (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-lg">⚠️</span>
                        </div>
                        <h4 className="font-bold text-orange-900 text-lg">Điểm cần cải thiện</h4>
                      </div>
                      <div className="space-y-2">
                        {explainData.reasoning.weaknesses.map((weakness: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                            <p className="text-orange-800 text-base leading-relaxed">{weakness}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Recommendations */}
                  {explainData.reasoning.recommendations?.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-lg">💡</span>
                        </div>
                        <h4 className="font-bold text-purple-900 text-lg">Gợi ý cải thiện CV</h4>
                      </div>
                      <div className="space-y-3">
                        {explainData.reasoning.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                              <span className="text-xs font-bold text-purple-600">{index + 1}</span>
                            </div>
                            <p className="text-purple-800 text-base leading-relaxed">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Không có thông tin phân tích</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVDetailModal;
