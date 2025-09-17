import React from 'react';
import { FiArrowLeft, FiUser, FiDatabase } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Log {
  log_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  session_id: string;
  success: boolean;
  error_message?: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
    role: string;
  };
  
  // Computed fields for backwards compatibility
  id?: number;
  time?: string;
  fullName?: string;
  userRole?: 'HR' | 'Candidate' | 'Admin' | 'System';
  details?: string;
  actions?: string;
  ip?: string;
  location?: string;
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
    const action = (log.action || log.actions || '').toLowerCase();

    switch (action) {
        case 'update':
        case 'edit':
            contextContent = (
                <div className="space-y-2 text-sm">
                    <p className="font-semibold text-gray-800">Changes Made:</p>
                    {log.old_values && log.new_values ? (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="font-medium text-gray-600 mb-1">Previous Values:</p>
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                                    {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <p className="font-medium text-gray-600 mb-1">New Values:</p>
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                                    {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-600">Updated {log.entity_type} (ID: {log.entity_id})</p>
                    )}
                </div>
            );
            break;
        case 'create':
            contextContent = (
                <div className="space-y-2 text-sm">
                    <p className="font-semibold text-gray-800">Created New {log.entity_type}:</p>
                    <p className="text-gray-600">Entity ID: {log.entity_id}</p>
                    {log.new_values && (
                        <div>
                            <p className="font-medium text-gray-600 mb-1">Initial Values:</p>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                                {JSON.stringify(log.new_values, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            );
            break;
        case 'delete':
            contextContent = (
                <div className="space-y-2 text-sm">
                    <p className="font-semibold text-gray-800">Deleted {log.entity_type}:</p>
                    <p className="text-gray-600">Entity ID: {log.entity_id}</p>
                    {log.old_values && (
                        <div>
                            <p className="font-medium text-gray-600 mb-1">Deleted Data:</p>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                                {JSON.stringify(log.old_values, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            );
            break;
        case 'login':
            contextContent = (
                <div className="space-y-2 text-sm">
                    <p className="font-semibold text-gray-800">Authentication Details:</p>
                    <p className="text-gray-600">User successfully authenticated</p>
                    <p className="text-gray-600">Session ID: {log.session_id || 'N/A'}</p>
                </div>
            );
            break;
        case 'logout':
            contextContent = <p className="text-gray-600 text-sm">User session terminated successfully.</p>;
            break;
        default:
            contextContent = (
                <div className="space-y-2 text-sm">
                    <p className="font-semibold text-gray-800">Action: {log.action}</p>
                    <p className="text-gray-600">Entity: {log.entity_type} (ID: {log.entity_id})</p>
                    {(log.old_values || log.new_values) && (
                        <p className="text-gray-500 italic">See metadata section for detailed changes</p>
                    )}
                </div>
            );
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
                    <p className="text-gray-600">Log ID: {log.log_id || log.id}</p>
                </div>
            </div>
            
            <div className="space-y-8">
                <div className="p-6 border rounded-lg bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                             <h2 className="text-lg font-semibold text-gray-900">{log.details || `${log.action} ${log.entity_type}`}</h2>
                             <p className="text-sm text-gray-500">Performed by {log.fullName || log.user?.full_name || 'System'} ({log.userRole || log.user?.role || 'System'})</p>
                        </div>
                         <p className="text-sm text-gray-500 whitespace-nowrap">{log.time || new Date(log.created_at).toLocaleString()}</p>
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
                             <InfoRow label="Full Name">{log.fullName || log.user?.full_name || 'System'}</InfoRow>
                             <InfoRow label="User Role">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getUserTypeColor(log.userRole || log.user?.role || 'system')}`}>
                                    {log.userRole || log.user?.role || 'System'}
                                </span>
                             </InfoRow>
                             <InfoRow label="IP Address">{log.ip || log.ip_address || 'N/A'}</InfoRow>
                             <InfoRow label="Location">{log.location || 'Unknown'}</InfoRow>
                             <InfoRow label="Session ID" isFullWidth={true}>{log.session_id || 'N/A'}</InfoRow>
                             <InfoRow label="User Agent" isFullWidth={true}>{log.user_agent || 'N/A'}</InfoRow>
                        </div>
                    </div>

                     <div className="p-6 border rounded-lg bg-white">
                        <div className="flex items-center gap-3 mb-4">
                            <FiDatabase className="w-5 h-5 text-gray-500" />
                            <h3 className="text-lg font-semibold">Event Metadata</h3>
                        </div>
                        <SyntaxHighlighter language="json" style={atomDark} customStyle={{ borderRadius: '0.375rem', margin: 0 }}>
                            {JSON.stringify({
                                log_id: log.log_id,
                                action: log.action,
                                entity_type: log.entity_type,
                                entity_id: log.entity_id,
                                old_values: log.old_values,
                                new_values: log.new_values,
                                user_id: log.user_id,
                                ip_address: log.ip_address,
                                user_agent: log.user_agent,
                                session_id: log.session_id,
                                created_at: log.created_at,
                                user: log.user
                            }, null, 2)}
                        </SyntaxHighlighter>
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