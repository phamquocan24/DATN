import React from 'react';
import { Skeleton } from './SkeletonLoader';

// Full page loading with branded skeleton
export const PageLoadingSkeleton: React.FC<{ 
  title?: string;
  description?: string;
}> = ({ title = "Loading...", description = "Please wait while we fetch your data" }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">
        {/* Logo/Brand Skeleton */}
        <div className="mb-8">
          <Skeleton circle width="w-16" height="h-16" className="mx-auto mb-4" />
          <Skeleton width="w-32" height="h-6" className="mx-auto" />
        </div>
        
        {/* Loading Animation */}
        <div className="relative mb-6">
          <div className="flex space-x-2 justify-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
};

// Search results loading
export const SearchLoadingSkeleton: React.FC<{ itemCount?: number }> = ({ itemCount = 6 }) => {
  return (
    <div className="space-y-4">
      {/* Search filters skeleton */}
      <div className="flex space-x-4 mb-6">
        <Skeleton width="w-48" height="h-10" />
        <Skeleton width="w-32" height="h-10" />
        <Skeleton width="w-24" height="h-10" />
      </div>
      
      {/* Results count skeleton */}
      <div className="mb-4">
        <Skeleton width="w-64" height="h-5" />
      </div>
      
      {/* Search results */}
      <div className="space-y-4">
        {Array.from({ length: itemCount }, (_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-4">
              <Skeleton circle width="w-12" height="h-12" />
              <div className="flex-1 space-y-2">
                <Skeleton width="w-3/4" height="h-5" />
                <Skeleton width="w-1/2" height="h-4" />
                <div className="flex space-x-4">
                  <Skeleton width="w-20" height="h-4" />
                  <Skeleton width="w-24" height="h-4" />
                  <Skeleton width="w-16" height="h-4" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Skeleton width="w-8" height="h-8" />
                <Skeleton width="w-20" height="h-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Card grid loading
export const CardGridSkeleton: React.FC<{ 
  itemCount?: number;
  columns?: string;
  cardType?: 'job' | 'company';
}> = ({ 
  itemCount = 6, 
  columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  cardType = 'job'
}) => {
  const renderCard = () => {
    if (cardType === 'company') {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-4 mb-4">
            <Skeleton circle width="w-16" height="h-16" />
            <div className="space-y-2 flex-1">
              <Skeleton width="w-32" height="h-5" />
              <Skeleton width="w-24" height="h-4" />
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <Skeleton width="w-full" height="h-4" />
            <Skeleton width="w-5/6" height="h-4" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton width="w-20" height="h-6" />
            <Skeleton width="w-16" height="h-6" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Skeleton circle width="w-12" height="h-12" />
            <div className="space-y-2">
              <Skeleton width="w-24" height="h-4" />
              <Skeleton width="w-20" height="h-3" />
            </div>
          </div>
          <Skeleton width="w-8" height="h-8" />
        </div>
        
        <div className="mb-4">
          <Skeleton width="w-full" height="h-5" className="mb-2" />
          <Skeleton width="w-full" height="h-4" className="mb-1" />
          <Skeleton width="w-3/4" height="h-4" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Skeleton width="w-16" height="h-6" />
            <Skeleton width="w-20" height="h-6" />
          </div>
          <Skeleton width="w-20" height="h-8" />
        </div>
      </div>
    );
  };

  return (
    <div className={`grid ${columns} gap-6`}>
      {Array.from({ length: itemCount }, (_, i) => (
        <div key={i}>
          {renderCard()}
        </div>
      ))}
    </div>
  );
};

// Data table loading
export const TableLoadingSkeleton: React.FC<{ 
  columns: string[];
  rowCount?: number;
}> = ({ columns, rowCount = 5 }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Skeleton width="w-20" height="h-4" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rowCount }, (_, i) => (
            <tr key={i}>
              {columns.map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                  <Skeleton height="h-4" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Profile/Stats cards loading
export const StatsCardsSkeleton: React.FC<{ cardCount?: number }> = ({ cardCount = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: cardCount }, (_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Skeleton circle width="w-8" height="h-8" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <Skeleton width="w-16" height="h-6" className="mb-1" />
              <Skeleton width="w-24" height="h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default {
  PageLoadingSkeleton,
  SearchLoadingSkeleton,
  CardGridSkeleton,
  TableLoadingSkeleton,
  StatsCardsSkeleton
};
