import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HrLayout, PostNewJob } from '.';
import ApplicantDetail from './ApplicantDetail';
import JobApplicants from './JobApplicants';
import TestDetails from './TestDetails';
import EditTest from './EditTest';
import TestResultDetails from './TestResultDetails';

// Note: Authentication is now handled by parent ProtectedHrRoute in App.tsx
// This local protection is no longer needed as the entire /hr/* route is protected

interface HrRoutesProps {
  currentUser?: any;
  onLogout?: () => void;
}

const HrRoutes: React.FC<HrRoutesProps> = ({ currentUser, onLogout }) => {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HrLayout activeTab="dashboard" currentUser={currentUser} onLogout={onLogout} />} />
            <Route path="company-profile" element={<HrLayout activeTab="profile" currentUser={currentUser} onLogout={onLogout} />} />
            <Route path="job-applications" element={<HrLayout activeTab="applicants" currentUser={currentUser} onLogout={onLogout} />} />
            <Route path="job-applications/:id" element={<ApplicantDetail />} />
            <Route path="job-management" element={<HrLayout activeTab="listing" currentUser={currentUser} onLogout={onLogout} />} />
            <Route path="job-management/:id" element={<HrLayout activeTab='listing' currentUser={currentUser} onLogout={onLogout}><JobApplicants /></HrLayout>} />
            <Route path="post-job" element={<HrLayout activeTab='test' currentUser={currentUser} onLogout={onLogout}><PostNewJob /></HrLayout>} />
            <Route path="my-schedule" element={<HrLayout activeTab="schedule" currentUser={currentUser} onLogout={onLogout} />} />
            <Route path="settings" element={<HrLayout activeTab="settings" currentUser={currentUser} onLogout={onLogout} />} />
            <Route path="test-management" element={<HrLayout activeTab="test" currentUser={currentUser} onLogout={onLogout} />} />
            <Route path="test-management/:id" element={<HrLayout activeTab="test" currentUser={currentUser} onLogout={onLogout}><TestDetails /></HrLayout>} />
            <Route path="test-management/:id/edit" element={<HrLayout activeTab="test" currentUser={currentUser} onLogout={onLogout}><EditTest /></HrLayout>} />
            <Route path="test-management/:id/results/:candidateId" element={<HrLayout activeTab="test" currentUser={currentUser} onLogout={onLogout}><TestResultDetails /></HrLayout>} />
            <Route path="help-center" element={<HrLayout activeTab="help" currentUser={currentUser} onLogout={onLogout} />} />
        </Routes>
    )
}

export default HrRoutes; 