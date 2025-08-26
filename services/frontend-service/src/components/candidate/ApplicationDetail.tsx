import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Briefcase, FileText, Clock } from 'lucide-react';
import candidateApi from '../../services/candidateApi';

interface ApplicationDetailProps {
  applicationId: string;
  onBack: () => void;
}

interface ApplicationDetails {
  application_id: string;
  job_id: string;
  candidate_id: string;
  current_status: string;
  cover_letter?: string;
  cv_id?: string;
  applied_at: string;
  updated_at: string;
  job?: {
    job_id: string;
    title: string;
    company: {
      name: string;
      logo?: string;
    };
    employment_type: string;
    work_type: string;
    location: string;
    salary_min?: number;
    salary_max?: number;
  };
  cv?: {
    cv_id: string;
    cv_title: string;
    cv_file_url: string;
  };
  status_history?: Array<{
    status: string;
    changed_at: string;
    reason?: string;
  }>;
}

const ApplicationDetail: React.FC<ApplicationDetailProps> = ({ applicationId, onBack }) => {
  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplicationDetail = async () => {
      setIsLoading(true);
      try {
        const response = await candidateApi.getApplicationById(applicationId, true);
        setApplication(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load application details');
        console.error('Error fetching application details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplicationDetail();
  }, [applicationId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REVIEWING': return 'bg-blue-100 text-blue-800';
      case 'SHORTLISTED': return 'bg-green-100 text-green-800';
      case 'INTERVIEWING': return 'bg-purple-100 text-purple-800';
      case 'TESTING': return 'bg-indigo-100 text-indigo-800';
      case 'OFFERED': return 'bg-emerald-100 text-emerald-800';
      case 'HIRED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF]"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">{error || 'Application not found'}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3]"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Applications
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {application.job?.title || 'Job Application'}
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                {application.job?.company?.name || 'Company'}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Applied: {formatDate(application.applied_at)}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Updated: {formatDate(application.updated_at)}
                </div>
              </div>
            </div>
            <div>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(application.current_status)}`}>
                {getStatusDisplayName(application.current_status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Job Details
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Position:</span>
                  <span className="ml-2 text-gray-600">{application.job?.title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <span className="ml-2 text-gray-600">{application.job?.company?.name}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <span className="ml-2 text-gray-600">{application.job?.location}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-600">
                    {application.job?.employment_type} • {application.job?.work_type}
                  </span>
                </div>
                {application.job?.salary_min && application.job?.salary_max && (
                  <div>
                    <span className="font-medium text-gray-700">Salary:</span>
                    <span className="ml-2 text-gray-600">
                      ${application.job.salary_min.toLocaleString()} - ${application.job.salary_max.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Letter */}
            {application.cover_letter && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Cover Letter
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap">{application.cover_letter}</p>
                </div>
              </div>
            )}

            {/* Status History */}
            {application.status_history && application.status_history.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Status History
                </h2>
                <div className="space-y-4">
                  {application.status_history.map((status, index) => (
                    <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-b-0">
                      <div className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(status.status).replace('bg-', 'bg-').split(' ')[0]}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {getStatusDisplayName(status.status)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(status.changed_at)}
                          </span>
                        </div>
                        {status.reason && (
                          <p className="text-sm text-gray-600 mt-1">{status.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Info</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Application ID:</span>
                  <p className="text-sm text-gray-600 font-mono">{application.application_id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Current Status:</span>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(application.current_status)}`}>
                      {getStatusDisplayName(application.current_status)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* CV Used */}
            {application.cv && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">CV Used</h3>
                <div className="flex items-start space-x-3">
                  <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{application.cv.cv_title}</p>
                    <a
                      href={application.cv.cv_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#007BFF] hover:text-[#0056b3]"
                    >
                      View CV
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
