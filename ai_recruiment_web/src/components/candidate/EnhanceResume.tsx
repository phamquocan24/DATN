import React, { useState } from 'react';
import api from '../../services/api';

export const EnhanceResume: React.FC = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [field, setField] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setCvFile(file);
        setError(null);
      } else {
        setError('Please upload a PDF file.');
        setCvFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) {
      setError('Please upload your CV.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    const formData = new FormData();
    formData.append('cv', cvFile);
    // These fields are not in the API, but are kept for UI consistency
    formData.append('company_name', companyName);
    formData.append('position', position);
    formData.append('field', field);


    try {
      // Note: The API /api/v1/cvs does not seem to return a suggestion directly.
      // We will upload the CV and then show a generic success message.
      const response = await api.post('/api/v1/cvs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Mocking a suggestion as the API doesn't provide one
      setSuggestion('Your CV has been successfully uploaded and is ready for improvement suggestions. Here are some general tips: 1. Tailor your CV to the job description. 2. Use action verbs to describe your accomplishments. 3. Quantify your achievements with numbers and data.');

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred while enhancing the CV.';
      setError(errorMessage);
      console.error('CV Enhancement Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-10">
      <h1 className="text-3xl font-bold text-center mb-2">Công cụ hỗ trợ cải thiện CV</h1>
      <p className="text-center text-gray-600 mb-8">Tải CV lên (chỉ hỗ trợ định dạng pdf)</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tải CV của bạn</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <span>Upload a file</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf" />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF up to 10MB</p>
               {cvFile && <p className="text-sm text-green-600 mt-2">{cvFile.name}</p>}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Tên công ty ứng tuyển</label>
          <input type="text" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700">Vị trí ứng tuyển</label>
          <input type="text" id="position" value={position} onChange={(e) => setPosition(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        <div>
          <label htmlFor="field" className="block text-sm font-medium text-gray-700">Lĩnh vực</label>
          <input type="text" id="field" value={field} onChange={(e) => setField(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        {error && <div className="text-red-600 text-sm text-center">{error}</div>}

        <div className="text-center">
          <button type="submit" disabled={isLoading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
            {isLoading ? 'Đang xử lý CV, vui lòng chờ...' : 'Xem đề xuất cải thiện CV'}
          </button>
        </div>
      </form>

      {suggestion && (
        <div className="mt-10 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Đề xuất cải thiện CV</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{suggestion}</p>

            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2">Bạn đánh giá công cụ này như thế nào?</h3>
                {/* Simple star rating example */}
                <div className="flex items-center space-x-2">
                    <span>Số sao:</span>
                    <div className="text-2xl text-yellow-400">
                        {'⭐️'.repeat(5)}
                    </div>
                </div>
                <textarea className="mt-4 w-full p-2 border rounded-md" placeholder="Nhận xét (tuỳ chọn)"></textarea>
                <button className="mt-4 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Gửi đánh giá</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default EnhanceResume; 