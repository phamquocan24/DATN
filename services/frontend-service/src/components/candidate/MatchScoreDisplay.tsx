import React from 'react';

interface MatchScoreDisplayProps {
  score: number;
  grade: string;
  size?: 'small' | 'medium' | 'large';
}

const MatchScoreDisplay: React.FC<MatchScoreDisplayProps> = ({ score, grade, size = 'medium' }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeText = (grade: string) => {
    switch (grade) {
      case 'EXCELLENT': return 'Xuất sắc';
      case 'VERY_GOOD': return 'Rất tốt';
      case 'GOOD': return 'Tốt';
      case 'FAIR': return 'Khá';
      case 'POOR': return 'Kém';
      default: return grade;
    }
  };

  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-1.5',
    large: 'text-lg px-4 py-2'
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`font-semibold rounded-full ${getScoreColor(score)} ${sizeClasses[size]}`}>
        {score}%
      </span>
      <span className={`text-gray-600 ${size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'}`}>
        {getGradeText(grade)}
      </span>
    </div>
  );
};

export default MatchScoreDisplay;
