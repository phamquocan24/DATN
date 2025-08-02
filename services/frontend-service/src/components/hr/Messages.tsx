import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiStar, FiMoreVertical, FiPaperclip, FiSmile, FiSend, FiChevronDown } from 'react-icons/fi';
import { FaThumbtack } from 'react-icons/fa';
import Nomad from '../../assets/Nomad.png';

interface MessagesProps {
  onConversationSelect: () => void;
}

const conversations = [
  { id: 1, name: 'Jan Mayer', avatar: 'https://i.pravatar.cc/40?u=1', time: '12 mins ago', message: 'We want to invite you for a qui...', unread: true },
  { id: 2, name: 'Joe Bartmann', avatar: 'https://i.pravatar.cc/40?u=2', time: '3:40 PM', message: 'Hey thanks for your interview...' },
  { id: 3, name: 'Ally Wales', avatar: 'https://i.pravatar.cc/40?u=3', time: '3:40 PM', message: 'Hey thanks for your interview...' },
  { id: 4, name: 'James Gardner', avatar: 'https://i.pravatar.cc/40?u=4', time: '3:40 PM', message: 'Hey thanks for your interview...' },
  { id: 5, name: 'Allison Geidt', avatar: 'https://i.pravatar.cc/40?u=5', time: '3:40 PM', message: 'Hey thanks for your interview...' },
  { id: 6, name: 'Ruben Culhane', avatar: 'https://i.pravatar.cc/40?u=6', time: '3:40 PM', message: 'Hey thanks for your interview...' },
  { id: 7, name: 'Lydia Diaz', avatar: 'https://i.pravatar.cc/40?u=7', time: '3:40 PM', message: 'Hey thanks for your interview...' },
  { id: 8, name: 'James Dokidis', avatar: 'https://i.pravatar.cc/40?u=8', time: '3:40 PM', message: 'Hey thanks for your interview...' },
  { id: 9, name: 'Angelina Swann', avatar: 'https://i.pravatar.cc/40?u=9', time: '3:40 PM', message: 'Hey thanks for your interview...' },
];

const messages = [
  { id: 1, sender: 'You', text: 'Hey Jan, I wanted to reach out because we saw your work contributions and were impressed by your work.', time: '12 mins ago', avatar: Nomad, self: true },
  { id: 2, sender: 'You', text: 'We want to invite you for a quick interview', time: '12 mins ago', avatar: Nomad, self: true },
  { id: 3, sender: 'Jan Mayer', text: 'Hi Maria, sure I would love to. Thanks for taking the time to see my work!', time: '12 mins ago', avatar: 'https://i.pravatar.cc/40?u=1' },
];

const Messages: React.FC<MessagesProps> = ({ onConversationSelect }) => {
  const [conversationsState, setConversationsState] = useState(conversations);
  const [activeConversation, setActiveConversation] = useState(conversationsState[0]);
  const [isPinned, setIsPinned] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const navigate = useNavigate();

  const handleConversationClick = (convo: any) => {
    setActiveConversation(convo);
    if (convo.unread) {
      const updatedConversations = conversationsState.map(c => 
        c.id === convo.id ? { ...c, unread: false } : c
      );
      setConversationsState(updatedConversations);
      onConversationSelect();
    }
  };

  const getMessagePosition = (index: number) => {
    const currentMsg = messages[index];
    const prevMsg = messages[index - 1];
    const nextMsg = messages[index + 1];

    if (!currentMsg) return 'single';

    const isFirst = !prevMsg || prevMsg.sender !== currentMsg.sender;
    const isLast = !nextMsg || nextMsg.sender !== currentMsg.sender;

    if (isFirst && isLast) return 'single';
    if (isFirst) return 'first';
    if (isLast) return 'last';
    return 'middle';
  };

  const largeAvatarUrl = activeConversation.avatar.includes('pravatar')
    ? activeConversation.avatar.replace('/40?', '/80?')
    : activeConversation.avatar;

  return (
    <div className="flex flex-col h-full bg-white font-sans">
        <div className="text-left border-b pb-4 mb-4">
            <h1 className="text-2xl">Messages</h1>
        </div>
        <div className="flex flex-1 min-h-0">
            {/* Conversation List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4">
                    <div className="relative">
                        <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search messages" className="pl-10 pr-4 py-2 w-full border rounded-lg" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversationsState.map(convo => (
                        <div
                            key={convo.id}
                            className={`p-4 flex items-center cursor-pointer text-left border-b border-gray-200 ${activeConversation.id === convo.id ? 'bg-blue-50' : ''}`}
                            onClick={() => handleConversationClick(convo)}
                        >
                            <div className="relative">
                                <img src={convo.avatar} alt={convo.name} className="w-10 h-10 rounded-full mr-4" />
                                {convo.unread && <span className="absolute top-0 right-3 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></span>}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-sm">{convo.name}</h3>
                                <span className="text-xs text-gray-500">{convo.time}</span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{convo.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
                <div className="p-4 pt-0 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center">
                        <img src={largeAvatarUrl} alt={activeConversation.name} className="w-10 h-10 rounded-full mr-3" />
                        <div className="text-left">
                        <h3 className="font-semibold">{activeConversation.name}</h3>
                        <p className="text-sm text-gray-500">Designer Candidate</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 text-gray-500">
                        <button onClick={() => setIsPinned(!isPinned)} className={`p-2 rounded-full ${isPinned ? 'text-red-600' : 'hover:bg-gray-100'}`}>
                            <FaThumbtack />
                        </button>
                        <button onClick={() => setIsStarred(!isStarred)} className={`p-2 rounded-full ${isStarred ? 'text-yellow-500' : 'hover:bg-gray-100'}`}>
                            <FiStar className={isStarred ? 'fill-current' : ''}/>
                        </button>
                        <button className="p-2 rounded-full hover:bg-gray-100">
                            <FiMoreVertical />
                        </button>
                        <button 
                            onClick={() => navigate(`/hr/job-applications/${activeConversation.id}`)}
                            className="font-semibold"
                            style={{color: '#007BFF'}}
                        >
                            View Profile
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="flex flex-col items-center my-4">
                        <img src={largeAvatarUrl} alt={activeConversation.name} className="w-20 h-20 rounded-full" />
                        <h3 className="text-xl font-semibold mt-2">{activeConversation.name}</h3>
                        <p className="text-gray-500">Designer candidate</p>
                        <div className="text-sm text-gray-500 mt-2 border rounded-md px-2 py-1 flex items-center gap-2">
                           <FiChevronDown /> Today
                        </div>
                    </div>
                    {messages.map((msg, index) => {
                        const position = getMessagePosition(index);
                        const self = msg.self;

                        const bubbleClasses = self
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-white border';

                        const borderRadiusClasses = {
                            single: 'rounded-lg',
                            first: self ? 'rounded-t-lg rounded-l-lg' : 'rounded-t-lg rounded-r-lg',
                            middle: 'rounded-l-lg rounded-r-lg', // No sharp corners for middle bubbles
                            last: self ? 'rounded-b-lg rounded-l-lg' : 'rounded-b-lg rounded-r-lg',
                        }[position];

                        const spacingClass = position === 'last' || position === 'single' ? 'mb-4' : 'mb-1';

                        return (
                            <div key={msg.id} className={`flex items-end ${spacingClass} ${self ? 'justify-end' : 'justify-start'}`}>
                                {!self && (
                                    <div className="w-10 mr-4">
                                        {(position === 'last' || position === 'single') && (
                                            <img src={msg.avatar} alt={msg.sender} className="w-10 h-10 rounded-full" />
                                        )}
                                    </div>
                                )}
                                <div className="max-w-md">
                                    {self && (position === 'first' || position === 'single') && (
                                        <p className="text-xs text-gray-500 mb-1 text-right">You</p>
                                    )}
                                    {!self && (position === 'first' || position === 'single') && (
                                        <p className="text-xs text-gray-500 mb-1 text-left">{msg.sender}</p>
                                    )}
                                    <div className={`p-3 ${bubbleClasses} ${borderRadiusClasses} text-left`}>
                                        {msg.text}
                                    </div>
                                    {(position === 'last' || position === 'single') && (
                                        <p className={`text-xs text-gray-500 mt-1 ${self ? 'text-right' : 'text-left'}`}>{msg.time}</p>
                                    )}
                                </div>
                                {self && (
                                    <div className="w-10 ml-4">
                                        {(position === 'last' || position === 'single') && (
                                            <img src={msg.avatar} alt={msg.sender} className="w-10 h-10 rounded-full" />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <input type="text" placeholder="Reply message" className="w-full pr-24 pl-12 py-3 border rounded-lg bg-gray-50" />
                        <div className="absolute top-1/2 left-4 -translate-y-1/2">
                           <button className="text-gray-500"><FiPaperclip/></button>
                        </div>
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 flex space-x-3">
                            <button className="text-gray-500"><FiSmile/></button>
                            <button className="bg-[#007BFF] text-white p-2 rounded-lg">
                                <FiSend/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Messages; 