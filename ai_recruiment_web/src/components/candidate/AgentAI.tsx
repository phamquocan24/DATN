import React, { useState } from 'react';
import Avatar from '../../assets/Avatar17.png';
import DashboardSidebar from './DashboardSidebar';

interface Message {
  id: number;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
  avatar?: string;
}

interface ChatUser {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isOnline?: boolean;
}

interface AgentAIProps {
  onHomeClick?: () => void;
  onProfileClick?: () => void;
  onMyApplicationsClick?: () => void;
  onBrowseCompaniesClick?: () => void;
  onDashboardClick?: () => void;
  onFindJobsClick?: () => void;
  onTestManagementClick?: () => void;
  onSettingsClick?: () => void;
  onHelpCenterClick?: () => void;
}

const AgentAI: React.FC<AgentAIProps> = ({ 
  onHomeClick,
  onProfileClick,
  onMyApplicationsClick,
  onBrowseCompaniesClick,
  onDashboardClick,
  onFindJobsClick,
  onTestManagementClick,
  onSettingsClick,
  onHelpCenterClick
}) => {
  // Agent AI states
  const [selectedChat, setSelectedChat] = useState<number>(1);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');



  // Agent AI data
  const chatUsers: ChatUser[] = [
    {
      id: 1,
      name: 'Jan Mayer',
      avatar: Avatar,
      lastMessage: 'We want to invite you for a qui...',
      timestamp: '12 mins ago',
      isOnline: true
    },
    {
      id: 2,
      name: 'Joe Bartmann',
      avatar: Avatar,
      lastMessage: 'Hey thanks for your interview...',
      timestamp: '3:40 PM'
    },
    {
      id: 3,
      name: 'Ally Wales',
      avatar: Avatar,
      lastMessage: 'Hey thanks for your interview...',
      timestamp: '3:40 PM'
    },
    {
      id: 4,
      name: 'James Gardner',
      avatar: Avatar,
      lastMessage: 'Hey thanks for your interview...',
      timestamp: '3:40 PM'
    },
    {
      id: 5,
      name: 'Allison Geidt',
      avatar: Avatar,
      lastMessage: 'Hey thanks for your interview...',
      timestamp: '3:40 PM'
    },
    {
      id: 6,
      name: 'Ruben Culhane',
      avatar: Avatar,
      lastMessage: 'Hey thanks for your interview...',
      timestamp: '3:40 PM'
    },
    {
      id: 7,
      name: 'Lydia Diaz',
      avatar: Avatar,
      lastMessage: 'Hey thanks for your interview...',
      timestamp: '3:40 PM'
    },
    {
      id: 8,
      name: 'James Dokidis',
      avatar: Avatar,
      lastMessage: 'Hey thanks for your interview...',
      timestamp: '3:40 PM'
    },
    {
      id: 9,
      name: 'Angelina Swann',
      avatar: Avatar,
      lastMessage: 'Hey thanks for your interview...',
      timestamp: '3:40 PM'
    }
  ];

  const messages: Message[] = [
    {
      id: 1,
      sender: 'agent',
      content: 'Hey Jake, I wanted to reach out because we saw your work contributions and were impressed by your work.',
      timestamp: '12 mins ago',
      avatar: Avatar
    },
    {
      id: 2,
      sender: 'agent',
      content: 'We want to invite you for a quick interview',
      timestamp: '12 mins ago',
      avatar: Avatar
    },
    {
      id: 3,
      sender: 'user',
      content: 'Hi Jan, sure I would love to. Thanks for taking the time to see my work!',
      timestamp: '12 mins ago',
      avatar: Avatar
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Logic to send message would go here
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const selectedUser = chatUsers.find(user => user.id === selectedChat);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab="agent-ai"
        onDashboardClick={onDashboardClick}
        onAgentAIClick={() => {}}
        onMyApplicationsClick={onMyApplicationsClick}
        onTestManagementClick={onTestManagementClick}
        onFindJobsClick={onFindJobsClick}
        onBrowseCompaniesClick={onBrowseCompaniesClick}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
        onHelpCenterClick={onHelpCenterClick}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat List */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900">Agent AI</h1>
              <button 
                onClick={onHomeClick}
                className="px-4 py-2 text-[#007BFF] hover:text-white font-medium border border-[#007BFF] rounded-lg hover:bg-[#007BFF] transition-colors"
              >
                Back to homepage
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search chat history"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {chatUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedChat(user.id)}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedChat === user.id ? 'bg-blue-50 border-l-4 border-l-[#007BFF]' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full" />
                    {user.isOnline && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900 truncate">{user.name}</h3>
                      <span className="text-xs text-gray-500">{user.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">{user.lastMessage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={selectedUser?.avatar} alt={selectedUser?.name} className="w-10 h-10 rounded-full" />
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedUser?.name}</h2>
                  <p className="text-sm text-gray-500">Recruiter at Nomad</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-gray-500">This is the very beginning of your direct message with <span className="font-medium">Jan Mayer</span></p>
            </div>
            
            <div className="text-center">
              <button className="text-sm text-gray-600 hover:text-gray-800 flex items-center mx-auto">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Today
              </button>
            </div>

            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <img src={message.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                  <div className={`px-4 py-2 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-[#007BFF] text-white' 
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="text-center">
              <span className="text-xs text-gray-500">12 mins ago</span>
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input
                type="text"
                placeholder="Reply message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
              />
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                onClick={handleSendMessage}
                className="p-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentAI; 