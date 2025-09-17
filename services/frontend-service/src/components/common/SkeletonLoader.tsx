import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
  circle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = true,
  circle = false
}) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  const shapeClasses = circle ? 'rounded-full' : rounded ? 'rounded' : '';
  const combinedClasses = `${baseClasses} ${shapeClasses} ${width} ${height} ${className}`;

  return <div className={combinedClasses}></div>;
};

// Job Card Skeleton
export const JobCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton circle width="w-12" height="h-12" />
          <div className="space-y-2">
            <Skeleton width="w-32" height="h-5" />
            <Skeleton width="w-24" height="h-4" />
          </div>
        </div>
        <Skeleton width="w-8" height="h-8" circle />
      </div>
      
      <div className="mb-4">
        <Skeleton width="w-48" height="h-6" className="mb-2" />
        <Skeleton width="w-full" height="h-4" className="mb-1" />
        <Skeleton width="w-3/4" height="h-4" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Skeleton width="w-16" height="h-6" />
          <Skeleton width="w-20" height="h-6" />
          <Skeleton width="w-14" height="h-6" />
        </div>
        <Skeleton width="w-20" height="h-8" />
      </div>
    </div>
  );
};

// Company Card Skeleton
export const CompanyCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton circle width="w-16" height="h-16" />
        <div className="space-y-2 flex-1">
          <Skeleton width="w-40" height="h-6" />
          <Skeleton width="w-32" height="h-4" />
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <Skeleton width="w-full" height="h-4" />
        <Skeleton width="w-5/6" height="h-4" />
        <Skeleton width="w-4/5" height="h-4" />
      </div>
      
      <div className="flex items-center justify-between">
        <Skeleton width="w-24" height="h-6" />
        <Skeleton width="w-16" height="h-6" />
      </div>
    </div>
  );
};

// Job List Item Skeleton
export const JobListItemSkeleton: React.FC = () => {
  return (
    <div className="border-b border-gray-200 py-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <Skeleton circle width="w-10" height="h-10" />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-64" height="h-5" />
            <Skeleton width="w-48" height="h-4" />
            <div className="flex space-x-4">
              <Skeleton width="w-20" height="h-4" />
              <Skeleton width="w-24" height="h-4" />
              <Skeleton width="w-16" height="h-4" />
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton width="w-8" height="h-8" />
          <Skeleton width="w-16" height="h-8" />
        </div>
      </div>
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => {
  return (
    <tr className="border-b border-gray-200">
      {Array.from({ length: columns }, (_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton height="h-4" />
        </td>
      ))}
    </tr>
  );
};

// Featured Job Skeleton (for homepage)
export const FeaturedJobSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3 mb-4">
        <Skeleton circle width="w-12" height="h-12" />
        <div className="space-y-2">
          <Skeleton width="w-6" height="h-6" />
        </div>
      </div>
      
      <div className="space-y-3">
        <Skeleton width="w-40" height="h-6" />
        <Skeleton width="w-32" height="h-4" />
        <Skeleton width="w-full" height="h-4" />
        <Skeleton width="w-3/4" height="h-4" />
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <Skeleton width="w-20" height="h-6" />
        <Skeleton width="w-24" height="h-8" />
      </div>
    </div>
  );
};

// Resume Card Skeleton
export const ResumeCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group text-left cursor-pointer hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <Skeleton circle width="w-12" height="h-12" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton width="w-32" height="h-5" />
            <Skeleton width="w-40" height="h-4" />
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <Skeleton width="w-16" height="h-4" />
          <Skeleton width="w-6" height="h-6" />
        </div>
      </div>

      <div className="mb-4">
        <Skeleton width="w-full" height="h-4" className="mb-2" />
        <Skeleton width="w-5/6" height="h-4" className="mb-1" />
        <Skeleton width="w-3/4" height="h-4" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <Skeleton width="w-24" height="h-6" />
          <Skeleton width="w-20" height="h-4" />
        </div>
        <div className="flex flex-col items-end space-y-2">
          <Skeleton width="w-28" height="h-8" />
        </div>
      </div>
    </div>
  );
};

// Page Content Skeleton
export const PageSkeleton: React.FC<{ 
  title?: boolean;
  subtitle?: boolean;
  items?: number;
  itemType?: 'job' | 'company' | 'list';
}> = ({ 
  title = true, 
  subtitle = true, 
  items = 6, 
  itemType = 'job' 
}) => {
  const renderItem = () => {
    switch (itemType) {
      case 'job':
        return <JobCardSkeleton />;
      case 'company':
        return <CompanyCardSkeleton />;
      case 'list':
        return <JobListItemSkeleton />;
      default:
        return <JobCardSkeleton />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {title && (
        <div className="mb-6">
          <Skeleton width="w-64" height="h-8" className="mb-2" />
          {subtitle && <Skeleton width="w-96" height="h-5" />}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: items }, (_, i) => (
          <div key={i}>
            {renderItem()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Skeleton;
