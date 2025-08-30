import React from 'react';
import { Footer } from '../candidate/Footer';

const About: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-fade-in-left {
          animation: fadeInLeft 0.8s ease-out forwards;
        }
        
        .animate-fade-in-right {
          animation: fadeInRight 0.8s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-1200 {
          animation-delay: 1.2s;
        }
      `}</style>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="bg-[#007BFF] text-white overflow-hidden relative rounded-t-3xl">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
                About Our Platform
              </h1>
              <p className="text-xl md:text-2xl font-light max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
                Revolutionizing recruitment through intelligent matching and seamless connections between talent and opportunity
              </p>
            </div>
          </div>
          {/* Animated background elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-float animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/5 rounded-full animate-float animation-delay-500"></div>
        </div>

        {/* Mission Section */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="animate-fade-in-left">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-left">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed text-left">
                  We are dedicated to transforming the recruitment landscape by connecting exceptional talent with outstanding opportunities. Our platform leverages advanced AI technology and data-driven insights to create meaningful matches that benefit both candidates and employers.
                </p>
                <p className="text-lg text-gray-600 leading-relaxed text-left">
                  We believe that every professional deserves to find their ideal role, and every company should have access to the best talent. Through our innovative platform, we're making this vision a reality.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#007BFF]/10 to-[#007BFF]/20 rounded-2xl p-8 animate-fade-in-right">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 hover:transform hover:scale-105 transition-all duration-300">
                    <div className="bg-[#007BFF] text-white p-3 rounded-lg ">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 text-left">Lightning Fast</h3>
                      <p className="text-gray-600 text-left">Advanced algorithms for instant job matching</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 hover:transform hover:scale-105 transition-all duration-300">
                    <div className="bg-[#28A745] text-white p-3 rounded-lg ">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 text-left">Accurate Matching</h3>
                      <p className="text-gray-600 text-left">AI-powered compatibility scoring system</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 hover:transform hover:scale-105 transition-all duration-300">
                    <div className="bg-[#6F42C1] text-white p-3 rounded-lg ">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 text-left">Community Driven</h3>
                      <p className="text-gray-600 text-left">Building meaningful professional relationships</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Makes Us Different
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our platform combines cutting-edge technology with human insight to deliver unprecedented recruitment experiences
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 hover:transform hover:-translate-y-2 transition-all duration-300 animate-fade-in-up">
                <div className="bg-[#007BFF]/10 text-[#007BFF] p-4 rounded-lg w-fit mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-left">Smart AI Matching</h3>
                <p className="text-gray-600 leading-relaxed text-left">
                  Our proprietary AI algorithms analyze skills, experience, and career preferences to deliver highly accurate job matches that align with your professional goals.
                </p>
              </div>

              <div className="bg-white rounded-xl  p-8 hover:bg-gray-50 hover:transform hover:-translate-y-2 transition-all duration-300 animate-fade-in-up animation-delay-200">
                <div className="bg-[#28A745]/10 text-[#28A745] p-4 rounded-lg w-fit mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-left">Real-time Analytics</h3>
                <p className="text-gray-600 leading-relaxed text-left">
                  Comprehensive dashboard and analytics provide insights into application performance, market trends, and career progression opportunities.
                </p>
              </div>

              <div className="bg-white rounded-xl  p-8 hover:bg-gray-50 transition-shadow">
                <div className="bg-purple-100 text-purple-600 p-4 rounded-lg w-fit mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Secure & Private</h3>
                <p className="text-gray-600 leading-relaxed">
                  Bank-level security protocols protect your personal information, while our privacy-first approach ensures your job search remains confidential.
                </p>
              </div>

              <div className="bg-white rounded-xl  p-8 hover:bg-gray-50 transition-shadow">
                <div className="bg-orange-100 text-orange-600 p-4 rounded-lg w-fit mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Expert Network</h3>
                <p className="text-gray-600 leading-relaxed">
                  Connect with industry professionals, career mentors, and recruitment experts who can guide your professional journey.
                </p>
              </div>

              <div className="bg-white rounded-xl  p-8 hover:bg-gray-50 transition-shadow">
                <div className="bg-red-100 text-red-600 p-4 rounded-lg w-fit mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">24/7 Support</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our dedicated support team is available around the clock to help you navigate your career journey and resolve any technical issues.
                </p>
              </div>

              <div className="bg-white rounded-xl  p-8 hover:bg-gray-50 transition-shadow">
                <div className="bg-[#17A2B8]/10 text-[#17A2B8] p-4 rounded-lg w-fit mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Customizable Experience</h3>
                <p className="text-gray-600 leading-relaxed">
                  Tailor your platform experience with personalized preferences, custom alerts, and adaptive interfaces that evolve with your needs.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="py-20 bg-[#007BFF] text-white rounded-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trusted by Professionals Worldwide
              </h2>
              <p className="text-xl font-light max-w-3xl mx-auto">
                Join thousands of successful placements and career transformations
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">50K+</div>
                <div className="text-blue-100 font-medium">Active Candidates</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">1,200+</div>
                <div className="text-blue-100 font-medium">Partner Companies</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">15K+</div>
                <div className="text-blue-100 font-medium">Successful Placements</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold mb-2">95%</div>
                <div className="text-blue-100 font-medium">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Core Values
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center animate-fade-in-up">
                <div className="bg-[#007BFF]/10 text-[#007BFF] p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center hover:transform hover:scale-110 transition-all duration-300">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Passion</h3>
                <p className="text-gray-600 leading-relaxed">
                  We are passionate about connecting people with opportunities that transform lives and drive career success.
                </p>
              </div>

              <div className="text-center animate-fade-in-up animation-delay-200">
                <div className="bg-[#28A745]/10 text-[#28A745] p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center hover:transform hover:scale-110 transition-all duration-300">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Integrity</h3>
                <p className="text-gray-600 leading-relaxed">
                  We maintain the highest standards of honesty, transparency, and ethical conduct in all our interactions.
                </p>
              </div>

              <div className="text-center animate-fade-in-up animation-delay-400">
                <div className="bg-[#6F42C1]/10 text-[#6F42C1] p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center hover:transform hover:scale-110 transition-all duration-300">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Innovation</h3>
                <p className="text-gray-600 leading-relaxed">
                  We continuously innovate and embrace new technologies to enhance the recruitment experience for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 bg-[#007BFF] text-white rounded-3xl mb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl font-light mb-8 leading-relaxed">
              Join thousands of professionals who have found their dream jobs through our platform. Your next opportunity is just a click away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-[#007BFF] px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Get Started Today
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-[#007BFF] transition-colors">
                Explore Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default About;
