import React, { useState, useEffect } from 'react';
import { CVExtractResponse } from '../../services/cvApi';

interface CVPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: CVExtractResponse | null;
  onSave: (editedData: CVExtractResponse) => void;
  onApplyToProfile?: (data: CVExtractResponse) => void;
}

export const CVPreviewModal: React.FC<CVPreviewModalProps> = ({
  isOpen,
  onClose,
  extractedData,
  onSave,
  onApplyToProfile
}) => {
  // Debug log when modal opens
  useEffect(() => {
    if (isOpen && extractedData) {
      console.log('CV Preview Modal opened with extracted data:', extractedData);
    }
  }, [isOpen, extractedData]);
  const [editedData, setEditedData] = useState<CVExtractResponse | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (extractedData) {
      console.log('Loading extracted data into form:', extractedData);
      setEditedData({ ...extractedData });
      setIsEditing(false); // Reset editing mode when new data is loaded
    }
  }, [extractedData]);

  if (!isOpen || !editedData) {
    console.log('Modal not open or no edited data:', { isOpen, editedData });
    return null;
  }

  const handleFieldChange = (section: string, field: string, value: any) => {
    setEditedData(prev => {
      if (!prev) return null;
      
      // For top-level fields like full_name, email, phone, etc.
      if (section === field) {
        return {
          ...prev,
          [field]: value
        };
      }
      
      // For nested objects or arrays
      return {
        ...prev,
        [section]: typeof (prev as any)[section] === 'object' && Array.isArray((prev as any)[section])
          ? value
          : {
              ...(prev as any)[section],
              [field]: value
            }
      };
    });
  };

  const handleArrayItemChange = (section: string, index: number, field: string, value: any) => {
    setEditedData(prev => {
      if (!prev) return null;
      const array = [...((prev as any)[section] as any[])];
      array[index] = {
        ...array[index],
        [field]: value
      };
      return {
        ...prev,
        [section]: array
      };
    });
  };

  const addArrayItem = (section: string, template: any) => {
    setEditedData(prev => {
      if (!prev) return null;
      const array = [...((prev as any)[section] as any[])];
      array.push(template);
      return {
        ...prev,
        [section]: array
      };
    });
  };

  const removeArrayItem = (section: string, index: number) => {
    setEditedData(prev => {
      if (!prev) return null;
      const array = [...((prev as any)[section] as any[])];
      array.splice(index, 1);
      return {
        ...prev,
        [section]: array
      };
    });
  };

  const handleSave = () => {
    if (editedData) {
      onSave(editedData);
      setIsEditing(false);
    }
  };

  const handleApplyToProfile = () => {
    if (editedData && onApplyToProfile) {
      onApplyToProfile(editedData);
    }
  };



  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: '👤' },
    { id: 'education', name: 'Education', icon: '🎓' },
    { id: 'experience', name: 'Experience', icon: '💼' },
    { id: 'skills', name: 'Skills', icon: '⚡' },
    { id: 'projects', name: 'Projects', icon: '🚀' },
    { id: 'others', name: 'Others', icon: '📄' }
  ];

  const renderPersonalInfo = () => {
    console.log('Rendering personal info with data:', editedData);
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 text-left">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Full Name</label>
            <input
              type="text"
              value={editedData?.full_name || ''}
              onChange={(e) => handleFieldChange('full_name', 'full_name', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
              disabled={!isEditing}
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Email</label>
            <input
              type="email"
              value={editedData?.email || ''}
              onChange={(e) => handleFieldChange('email', 'email', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
              disabled={!isEditing}
              placeholder="Enter email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Phone</label>
            <input
              type="tel"
              value={editedData?.phone || ''}
              onChange={(e) => handleFieldChange('phone', 'phone', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
              disabled={!isEditing}
              placeholder="Enter phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Address</label>
            <input
              type="text"
              value={editedData?.address || ''}
              onChange={(e) => handleFieldChange('address', 'address', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
              disabled={!isEditing}
              placeholder="Enter address"
            />
          </div>
        </div>
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Objective</label>
          <textarea
            value={editedData?.objective || ''}
            onChange={(e) => handleFieldChange('objective', 'objective', e.target.value)}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
            disabled={!isEditing}
            placeholder="Enter career objective"
          />
        </div>
      </div>
    );
  };

  const renderEducation = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 text-left">Education</h3>
        {isEditing && (
          <button
            onClick={() => addArrayItem('education', {
              school: '',
              degree: '',
              field: '',
              start_date: '',
              end_date: '',
              gpa: ''
            })}
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
          >
            Add Education
          </button>
        )}
      </div>
      {(editedData?.education || []).map((edu, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-md font-medium text-gray-800 text-left">Education {index + 1}</h4>
            {isEditing && (
              <button
                onClick={() => removeArrayItem('education', index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">School</label>
              <input
                type="text"
                value={edu.school || ''}
                onChange={(e) => handleArrayItemChange('education', index, 'school', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Degree</label>
              <input
                type="text"
                value={edu.degree || ''}
                onChange={(e) => handleArrayItemChange('education', index, 'degree', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Field</label>
              <input
                type="text"
                value={edu.field || ''}
                onChange={(e) => handleArrayItemChange('education', index, 'field', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">GPA</label>
              <input
                type="text"
                value={edu.gpa || ''}
                onChange={(e) => handleArrayItemChange('education', index, 'gpa', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Start Date</label>
              <input
                type="text"
                value={edu.start_date || ''}
                onChange={(e) => handleArrayItemChange('education', index, 'start_date', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">End Date</label>
              <input
                type="text"
                value={edu.end_date || ''}
                onChange={(e) => handleArrayItemChange('education', index, 'end_date', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 text-left">Work Experience</h3>
        {isEditing && (
          <button
            onClick={() => addArrayItem('experience', {
              company: '',
              position: '',
              start_date: '',
              end_date: '',
              description: ''
            })}
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
          >
            Add Experience
          </button>
        )}
      </div>
      {(editedData?.experience || []).map((exp, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-md font-medium text-gray-800 text-left">Experience {index + 1}</h4>
            {isEditing && (
              <button
                onClick={() => removeArrayItem('experience', index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Company</label>
              <input
                type="text"
                value={exp.company || ''}
                onChange={(e) => handleArrayItemChange('experience', index, 'company', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Position</label>
              <input
                type="text"
                value={exp.position || ''}
                onChange={(e) => handleArrayItemChange('experience', index, 'position', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Start Date</label>
              <input
                type="text"
                value={exp.start_date || ''}
                onChange={(e) => handleArrayItemChange('experience', index, 'start_date', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">End Date</label>
              <input
                type="text"
                value={exp.end_date || ''}
                onChange={(e) => handleArrayItemChange('experience', index, 'end_date', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Description</label>
            <textarea
              value={exp.description || ''}
              onChange={(e) => handleArrayItemChange('experience', index, 'description', e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
              disabled={!isEditing}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 text-left">Skills</h3>
        {isEditing && (
          <button
            onClick={() => addArrayItem('skills', {
              skill_name: '',
              skill_type: '',
              proficiency_level: ''
            })}
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
          >
            Add Skill
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(editedData?.skills || []).map((skill, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-medium text-gray-800 text-left">Skill {index + 1}</h4>
              {isEditing && (
                <button
                  onClick={() => removeArrayItem('skills', index)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Skill Name</label>
                <input
                  type="text"
                  value={skill.skill_name || ''}
                  onChange={(e) => handleArrayItemChange('skills', index, 'skill_name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-left"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Type</label>
                <input
                  type="text"
                  value={skill.skill_type || ''}
                  onChange={(e) => handleArrayItemChange('skills', index, 'skill_type', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-left"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Proficiency</label>
                <select
                  value={skill.proficiency_level || ''}
                  onChange={(e) => handleArrayItemChange('skills', index, 'proficiency_level', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-left"
                  disabled={!isEditing}
                >
                  <option value="">Select level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 text-left">Projects</h3>
        {isEditing && (
          <button
            onClick={() => addArrayItem('projects', {
              name: '',
              description: '',
              technologies: [],
              start_date: '',
              end_date: ''
            })}
            className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
          >
            Add Project
          </button>
        )}
      </div>
      {(editedData?.projects || []).map((project, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-md font-medium text-gray-800 text-left">Project {index + 1}</h4>
            {isEditing && (
              <button
                onClick={() => removeArrayItem('projects', index)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Project Name</label>
              <input
                type="text"
                value={project.name || ''}
                onChange={(e) => handleArrayItemChange('projects', index, 'name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Technologies</label>
              <input
                type="text"
                value={Array.isArray(project.technologies) ? project.technologies.join(', ') : project.technologies || ''}
                onChange={(e) => handleArrayItemChange('projects', index, 'technologies', e.target.value.split(', '))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
                placeholder="Comma-separated technologies"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Start Date</label>
              <input
                type="text"
                value={project.start_date || ''}
                onChange={(e) => handleArrayItemChange('projects', index, 'start_date', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-left">End Date</label>
              <input
                type="text"
                value={project.end_date || ''}
                onChange={(e) => handleArrayItemChange('projects', index, 'end_date', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
                disabled={!isEditing}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Description</label>
            <textarea
              value={project.description || ''}
              onChange={(e) => handleArrayItemChange('projects', index, 'description', e.target.value)}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left"
              disabled={!isEditing}
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderOthers = () => (
    <div className="space-y-6">
      {/* Certifications */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 text-left">Certifications</h3>
          {isEditing && (
            <button
              onClick={() => addArrayItem('certifications', {
                name: '',
                issuer: '',
                date: ''
              })}
              className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
            >
              Add Certification
            </button>
          )}
        </div>
        {(editedData?.certifications || []).map((cert, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-medium text-gray-800 text-left">Certification {index + 1}</h4>
              {isEditing && (
                <button
                  onClick={() => removeArrayItem('certifications', index)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Name</label>
                <input
                  type="text"
                  value={cert.name || ''}
                  onChange={(e) => handleArrayItemChange('certifications', index, 'name', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-left"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Issuer</label>
                <input
                  type="text"
                  value={cert.issuer || ''}
                  onChange={(e) => handleArrayItemChange('certifications', index, 'issuer', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-left"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Date</label>
                <input
                  type="text"
                  value={cert.date || ''}
                  onChange={(e) => handleArrayItemChange('certifications', index, 'date', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-left"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Languages */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 text-left">Languages</h3>
          {isEditing && (
            <button
              onClick={() => addArrayItem('languages', {
                language: '',
                proficiency: ''
              })}
              className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600"
            >
              Add Language
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(editedData?.languages || []).map((lang, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-gray-800 text-left">Language {index + 1}</h4>
                {isEditing && (
                  <button
                    onClick={() => removeArrayItem('languages', index)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Language</label>
                  <input
                    type="text"
                    value={lang.language || ''}
                    onChange={(e) => handleArrayItemChange('languages', index, 'language', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-left"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1 text-left">Proficiency</label>
                  <select
                    value={lang.proficiency || ''}
                    onChange={(e) => handleArrayItemChange('languages', index, 'proficiency', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-left"
                    disabled={!isEditing}
                  >
                    <option value="">Select level</option>
                    <option value="Basic">Basic</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Native">Native</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'education':
        return renderEducation();
      case 'experience':
        return renderExperience();
      case 'skills':
        return renderSkills();
      case 'projects':
        return renderProjects();
      case 'others':
        return renderOthers();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 text-left">CV Preview & Edit</h2>
            <p className="text-gray-600 text-sm text-left">Review and edit extracted information from your CV</p>
          </div>
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit
                </button>
                {onApplyToProfile && (
                  <button
                    onClick={handleApplyToProfile}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Apply to Profile
                  </button>
                )}
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tabs */}
          <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVPreviewModal;
