import React from 'react';
import TestFormBase, { TestFormData, Question } from './TestFormBase';
import testApi from '../../services/testApi';

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated: () => void;
}

const CreateTestModal: React.FC<CreateTestModalProps> = ({ isOpen, onClose, onTestCreated }) => {
    const handleCreateTest = async (formData: TestFormData, questions: Question[]) => {
      const testData = {
            job_id: formData.job_id,
            test_name: formData.test_name,
            test_description: formData.test_description,
            test_type: formData.test_type || 'MULTIPLE_CHOICE', // Use form value
        time_limit: Number(formData.time_limit),
        passing_score: Number(formData.passing_score),
            is_active: formData.is_active,
            // Note: created_by is automatically added by backend from req.user.user_id
        questions: questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.question_type === 'MULTIPLE_CHOICE' ? q.options.filter(opt => opt.trim() !== '') : [],
          correct_answer: String(q.correct_answer || ''),
          points: q.points
        }))
      };

        await testApi.createTest(testData);
        // Test created successfully - parent component will handle success feedback
        onTestCreated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <TestFormBase
                onSubmit={handleCreateTest}
                onCancel={onClose}
                submitLabel="Create Test"
                title="Create New Test"
                isModal={true}
            />
    </div>
  );
};

export default CreateTestModal;