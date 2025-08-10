import React, { useState } from 'react';
import { FiSearch, FiMoreHorizontal, FiMessageSquare } from 'react-icons/fi';

const HelpCenter: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState('Getting Started');

  const topics = [
    'Getting Started',
    'My Profile',
    'Applying for a job',
    'Job Search Tips',
    'Job Alerts',
  ];

  const faqs = [
    { 
      question: 'What is My Applications?', 
      answer: 'My Applications is a way for you to track jobs as you move through the application process. Depending on the job you applied to, you may also receive notifications indicating that an application has been actioned by an employer.' 
    },
    { 
      question: 'How to access my applications history', 
      answer: 'To access applications history, go to your My Applications page on your dashboard. From here you can view all the positions you have applied to.' 
    },
    { 
      question: 'Not seeing jobs you applied in My Applications?', 
      answer: "Please note that we are unable to track materials submitted for jobs you apply to via an employer's site. As a result, these applications are not recorded in the My Applications section of your Jobtuntly account. We suggest keeping a personal record of all positions you have applied to externally." 
    },
  ];

  return (
    <div className="bg-white p-0 relative text-left">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Help Center</h1>
        <button className="border border-[#007BFF] text-[#007BFF] px-4 py-2 rounded-lg font-semibold hover:bg-blue-50">
          Back to homepage
        </button>
      </div>

      <div className="flex gap-8">
        {/* Left Column */}
        <div className="w-1/3 flex flex-col">
          <div>
            <div className="mb-6">
                <label className="text-sm font-medium text-gray-700">Type your question or search keyword</label>
                <div className="relative mt-2">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                </div>
            </div>
            <div className="space-y-1">
                {topics.map(topic => (
                <button 
                    key={topic}
                    onClick={() => setActiveTopic(topic)}
                    className={`w-full text-left p-3 rounded-lg text-gray-700 ${activeTopic === topic ? 'bg-blue-100 text-[#007BFF] font-semibold' : 'hover:text-[#007BFF]'}`}
                >
                    {topic}
                </button>
                ))}
            </div>
          </div>
          <div className="mt-auto">
            <div className="p-6 bg-[#007BFF] rounded-lg text-white text-left">
                    <h3 className="font-semibold text-lg mb-2">Didn't find what you were looking for?</h3>
                    <p className="text-sm mb-4">Contact our customer service</p>
                    <button className="bg-white text-[#007BFF] font-semibold px-6 py-2 rounded-lg">Contact Us</button>
                </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-2/3">
          <div className="flex justify-end items-center mb-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Sort by:</span>
              <select className="font-semibold border-none bg-transparent p-1 focus:ring-0">
                <option>Most relevant</option>
              </select>
            </div>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="p-6 border rounded-lg bg-white shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-800">{faq.question}</h3>
                  <button className="text-gray-400"><FiMoreHorizontal /></button>
                </div>
                <p className="text-gray-600 mb-6">{faq.answer}</p>
                <div className="flex items-center gap-4 text-sm pt-4 border-t">
                  <span className="text-gray-600">Was this article helpful?</span>
                  <button className="flex items-center gap-1 border border-[#007BFF] text-[#007BFF] rounded-md px-3 py-1 hover:bg-blue-50">+ Yes</button>
                  <button className="flex items-center gap-1 border border-[#007BFF] text-[#007BFF] rounded-md px-3 py-1 hover:bg-blue-50">+ No</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Floating Chat Button */}
      <button className="fixed bottom-8 right-8 bg-gray-800 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
        <FiMessageSquare size={24} />
      </button>
    </div>
  );
};

export default HelpCenter; 