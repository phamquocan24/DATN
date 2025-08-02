import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HrLayout, PostNewJob, JobManagement, JobApplications, HrCompanyProfile } from '.';
import ApplicantDetail from './ApplicantDetail';
import JobApplicants from './JobApplicants';
import TestDetails from './TestDetails';
import TestResultDetails from './TestResultDetails';

const ProtectedHrRoute = ({ children }: { children: React.ReactNode }) => {
    const isHr = true; // This should be replaced with actual auth logic
    if (!isHr) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

const HrRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ProtectedHrRoute><HrLayout activeTab="dashboard" /></ProtectedHrRoute>} />
            <Route path="messages" element={<ProtectedHrRoute><HrLayout activeTab="messages" /></ProtectedHrRoute>} />
            <Route path="company-profile" element={<ProtectedHrRoute><HrLayout activeTab="profile" /></ProtectedHrRoute>} />
            <Route path="job-applications" element={<ProtectedHrRoute><HrLayout activeTab="applicants" /></ProtectedHrRoute>} />
            <Route path="job-applications/:id" element={<ProtectedHrRoute><ApplicantDetail /></ProtectedHrRoute>} />
            <Route path="job-management" element={<ProtectedHrRoute><HrLayout activeTab="listing" /></ProtectedHrRoute>} />
            <Route path="job-management/:id" element={<ProtectedHrRoute><HrLayout activeTab='listing'><JobApplicants /></HrLayout></ProtectedHrRoute>} />
            <Route path="post-job" element={<ProtectedHrRoute><HrLayout activeTab='test'><PostNewJob /></HrLayout></ProtectedHrRoute>} />
            <Route path="my-schedule" element={<ProtectedHrRoute><HrLayout activeTab="schedule" /></ProtectedHrRoute>} />
            <Route path="settings" element={<ProtectedHrRoute><HrLayout activeTab="settings" /></ProtectedHrRoute>} />
            <Route path="test-management" element={<ProtectedHrRoute><HrLayout activeTab="test" /></ProtectedHrRoute>} />
            <Route path="test-management/:id" element={<ProtectedHrRoute><HrLayout activeTab="test"><TestDetails /></HrLayout></ProtectedHrRoute>} />
            <Route path="test-management/:id/results/:candidateId" element={<ProtectedHrRoute><HrLayout activeTab="test"><TestResultDetails /></HrLayout></ProtectedHrRoute>} />
            <Route path="help-center" element={<ProtectedHrRoute><HrLayout activeTab="help" /></ProtectedHrRoute>} />
        </Routes>
    )
}

export default HrRoutes; 