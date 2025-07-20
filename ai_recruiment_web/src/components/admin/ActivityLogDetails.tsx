import React from 'react';
import { FiArrowLeft, FiUser, FiDatabase } from 'react-icons/fi';

interface Log {
  id: number;
  time: string;
  fullName: string;
  user: 'HR' | 'Candidate' | 'Admin';
  details: string;
  actions: string;
  ip: string;
  location: string;
}

interface ActivityLogDetailsProps {
    log: Log;
    onBack: () => void;
}

const getUserTypeColor = (userType: string) => {
    switch (userType.toLowerCase()) {
        case 'hr': return 'border-blue-400 bg-blue-50 text-blue-700';
        case 'candidate': return 'border-green-400 bg-green-50 text-green-700';
        case 'admin': return 'border-red-400 bg-red-50 text-red-700';
        default: return 'border-gray-400 bg-gray-50 text-gray-700';
    }
};

const EventContext: React.FC<{ log: Log }> = ({ log }) => {
    let contextContent;

    switch (log.actions.toLowerCase()) {
        case 'edit':
            contextContent = (
                <div className="space-y-2 text-sm">
                    <p className="font-semibold text-gray-800">Profile Fields Updated:</p>
                    <ul className="list-disc list-inside text-gray-600">
                        <li>Contact Number: ******_7890</li>
                        <li>Address: 123 Main St, Anytown</li>
                    </ul>
                </div>
            );
            break;
        case 'apply':
            contextContent = (
                <div className="space-y-2 text-sm">
                    <p className="font-semibold text-gray-800">Application Details:</p>
                    <p className="text-gray-600">Job Title: Senior Designer</p>
                    <p className="text-gray-600">Company:Innovate Inc.</p>
                </div>
            );
            break;
        case 'login':
             contextContent = <p className="text-gray-600 text-sm">User successfully authenticated.</p>;
             break;
        default:
            contextContent = <p className="text-gray-500 italic text-sm">No additional context for this event.</p>;
    }

    return <div className="mt-4 rounded-lg bg-gray-50 p-4">{contextContent}</div>
}

const ActivityLogDetails: React.FC<ActivityLogDetailsProps> = ({ log, onBack }) => {
    return (
        <div className="w-full">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                    <FiArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">Activity Log Details</h1>
                    <p className="text-gray-600">Log ID: {log.id}</p>
                </div>
            </div>
            
            <div className="space-y-8">
                <div className="p-6 border rounded-lg bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                             <h2 className="text-lg font-semibold text-gray-900">{log.details}</h2>
                             <p className="text-sm text-gray-500">Performed by {log.fullName} ({log.user})</p>
                        </div>
                         <p className="text-sm text-gray-500 whitespace-nowrap">{log.time}</p>
                    </div>
                     <EventContext log={log} />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-6 border rounded-lg bg-white space-y-6">
                        <div className="flex items-center gap-3">
                            <FiUser className="w-5 h-5 text-gray-500" />
                            <h3 className="text-lg font-semibold">User & System Details</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                             <InfoRow label="Full Name">{log.fullName}</InfoRow>
                             <InfoRow label="User Role">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getUserTypeColor(log.user)}`}>
                                    {log.user}
                                </span>
                             </InfoRow>
                             <InfoRow label="IP Address">{log.ip}</InfoRow>
                             <InfoRow label="Location">{log.location}</InfoRow>
                             <InfoRow label="Device" isFullWidth={true}>Desktop</InfoRow>
                             <InfoRow label="User Agent" isFullWidth={true}>Chrome on Windows</InfoRow>
                        </div>
                    </div>

                     <div className="p-6 border rounded-lg bg-white">
                        <div className="flex items-center gap-3 mb-4">
                            <FiDatabase className="w-5 h-5 text-gray-500" />
                            <h3 className="text-lg font-semibold">Event Metadata</h3>
                        </div>
                        <pre className="text-xs bg-gray-900 text-white p-4 rounded-md overflow-x-auto">
                            {JSON.stringify(log, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InfoRow: React.FC<{ label: string; children: React.ReactNode; isFullWidth?: boolean }> = ({ label, children, isFullWidth }) => {
    return (
        <div className={isFullWidth ? 'col-span-2' : ''}>
            <p className="font-medium text-gray-500 mb-1">{label}</p>
            <div className="text-gray-800 break-words">{children}</div>
        </div>
    );
}

export default ActivityLogDetails; 