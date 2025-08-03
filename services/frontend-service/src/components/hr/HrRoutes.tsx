import { Routes, Route, Navigate } from 'react-router-dom';
import { HrLayout, PostNewJob } from '.';
import ApplicantDetail from './ApplicantDetail';
import JobApplicants from './JobApplicants';
import TestDetails from './TestDetails';
import TestResultDetails from './TestResultDetails';

// Note: Authentication is now handled by parent ProtectedHrRoute in App.tsx
// This local protection is no longer needed as the entire /hr/* route is protected

const HrRoutes = () => {
    return (
        <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HrLayout activeTab="dashboard" />} />
            <Route path="messages" element={<HrLayout activeTab="messages" />} />
            <Route path="company-profile" element={<HrLayout activeTab="profile" />} />
            <Route path="job-applications" element={<HrLayout activeTab="applicants" />} />
            <Route path="job-applications/:id" element={<ApplicantDetail />} />
            <Route path="job-management" element={<HrLayout activeTab="listing" />} />
            <Route path="job-management/:id" element={<HrLayout activeTab='listing'><JobApplicants /></HrLayout>} />
            <Route path="post-job" element={<HrLayout activeTab='test'><PostNewJob /></HrLayout>} />
            <Route path="my-schedule" element={<HrLayout activeTab="schedule" />} />
            <Route path="settings" element={<HrLayout activeTab="settings" />} />
            <Route path="test-management" element={<HrLayout activeTab="test" />} />
            <Route path="test-management/:id" element={<HrLayout activeTab="test"><TestDetails /></HrLayout>} />
            <Route path="test-management/:id/results/:candidateId" element={<HrLayout activeTab="test"><TestResultDetails /></HrLayout>} />
            <Route path="help-center" element={<HrLayout activeTab="help" />} />
        </Routes>
    )
}

export default HrRoutes; 