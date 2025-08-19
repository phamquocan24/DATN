import React from 'react';

interface MatchScoreDisplayProps {
  score: number;
<<<<<<< HEAD
  grade: string;
  size?: 'small' | 'medium' | 'large';
}

const MatchScoreDisplay: React.FC<MatchScoreDisplayProps> = ({ score, grade, size = 'medium' }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
=======
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  detailedScores?: {
    skills_similarity: number;
    experience_similarity: number;
    education_similarity: number;
    description_similarity: number;
  };
}

export const MatchScoreDisplay: React.FC<MatchScoreDisplayProps> = ({
  score,
  size = 'medium',
  showDetails = false,
  detailedScores
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 65) return 'text-yellow-600 bg-yellow-100';
>>>>>>> 3b2191a10c95847661a38073210137d1649fef30
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

<<<<<<< HEAD
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
=======


  const sizeClasses = {
    small: 'text-xs px-2 py-1',
    medium: 'text-sm px-3 py-2',
    large: 'text-base px-4 py-3'
  };

  const scoreColorClass = getScoreColor(score);
  const sizeClass = sizeClasses[size];

  return (
    <div className="match-score-display">
      {/* Main Score Badge */}
      <div className={`inline-flex items-center rounded-full font-semibold ${scoreColorClass} ${sizeClass}`}>
        <span className="mr-1">Match:</span>
        <span>{score.toFixed(2)}%</span>
      </div>

      {/* Detailed Scores */}
      {showDetails && detailedScores && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-gray-600">Chi tiết điểm số:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Kỹ năng:</span>
              <span className={`font-medium ${getScoreColor(detailedScores.skills_similarity * 100).split(' ')[0]}`}>
                {(detailedScores.skills_similarity * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Kinh nghiệm:</span>
              <span className={`font-medium ${getScoreColor(detailedScores.experience_similarity * 100).split(' ')[0]}`}>
                {(detailedScores.experience_similarity * 100).toFixed(4)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Học vấn:</span>
              <span className={`font-medium ${getScoreColor(detailedScores.education_similarity * 100).split(' ')[0]}`}>
                {(detailedScores.education_similarity * 100).toFixed(4)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mô tả:</span>
              <span className={`font-medium ${getScoreColor(detailedScores.description_similarity * 100).split(' ')[0]}`}>
                {(detailedScores.description_similarity * 100).toFixed(4)}%
              </span>
            </div>
          </div>
        </div>
      )}
>>>>>>> 3b2191a10c95847661a38073210137d1649fef30
    </div>
  );
};

export default MatchScoreDisplay;
