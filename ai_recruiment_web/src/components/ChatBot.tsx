import { useState } from 'react';
import ChatBotIcon from '../assets/chatbot.png';

interface Message {
  id: number;
  text: string;
  sender: 'agent' | 'user';
  timestamp: string;
}

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hey Jake, I wanted to reach out because we saw your work contributions and were impressed by your work.",
      sender: 'agent',
      timestamp: '12 mins ago'
    },
    {
      id: 2,
      text: "We want to invite you for a quick interview",
      sender: 'agent',
      timestamp: '12 mins ago'
    },
    {
      id: 3,
      text: "Hi Jan, sure I would love to. Thanks for taking the time to see my work!",
      sender: 'user',
      timestamp: '12 mins ago'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: messages.length + 1,
        text: newMessage,
        sender: 'user',
        timestamp: 'Just now'
      };
      setMessages([...messages, message]);
      setNewMessage('');
      
      // Auto reply from agent after 2 seconds
      setTimeout(() => {
        const agentReply: Message = {
          id: messages.length + 2,
          text: "Great! I'll send you the meeting details shortly.",
          sender: 'agent',
          timestamp: 'Just now'
        };
        setMessages(prev => [...prev, agentReply]);
      }, 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      {/* ChatBot Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center border border-gray-200"
        >
          <img src={ChatBotIcon} alt="ChatBot" className="w-10 h-10" />
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👨‍💼</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Agent AI</h3>
                <p className="text-sm text-gray-500">Recruiter at <span className="text-[#007BFF]">Nomad</span></p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Agent Info Section */}
          <div className="p-4 text-center border-b border-gray-200 bg-gray-50">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-4xl">👨‍💼</span>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">Agent AI</h3>
            <p className="text-sm text-gray-500 mb-2">Recruiter at <span className="text-[#007BFF]">Nomad</span></p>
            <p className="text-xs text-gray-400">This is the very beginning of your direct message with <strong>Jan Mayer</strong></p>
          </div>

          {/* Today Badge */}
          <div className="flex justify-center py-3">
            <div className="bg-gray-100 px-4 py-1 rounded-full">
              <span className="text-xs text-gray-600">▼ Today</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.sender === 'agent' && (
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm">👨‍💼</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900">Agent AI</span>
                    </div>
                  )}
                  <div className={`p-3 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-[#007BFF] text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                    {message.timestamp}
                  </p>
                  {message.sender === 'user' && (
                    <div className="flex justify-end mt-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">You</span>
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm">👤</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Reply message"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent"
              />
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={sendMessage}
                className="bg-[#007BFF] text-white p-2 rounded-lg hover:bg-[#0056b3] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot; 