import React, { useState } from 'react';
import MatchScoreDisplay from './MatchScoreDisplay';

interface Resume {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  objective: string;
  extractedData?: any;
  uploadedAt: Date;
  jobMatchScores?: MatchScore[];
  bestMatchScore?: number;
  bestMatchJob?: string;
  hasJobMatches?: boolean;
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
  const [activeTab, setActiveTab] = useState<'info' | 'match'>('info');
  
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
                <p className="text-2xl font-bold text-blue-600">{resume.jobMatchScores.length}</p>
                <p className="text-sm text-gray-600">Jobs Analyzed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {resume.jobMatchScores.filter(job => job.match_score >= 70).length}
                </p>
                <p className="text-sm text-gray-600">Good Match (≥70%)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {Math.round(resume.jobMatchScores.reduce((sum, job) => sum + job.match_score, 0) / resume.jobMatchScores.length)}%
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
            {resume.jobMatchScores.map((match, index) => (
                              <div key={match.job_id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">#{index + 1}</span>
                      <h5 className="font-medium text-gray-900 text-left">{match.job_title}</h5>
                    </div>
                    <p className="text-gray-600 text-sm mt-1 text-left">{match.company_name}</p>
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
                        <div className="text-lg font-semibold text-blue-600">{Math.round(match.detailed_scores.skill_match)}%</div>
                        <div className="text-xs text-gray-600">Skills</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">{Math.round(match.detailed_scores.experience_match)}%</div>
                        <div className="text-xs text-gray-600">Experience</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">{Math.round(match.detailed_scores.education_match)}%</div>
                        <div className="text-xs text-gray-600">Education</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">{Math.round(match.detailed_scores.description_match)}%</div>
                        <div className="text-xs text-gray-600">Description</div>
                      </div>
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
                    {resume.jobMatchScores.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === 'info' ? renderCVInfoTab() : renderMatchTab()}
        </div>
      </div>
    </div>
  );
};

export default CVDetailModal;
