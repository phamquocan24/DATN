import React from 'react';

interface MatchScoreDisplayProps {
  score: number;
  grade: string;
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
  grade,
  size = 'medium',
  showDetails = false,
  detailedScores
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 65) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeText = (grade: string): string => {
    switch (grade) {
      case 'EXCELLENT': return 'Xuất sắc';
      case 'VERY_GOOD': return 'Rất tốt';
      case 'GOOD': return 'Tốt';
      case 'FAIR': return 'Khá';
      case 'POOR': return 'Yếu';
      default: return grade;
    }
  };

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
        <span className="mr-1">🎯</span>
        <span>{score}%</span>
        <span className="ml-1 text-xs opacity-75">({getGradeText(grade)})</span>
      </div>

      {/* Detailed Scores */}
      {showDetails && detailedScores && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-gray-600">Chi tiết điểm số:</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Kỹ năng:</span>
              <span className={`font-medium ${getScoreColor(detailedScores.skills_similarity).split(' ')[0]}`}>
                {detailedScores.skills_similarity}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Kinh nghiệm:</span>
              <span className={`font-medium ${getScoreColor(detailedScores.experience_similarity).split(' ')[0]}`}>
                {detailedScores.experience_similarity}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Học vấn:</span>
              <span className={`font-medium ${getScoreColor(detailedScores.education_similarity).split(' ')[0]}`}>
                {detailedScores.education_similarity}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mô tả:</span>
              <span className={`font-medium ${getScoreColor(detailedScores.description_similarity).split(' ')[0]}`}>
                {detailedScores.description_similarity}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchScoreDisplay;
