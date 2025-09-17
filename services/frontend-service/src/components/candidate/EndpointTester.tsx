import React, { useState } from 'react';
import { endpointValidator } from '../../utils/endpointValidator';

interface ValidationResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  message: string;
  response?: any;
}

export const EndpointTester: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const runValidation = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);
    
    try {
      const validationResults = await endpointValidator.validateAllEndpoints();
      setResults(validationResults);
      setSummary(endpointValidator.getSummary());
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'success' ? '✅' : '❌';
  };

  const getStatusColor = (status: string) => {
    return status === 'success' 
      ? 'text-green-600 bg-green-50 border-green-200' 
      : 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔍 API Endpoint Validator
        </h1>
        <p className="text-gray-600">
          Test và kiểm tra tất cả các endpoint Company và Job để đảm bảo kết nối đúng
        </p>
      </div>

      <div className="mb-6">
        <button
          onClick={runValidation}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 ${
            isRunning 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-[#007BFF] hover:bg-[#0056b3] active:transform active:scale-95'
          }`}
        >
          {isRunning ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang kiểm tra...
            </span>
          ) : (
            '🚀 Chạy kiểm tra tất cả endpoints'
          )}
        </button>
      </div>

      {summary && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-blue-600">Tổng số test</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{summary.successful}</div>
            <div className="text-sm text-green-600">Thành công</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            <div className="text-sm text-red-600">Thất bại</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{summary.successRate}%</div>
            <div className="text-sm text-purple-600">Tỷ lệ thành công</div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            📋 Kết quả kiểm tra
          </h2>
          
          {results.map((result, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg">{getStatusIcon(result.status)}</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {result.method}
                    </span>
                    <span className="font-medium">{result.endpoint}</span>
                  </div>
                  <p className="text-sm mb-2">{result.message}</p>
                  
                  {result.response && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium hover:text-gray-700">
                        📄 Xem chi tiết response
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded border text-xs font-mono overflow-auto max-h-40">
                        <pre>{JSON.stringify(result.response, null, 2)}</pre>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !isRunning && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">🧪</div>
          <p className="text-lg">Nhấn nút "Chạy kiểm tra" để bắt đầu test các endpoints</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">📝 Các endpoint được kiểm tra:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">🏢 Company Endpoints:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• GET /api/v1/companies - Danh sách công ty</li>
              <li>• GET /api/v1/companies/{`{id}`} - Chi tiết công ty</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">💼 Job Endpoints:</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• GET /api/v1/jobs/latest - Jobs mới nhất</li>
              <li>• GET /api/v1/jobs/search - Tìm kiếm jobs</li>
              <li>• GET /api/v1/jobs/{`{id}`} - Chi tiết job</li>
              <li>• GET /api/v1/jobs/recommendations - Gợi ý jobs</li>
              <li>• GET /api/v1/jobs/company/{`{id}`} - Jobs của công ty</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
