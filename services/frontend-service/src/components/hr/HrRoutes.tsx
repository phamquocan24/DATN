import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HrLayout, PostNewJob } from '.';
import ApplicantDetail from './ApplicantDetail';
import JobApplicants from './JobApplicants';
import TestDetails from './TestDetails';
import TestResultDetails from './TestResultDetails';

// Note: Authentication is now handled by parent ProtectedHrRoute in App.tsx
// This local protection is no longer needed as the entire /hr/* route is protected

interface HrRoutesProps {
  currentUser?: any;
}

const HrRoutes: React.FC<HrRoutesProps> = ({ currentUser }) => {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HrLayout activeTab="dashboard" currentUser={currentUser} />} />
            <Route path="messages" element={<HrLayout activeTab="messages" currentUser={currentUser} />} />
            <Route path="company-profile" element={<HrLayout activeTab="profile" currentUser={currentUser} />} />
            <Route path="job-applications" element={<HrLayout activeTab="applicants" currentUser={currentUser} />} />
            <Route path="job-applications/:id" element={<ApplicantDetail />} />
            <Route path="job-management" element={<HrLayout activeTab="listing" currentUser={currentUser} />} />
            <Route path="job-management/:id" element={<HrLayout activeTab='listing' currentUser={currentUser}><JobApplicants /></HrLayout>} />
            <Route path="post-job" element={<HrLayout activeTab='test' currentUser={currentUser}><PostNewJob /></HrLayout>} />
            <Route path="my-schedule" element={<HrLayout activeTab="schedule" currentUser={currentUser} />} />
            <Route path="settings" element={<HrLayout activeTab="settings" currentUser={currentUser} />} />
            <Route path="test-management" element={<HrLayout activeTab="test" currentUser={currentUser} />} />
            <Route path="test-management/:id" element={<HrLayout activeTab="test" currentUser={currentUser}><TestDetails /></HrLayout>} />
            <Route path="test-management/:id/results/:candidateId" element={<HrLayout activeTab="test" currentUser={currentUser}><TestResultDetails /></HrLayout>} />
            <Route path="help-center" element={<HrLayout activeTab="help" currentUser={currentUser} />} />
        </Routes>
    )
}

export default HrRoutes; 