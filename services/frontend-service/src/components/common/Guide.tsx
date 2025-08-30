import React, { useState } from 'react';
import { Footer } from '../candidate/Footer';

const Guide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Platform Overview', icon: '🏠' },
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'candidate-guide', title: 'For Candidates', icon: '👤' },
    { id: 'hr-guide', title: 'For HR Managers', icon: '👥' },
    { id: 'admin-guide', title: 'For Administrators', icon: '⚙️' },
    { id: 'features', title: 'Key Features', icon: '✨' },
    { id: 'security', title: 'Security & Privacy', icon: '🔐' },
    { id: 'support', title: 'Support & FAQ', icon: '❓' }
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
        .animate-fade-in-left { animation: fadeInLeft 0.6s ease-out forwards; }
        .animate-slide-in-right { animation: slideInRight 0.6s ease-out forwards; }
        .animation-delay-200 { animation-delay: 0.2s; }
        .animation-delay-400 { animation-delay: 0.4s; }
      `}</style>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-[#007BFF] text-white rounded-t-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up">
                Platform Guide
              </h1>
              <p className="text-xl font-light mx-auto animate-fade-in-up animation-delay-200 whitespace-nowrap">
                Comprehensive documentation to help you make the most of our recruitment platform
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 sticky top-8 animate-fade-in-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-left">Table of Contents</h3>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-300 flex items-center space-x-3 hover:transform hover:scale-105 ${
                        activeSection === section.id
                          ? 'bg-[#007BFF]/10 text-[#007BFF] font-medium shadow-md'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-lg">{section.icon}</span>
                      <span>{section.title}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg p-8 animate-slide-in-right">
                
                {/* Platform Overview */}
                {activeSection === 'overview' && (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-left">Platform Overview</h2>
                    <div className="prose max-w-none">
                      <p className="text-lg text-gray-500 mb-6 text-left">
                        Welcome to our comprehensive recruitment platform - a cutting-edge solution that connects talented professionals with exceptional opportunities through intelligent matching and streamlined processes.
                      </p>
                      
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">What We Do</h3>
                      <p className="text-gray-500 mb-6 text-left">
                        Our platform serves as a bridge between job seekers and employers, utilizing advanced AI algorithms to create meaningful connections. We simplify the recruitment process while maintaining the human touch that makes successful placements possible.
                      </p>

                      <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-[#007BFF]/5 p-6 rounded-lg hover:transform hover:scale-105 transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#007BFF] mb-3 text-left">For Job Seekers</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• Personalized job recommendations</li>
                            <li>• AI-powered skill matching</li>
                            <li>• Career progression tracking</li>
                            <li>• Professional networking tools</li>
                          </ul>
                        </div>
                        <div className="bg-[#28A745]/5 p-6 rounded-lg hover:transform hover:scale-105 transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#28A745] mb-3 text-left">For Employers</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• Qualified candidate pipeline</li>
                            <li>• Advanced filtering & screening</li>
                            <li>• Recruitment analytics dashboard</li>
                            <li>• Streamlined hiring process</li>
                          </ul>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">System Architecture</h3>
                      <p className="text-gray-500 mb-4 text-left">
                        Our platform is built on modern cloud infrastructure with multiple user roles and comprehensive security measures:
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="hover:transform hover:scale-110 transition-all duration-300">
                            <div className="bg-[#007BFF]/10 text-[#007BFF] p-3 rounded-lg mb-2">👤</div>
                            <div className="font-medium">Candidates</div>
                            <div className="text-sm text-gray-500">Job Seekers</div>
                          </div>
                          <div className="hover:transform hover:scale-110 transition-all duration-300">
                            <div className="bg-[#28A745]/10 text-[#28A745] p-3 rounded-lg mb-2">👥</div>
                            <div className="font-medium">HR Managers</div>
                            <div className="text-sm text-gray-500">Recruiters</div>
                          </div>
                          <div className="hover:transform hover:scale-110 transition-all duration-300">
                            <div className="bg-[#6F42C1]/10 text-[#6F42C1] p-3 rounded-lg mb-2">⚙️</div>
                            <div className="font-medium">Administrators</div>
                            <div className="text-sm text-gray-500">System Managers</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Getting Started */}
                {activeSection === 'getting-started' && (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-left">Getting Started</h2>
                    <div className="prose max-w-none">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Account Registration</h3>
                      <p className="text-gray-500 mb-6 text-left">
                        Currently, our platform supports registration for two primary user types: <strong>Candidates</strong> and <strong>HR Managers</strong>. Administrator accounts are created internally by our team.
                      </p>

                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="border border-[#007BFF]/20 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center text-left">
                            <span className="bg-[#007BFF]/10 text-[#007BFF] p-2 rounded-lg mr-3">👤</span>
                            Candidate Registration
                          </h4>
                          <ol className="text-gray-500 space-y-3 text-left">
                            <li>1. Visit the registration page</li>
                            <li>2. Select "Job Seeker" as your account type</li>
                            <li>3. Provide your personal information</li>
                            <li>4. Verify your email address</li>
                            <li>5. Complete your professional profile</li>
                            <li>6. Upload your resume/CV</li>
                          </ol>
                        </div>

                        <div className="border border-[#28A745]/20 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center text-left">
                            <span className="bg-[#28A745]/10 text-[#28A745] p-2 rounded-lg mr-3">👥</span>
                            HR Manager Registration
                          </h4>
                          <ol className="text-gray-500 space-y-3 text-left">
                            <li>1. Visit the registration page</li>
                            <li>2. Select "HR Manager" as your account type</li>
                            <li>3. Provide company information</li>
                            <li>4. Verify your business email</li>
                            <li>5. Complete company profile setup</li>
                            <li>6. Begin posting job opportunities</li>
                          </ol>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h4>
                        <ul className="text-yellow-700 space-y-1 text-left">
                          <li>• Email verification is required for all accounts</li>
                          <li>• Company email domains are validated for HR accounts</li>
                          <li>• Profile completion improves matching accuracy</li>
                          <li>• Administrator accounts require special approval</li>
                        </ul>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Login Process</h3>
                      <p className="text-gray-500 mb-4 text-left">
                        Once registered, users can access the platform using their credentials:
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors duration-300">
                        <div className="flex items-center space-x-4">
                          <div className="bg-[#007BFF]/10 text-[#007BFF] p-2 rounded">🔐</div>
                          <div className="text-left">
                            <div className="font-medium">Secure Authentication</div>
                            <div className="text-sm text-gray-500">Multi-factor authentication available for enhanced security</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Candidate Guide */}
                {activeSection === 'candidate-guide' && (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-left">Candidate Guide</h2>
                    <div className="prose max-w-none">
                      <p className="text-lg text-gray-500 mb-6 text-left">
                        As a candidate, you have access to powerful tools designed to accelerate your job search and career advancement.
                      </p>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Core Features</h3>
                      
                      <div className="space-y-6 mb-8">
                        <div className="bg-gradient-to-r from-[#007BFF]/5 to-[#007BFF]/10 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#007BFF] mb-3 text-left">🔍 Job Discovery</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• <strong>Smart Search:</strong> Advanced filters by location, salary, skills, and company</li>
                            <li>• <strong>Personalized Recommendations:</strong> AI-curated job suggestions based on your profile</li>
                            <li>• <strong>Category Browsing:</strong> Explore opportunities by industry and job function</li>
                            <li>• <strong>Company Profiles:</strong> Research potential employers and company culture</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-[#28A745]/5 to-[#28A745]/10 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#28A745] mb-3 text-left">📄 Profile Management</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• <strong>Professional Profile:</strong> Showcase your experience, skills, and achievements</li>
                            <li>• <strong>Resume Builder:</strong> Create and manage multiple CV versions</li>
                            <li>• <strong>AI Analysis:</strong> Get match scores and improvement suggestions</li>
                            <li>• <strong>Portfolio Integration:</strong> Link to your professional portfolios and projects</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-[#6F42C1]/5 to-[#6F42C1]/10 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#6F42C1] mb-3 text-left">📊 Application Tracking</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• <strong>Application Dashboard:</strong> Monitor all your job applications in one place</li>
                            <li>• <strong>Status Updates:</strong> Real-time notifications on application progress</li>
                            <li>• <strong>Interview Scheduling:</strong> Coordinate meetings with potential employers</li>
                            <li>• <strong>Communication Hub:</strong> Direct messaging with HR representatives</li>
                          </ul>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Candidate Workflow</h3>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
                          <div className="text-center">
                            <div className="bg-[#007BFF] text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">1</div>
                            <div className="font-medium">Complete Profile</div>
                          </div>
                          <div className="hidden md:block text-gray-400">→</div>
                          <div className="text-center">
                            <div className="bg-[#007BFF] text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">2</div>
                            <div className="font-medium">Search Jobs</div>
                          </div>
                          <div className="hidden md:block text-gray-400">→</div>
                          <div className="text-center">
                            <div className="bg-[#007BFF] text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">3</div>
                            <div className="font-medium">Apply</div>
                          </div>
                          <div className="hidden md:block text-gray-400">→</div>
                          <div className="text-center">
                            <div className="bg-[#007BFF] text-white w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">4</div>
                            <div className="font-medium">Track Progress</div>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-8 text-left">Best Practices</h3>
                      <div className="bg-[#28A745]/5 border border-[#28A745]/20 rounded-lg p-6">
                        <ul className="text-gray-600 space-y-3 text-left">
                          <li>• <strong>Keep your profile updated:</strong> Regular updates improve match accuracy</li>
                          <li>• <strong>Use relevant keywords:</strong> Include industry-specific terms in your profile</li>
                          <li>• <strong>Be responsive:</strong> Quick responses to employer messages show professionalism</li>
                          <li>• <strong>Customize applications:</strong> Tailor cover letters for each position</li>
                          <li>• <strong>Network actively:</strong> Engage with company representatives and industry professionals</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* HR Guide */}
                {activeSection === 'hr-guide' && (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-left">HR Manager Guide</h2>
                    <div className="prose max-w-none">
                      <p className="text-lg text-gray-500 mb-6 text-left">
                        As an HR Manager, you have comprehensive tools to streamline your recruitment process and find the best candidates efficiently.
                      </p>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Core Capabilities</h3>
                      
                      <div className="space-y-6 mb-8">
                        <div className="bg-gradient-to-r from-[#28A745]/5 to-[#28A745]/10 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#28A745] mb-3 text-left">📝 Job Management</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• <strong>Job Posting:</strong> Create detailed job descriptions with requirements and benefits</li>
                            <li>• <strong>Multi-Channel Publishing:</strong> Distribute jobs across multiple platforms</li>
                            <li>• <strong>Template Library:</strong> Use pre-built templates for common positions</li>
                            <li>• <strong>Approval Workflows:</strong> Internal review process before publication</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-[#007BFF]/5 to-[#007BFF]/10 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#007BFF] mb-3 text-left">🎯 Candidate Screening</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• <strong>AI-Powered Matching:</strong> Automatic candidate ranking and scoring</li>
                            <li>• <strong>Advanced Filters:</strong> Filter by experience, skills, location, and availability</li>
                            <li>• <strong>Resume Analysis:</strong> Automated skill extraction and compatibility assessment</li>
                            <li>• <strong>Candidate Database:</strong> Search and browse existing candidate profiles</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-[#6F42C1]/5 to-[#6F42C1]/10 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#6F42C1] mb-3 text-left">📊 Analytics & Reporting</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• <strong>Recruitment Metrics:</strong> Track time-to-hire, cost-per-hire, and conversion rates</li>
                            <li>• <strong>Performance Dashboards:</strong> Visual insights into recruitment performance</li>
                            <li>• <strong>Candidate Journey:</strong> Analyze the complete recruitment funnel</li>
                            <li>• <strong>Custom Reports:</strong> Generate tailored reports for stakeholders</li>
                          </ul>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">HR Workflow</h3>
                      <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="bg-[#28A745] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">📝</div>
                            <div className="font-medium mb-1">Post Jobs</div>
                            <div className="text-sm text-gray-500">Create and publish job openings</div>
                          </div>
                          <div className="text-center">
                            <div className="bg-[#007BFF] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">👥</div>
                            <div className="font-medium mb-1">Review Applications</div>
                            <div className="text-sm text-gray-500">Screen and evaluate candidates</div>
                          </div>
                          <div className="text-center">
                            <div className="bg-[#6F42C1] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">📞</div>
                            <div className="font-medium mb-1">Conduct Interviews</div>
                            <div className="text-sm text-gray-500">Schedule and manage interviews</div>
                          </div>
                          <div className="text-center">
                            <div className="bg-[#FD7E14] text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">✅</div>
                            <div className="font-medium mb-1">Make Decisions</div>
                            <div className="text-sm text-gray-500">Select and onboard candidates</div>
                          </div>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Permissions & Access</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-yellow-800 mb-3">HR Manager Permissions</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-yellow-800 mb-2 text-left">✅ Allowed Actions:</h5>
                            <ul className="text-yellow-700 space-y-1 text-sm text-left">
                              <li>• Create and edit job postings</li>
                              <li>• Review candidate applications</li>
                              <li>• Access candidate profiles</li>
                              <li>• Manage interview schedules</li>
                              <li>• Generate recruitment reports</li>
                              <li>• Update company profile</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-yellow-800 mb-2 text-left">❌ Restricted Actions:</h5>
                            <ul className="text-yellow-700 space-y-1 text-sm text-left">
                              <li>• System administration tasks</li>
                              <li>• User account management</li>
                              <li>• Platform configuration changes</li>
                              <li>• Financial data access</li>
                              <li>• Advanced security settings</li>
                              <li>• API key management</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Guide */}
                {activeSection === 'admin-guide' && (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-left">Administrator Guide</h2>
                    <div className="prose max-w-none">
                      <p className="text-lg text-gray-500 mb-6 text-left">
                        Administrators have full platform access and are responsible for system management, user oversight, and platform configuration.
                      </p>

                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
                        <h4 className="text-lg font-semibold text-red-800 mb-2 text-left">🔒 Administrator Access</h4>
                        <p className="text-red-700 text-left">
                          Administrator accounts are created internally by our team and require special security clearance. Public registration is not available for this role.
                        </p>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Administrative Capabilities</h3>
                      
                      <div className="space-y-6 mb-8">
                        <div className="bg-gradient-to-r from-red-50/50 to-red-100/50 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#DC3545] mb-3 text-left">👥 User Management</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• <strong>Account Oversight:</strong> Monitor and manage all user accounts</li>
                            <li>• <strong>Role Assignment:</strong> Configure user permissions and access levels</li>
                            <li>• <strong>Account Verification:</strong> Approve and verify business accounts</li>
                            <li>• <strong>Suspension/Deactivation:</strong> Manage problematic accounts</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-[#6F42C1]/5 to-[#6F42C1]/10 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#6F42C1] mb-3 text-left">⚙️ System Configuration</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• <strong>Platform Settings:</strong> Configure global system parameters</li>
                            <li>• <strong>Feature Toggles:</strong> Enable/disable platform features</li>
                            <li>• <strong>API Management:</strong> Manage integrations and API access</li>
                            <li>• <strong>Security Policies:</strong> Configure authentication and security rules</li>
                          </ul>
                        </div>

                        <div className="bg-gradient-to-r from-[#007BFF]/5 to-[#007BFF]/10 p-6 rounded-lg hover:shadow-lg transition-all duration-300">
                          <h4 className="text-xl font-semibold text-[#007BFF] mb-3 text-left">📊 Analytics & Monitoring</h4>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• <strong>Platform Analytics:</strong> Monitor usage patterns and performance metrics</li>
                            <li>• <strong>System Health:</strong> Track server performance and uptime</li>
                            <li>• <strong>User Behavior:</strong> Analyze user engagement and feature adoption</li>
                            <li>• <strong>Financial Reporting:</strong> Access revenue and billing information</li>
                          </ul>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Administrative Responsibilities</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors duration-300">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 text-left">Daily Operations</h4>
                          <ul className="text-gray-500 space-y-2 text-left">
                            <li>• Monitor system performance</li>
                            <li>• Review user reports and issues</li>
                            <li>• Approve pending verifications</li>
                            <li>• Update system configurations</li>
                          </ul>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg hover:bg-gray-100 transition-colors duration-300">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 text-left">Strategic Tasks</h4>
                          <ul className="text-gray-500 space-y-2 text-left">
                            <li>• Platform optimization planning</li>
                            <li>• Security policy updates</li>
                            <li>• Feature rollout management</li>
                            <li>• Stakeholder reporting</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features */}
                {activeSection === 'features' && (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-left">Key Features</h2>
                    <div className="prose max-w-none">
                      <p className="text-lg text-gray-500 mb-8 text-left">
                        Explore the comprehensive feature set that makes our platform the preferred choice for modern recruitment.
                      </p>

                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl hover:transform hover:-translate-y-2 transition-all duration-300">
                          <div className="bg-[#007BFF]/10 text-[#007BFF] p-3 rounded-lg w-fit mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">AI-Powered Matching</h3>
                          <p className="text-gray-500 text-left">
                            Advanced machine learning algorithms analyze skills, experience, and preferences to create highly accurate job-candidate matches with detailed compatibility scores.
                          </p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl hover:transform hover:-translate-y-2 transition-all duration-300">
                          <div className="bg-[#28A745]/10 text-[#28A745] p-3 rounded-lg w-fit mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">Real-time Analytics</h3>
                          <p className="text-gray-500 text-left">
                            Comprehensive dashboards provide insights into recruitment performance, candidate engagement, and market trends with real-time data updates.
                          </p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl hover:transform hover:-translate-y-2 transition-all duration-300">
                          <div className="bg-[#6F42C1]/10 text-[#6F42C1] p-3 rounded-lg w-fit mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">Enterprise Security</h3>
                          <p className="text-gray-500 text-left">
                            Bank-level encryption, multi-factor authentication, and compliance with international data protection standards ensure your information remains secure.
                          </p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl hover:transform hover:-translate-y-2 transition-all duration-300">
                          <div className="bg-[#FD7E14]/10 text-[#FD7E14] p-3 rounded-lg w-fit mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3 text-left">Integrated Communication</h3>
                          <p className="text-gray-500 text-left">
                            Built-in messaging system, video interview scheduling, and automated notifications streamline communication between all parties.
                          </p>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Advanced Capabilities</h3>
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg">
                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900 mb-2">🔄 Automated Workflows</h4>
                            <p className="text-gray-500 text-sm">Streamline repetitive tasks with customizable automation rules and triggers.</p>
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900 mb-2">🌐 Multi-Platform Integration</h4>
                            <p className="text-gray-500 text-sm">Connect with popular job boards, social networks, and HR systems.</p>
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-gray-900 mb-2">📱 Mobile Responsive</h4>
                            <p className="text-gray-500 text-sm">Full functionality across all devices with native mobile optimization.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security */}
                {activeSection === 'security' && (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-left">Security & Privacy</h2>
                    <div className="prose max-w-none">
                      <p className="text-lg text-gray-500 mb-8 text-left">
                        We take security and privacy seriously, implementing industry-leading measures to protect your data and ensure platform integrity.
                      </p>

                      <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                          <h3 className="text-xl font-semibold text-[#DC3545] mb-4 text-left">🔐 Data Protection</h3>
                          <ul className="text-gray-600 space-y-3 text-left">
                            <li>• <strong>Encryption:</strong> AES-256 encryption for data at rest and in transit</li>
                            <li>• <strong>Access Control:</strong> Role-based permissions and principle of least privilege</li>
                            <li>• <strong>Data Backup:</strong> Automated daily backups with geographic redundancy</li>
                            <li>• <strong>Compliance:</strong> GDPR, CCPA, and SOC 2 Type II compliant</li>
                          </ul>
                        </div>

                        <div className="bg-[#007BFF]/5 border border-[#007BFF]/20 rounded-lg p-6 hover:shadow-lg transition-all duration-300">
                          <h3 className="text-xl font-semibold text-[#007BFF] mb-4 text-left">🛡️ Platform Security</h3>
                          <ul className="text-gray-600 space-y-3 text-left">
                            <li>• <strong>Authentication:</strong> Multi-factor authentication (MFA) support</li>
                            <li>• <strong>Session Management:</strong> Secure token-based authentication</li>
                            <li>• <strong>Monitoring:</strong> 24/7 security monitoring and threat detection</li>
                            <li>• <strong>Updates:</strong> Regular security patches and vulnerability assessments</li>
                          </ul>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Privacy Controls</h3>
                      <div className="bg-[#28A745]/5 border border-[#28A745]/20 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-[#28A745] mb-3 text-left">User Privacy Rights</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• Control profile visibility settings</li>
                            <li>• Manage data sharing preferences</li>
                            <li>• Request data export or deletion</li>
                            <li>• Anonymous browsing options</li>
                          </ul>
                          <ul className="text-gray-600 space-y-2 text-left">
                            <li>• Consent management system</li>
                            <li>• Opt-out of data processing</li>
                            <li>• Communication preferences</li>
                            <li>• Right to data portability</li>
                          </ul>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Reporting Security Issues</h3>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <p className="text-yellow-800 mb-4 text-left">
                          If you discover a security vulnerability or have concerns about data protection, please contact our security team immediately:
                        </p>
                        <div className="bg-yellow-100 p-4 rounded border border-yellow-300">
                          <div className="font-medium text-yellow-900">🚨 Security Contact</div>
                          <div className="text-yellow-800 mt-2 text-left">
                            Email: security@platform.com<br/>
                            Response Time: Within 24 hours<br/>
                            Encryption: PGP key available upon request
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Support */}
                {activeSection === 'support' && (
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 text-left">Support & FAQ</h2>
                    <div className="prose max-w-none">
                      <p className="text-lg text-gray-500 mb-8 text-left">
                        Get help when you need it with our comprehensive support resources and frequently asked questions.
                      </p>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Contact Support</h3>
                      <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-[#007BFF]/5 border border-[#007BFF]/20 rounded-lg p-6 text-center hover:shadow-lg transition-all duration-300">
                          <div className="bg-[#007BFF]/10 text-[#007BFF] p-3 rounded-lg w-fit mx-auto mb-4">📧</div>
                          <h4 className="font-semibold text-[#007BFF] mb-2">Email Support</h4>
                          <p className="text-gray-600 text-sm">support@platform.com</p>
                          <p className="text-[#007BFF] text-xs mt-2">Response within 24 hours</p>
                        </div>
                        <div className="bg-[#28A745]/5 border border-[#28A745]/20 rounded-lg p-6 text-center hover:shadow-lg transition-all duration-300">
                          <div className="bg-[#28A745]/10 text-[#28A745] p-3 rounded-lg w-fit mx-auto mb-4">💬</div>
                          <h4 className="font-semibold text-[#28A745] mb-2">Live Chat</h4>
                          <p className="text-gray-600 text-sm">Available 9 AM - 6 PM</p>
                          <p className="text-[#28A745] text-xs mt-2">Mon-Fri, business days</p>
                        </div>
                        <div className="bg-[#6F42C1]/5 border border-[#6F42C1]/20 rounded-lg p-6 text-center hover:shadow-lg transition-all duration-300">
                          <div className="bg-[#6F42C1]/10 text-[#6F42C1] p-3 rounded-lg w-fit mx-auto mb-4">📞</div>
                          <h4 className="font-semibold text-[#6F42C1] mb-2">Phone Support</h4>
                          <p className="text-gray-600 text-sm">+1 (555) 123-4567</p>
                          <p className="text-[#6F42C1] text-xs mt-2">Enterprise customers only</p>
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-left">Frequently Asked Questions</h3>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-300">
                          <h4 className="font-semibold text-gray-900 mb-2 text-left">How do I reset my password?</h4>
                          <p className="text-gray-500 text-left">
                            Click the "Forgot Password" link on the login page, enter your email address, and follow the instructions sent to your inbox. If you don't receive an email within 10 minutes, check your spam folder.
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-300">
                          <h4 className="font-semibold text-gray-900 mb-2 text-left">Can I change my account type from Candidate to HR Manager?</h4>
                          <p className="text-gray-500 text-left">
                            Account type changes require manual approval. Contact our support team with your business email and company information to initiate the conversion process.
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-300">
                          <h4 className="font-semibold text-gray-900 mb-2 text-left">How is my match score calculated?</h4>
                          <p className="text-gray-500 text-left">
                            Our AI algorithm analyzes multiple factors including skills alignment, experience level, location preferences, salary expectations, and career goals to generate a compatibility percentage.
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-300">
                          <h4 className="font-semibold text-gray-900 mb-2 text-left">Is my personal information secure?</h4>
                          <p className="text-gray-500 text-left">
                            Yes, we use bank-level encryption and follow strict security protocols. Your data is protected by industry-standard measures and we never share personal information without your explicit consent.
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors duration-300">
                          <h4 className="font-semibold text-gray-900 mb-2 text-left">How can I improve my job match results?</h4>
                          <p className="text-gray-500 text-left">
                            Keep your profile updated with current skills, complete all profile sections, use industry-relevant keywords, and regularly update your job preferences and availability status.
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#007BFF]/5 border border-[#007BFF]/20 rounded-lg p-6 mt-8">
                        <h4 className="text-lg font-semibold text-[#007BFF] mb-3 text-left">📚 Additional Resources</h4>
                        <ul className="text-gray-600 space-y-2 text-left">
                          <li>• <strong>Video Tutorials:</strong> Step-by-step guides for common tasks</li>
                          <li>• <strong>Knowledge Base:</strong> Comprehensive documentation and articles</li>
                          <li>• <strong>Community Forum:</strong> Connect with other users and share experiences</li>
                          <li>• <strong>Webinar Series:</strong> Regular training sessions and platform updates</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Guide;