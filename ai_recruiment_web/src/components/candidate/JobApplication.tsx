import { useState } from 'react';

interface JobApplicationProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    logo: string;
    logoColor: string;
  };
}

export const JobApplication: React.FC<JobApplicationProps> = ({ isOpen, onClose, job }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentJobTitle: '',
    linkedinUrl: '',
    portfolioUrl: '',
    additionalInfo: '',
    resumeFile: null as File | null
  });

  const [characterCount, setCharacterCount] = useState(0);
  const maxCharacters = 500;

  const handleInputChange = (field: string, value: string) => {
    if (field === 'additionalInfo') {
      if (value.length <= maxCharacters) {
        setFormData(prev => ({ ...prev, [field]: value }));
        setCharacterCount(value.length);
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, resumeFile: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Application submitted:', formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <div className="bg-white px-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${job.logoColor}`}>
                  {job.logo}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.company} • {job.location} • {job.type}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Submit your application</h4>
                <p className="text-sm text-gray-600 mb-6">
                  The following is required and will only be shared with {job.company}
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your fullname"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF]"
                />
              </div>

              {/* Current Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current or previous job title
                </label>
                <input
                  type="text"
                  value={formData.currentJobTitle}
                  onChange={(e) => handleInputChange('currentJobTitle', e.target.value)}
                  placeholder="What's your current or previous job title?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF]"
                />
              </div>

              {/* Links Section */}
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-4 uppercase tracking-wide">LINKS</h5>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                      placeholder="Link to your LinkedIn URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio URL
                    </label>
                    <input
                      type="url"
                      value={formData.portfolioUrl}
                      onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
                      placeholder="Link to your portfolio URL"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF]"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional information
                </label>
                <div className="relative">
                  <textarea
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    placeholder="Add a cover letter or anything else you want to share"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] resize-none"
                  />
                  
                  {/* Text Formatting Toolbar */}
                  <div className="flex items-center space-x-2 mt-2 p-2 border-t border-gray-200">
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                      title="Bold"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 2a1 1 0 00-1 1v14a1 1 0 001 1h6a3 3 0 003-3 3 3 0 00-3-3 3 3 0 003-3 3 3 0 00-3-3H4zm2 2h3a1 1 0 110 2H6V4zm0 4h4a1 1 0 110 2H6V8z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                      title="Italic"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3a1 1 0 000 2h1.5L6 15H5a1 1 0 100 2h6a1 1 0 100-2h-1.5L12 5H13a1 1 0 100-2H7z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                      title="Underline"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a1 1 0 00-1 1v6a3 3 0 106 0V3a1 1 0 10-2 0v6a1 1 0 11-2 0V3a1 1 0 00-1-1zM3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                      title="Bullet List"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                      title="Numbered List"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                      title="Link"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Maximum {maxCharacters} characters</span>
                    <span>{characterCount} / {maxCharacters}</span>
                  </div>
                </div>
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach your resume
                </label>
                <p className="text-sm text-gray-600 mb-3">or choose in collection</p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-center">
                    <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-gray-600">Attach Resume/CV</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {formData.resumeFile && (
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Selected: {formData.resumeFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-[#007BFF] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0056b3] transition-colors"
                >
                  Submit Application
                </button>
              </div>

              {/* Terms */}
              <div className="text-xs text-gray-500 text-center">
                By sending the request you can confirm that you accept our{' '}
                <a href="#" className="text-[#007BFF] hover:text-[#007BFF]">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-[#007BFF] hover:text-[#007BFF]">Privacy Policy</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplication; 