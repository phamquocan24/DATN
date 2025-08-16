import React, { useState, useEffect } from 'react';
import candidateApi from '../../services/candidateApi';

interface Skill {
  id: string;
  skill_name: string;
  proficiency_level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  created_at?: string;
}

interface SkillManagementProps {
  userSkills?: Skill[];
  onSkillsUpdate?: (skills: Skill[]) => void;
}

const SkillManagement: React.FC<SkillManagementProps> = ({ 
  userSkills = [], 
  onSkillsUpdate 
}) => {
  const [skills, setSkills] = useState<Skill[]>(userSkills);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    proficiency_level: 'Intermediate' as const
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

  useEffect(() => {
    setSkills(userSkills);
  }, [userSkills]);

  const handleAddSkill = async () => {
    if (!newSkill.skill_name.trim()) {
      setError('Skill name is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await candidateApi.addSkill(newSkill);
      if (response.success) {
        const addedSkill = response.data;
        const updatedSkills = [...skills, addedSkill];
        setSkills(updatedSkills);
        onSkillsUpdate?.(updatedSkills);
        
        // Reset form
        setNewSkill({ skill_name: '', proficiency_level: 'Intermediate' });
        setIsAddingSkill(false);
        setSuccess('Skill added successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Error adding skill:', err);
      setError(err.message || 'Failed to add skill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSkill = async (skillId: string, skillName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${skillName}" from your skills?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await candidateApi.deleteSkill(skillId);
      if (response.success) {
        const updatedSkills = skills.filter(skill => skill.id !== skillId);
        setSkills(updatedSkills);
        onSkillsUpdate?.(updatedSkills);
        setSuccess('Skill removed successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Error deleting skill:', err);
      setError(err.message || 'Failed to remove skill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-gray-100 text-gray-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-green-100 text-green-800';
      case 'Expert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
        <button
          onClick={() => setIsAddingSkill(true)}
          disabled={loading || isAddingSkill}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add Skill
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Add Skill Form */}
      {isAddingSkill && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-3">Add New Skill</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skill Name *
              </label>
              <input
                type="text"
                value={newSkill.skill_name}
                onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                placeholder="e.g., JavaScript, Project Management"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proficiency Level
              </label>
              <select
                value={newSkill.proficiency_level}
                onChange={(e) => setNewSkill({ ...newSkill, proficiency_level: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                {proficiencyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleAddSkill}
              disabled={loading || !newSkill.skill_name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding...' : 'Add Skill'}
            </button>
            <button
              onClick={() => {
                setIsAddingSkill(false);
                setNewSkill({ skill_name: '', proficiency_level: 'Intermediate' });
                setError(null);
              }}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Skills List */}
      <div className="space-y-3">
        {skills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm">No skills added yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Skill" to get started</p>
          </div>
        ) : (
          skills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-gray-900">{skill.skill_name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency_level)}`}>
                    {skill.proficiency_level}
                  </span>
                </div>
                {skill.created_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Added {new Date(skill.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => handleDeleteSkill(skill.id, skill.skill_name)}
                disabled={loading}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Remove skill"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SkillManagement; 