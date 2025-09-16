import React from 'react';
import { AlertTriangle, AlertCircle, Info, Eye, Users, Smartphone } from 'lucide-react';
import { ProctoringEvent } from '../types/proctoring';

interface EventLoggerProps {
  events: ProctoringEvent[];
}

const EventLogger: React.FC<EventLoggerProps> = ({ events }) => {
  const getSeverityIcon = (severity: string, type: string) => {
    const baseClasses = "h-4 w-4";
    
    switch (severity) {
      case 'critical':
        return <AlertTriangle className={`${baseClasses} text-red-400`} />;
      case 'major':
        return <AlertCircle className={`${baseClasses} text-yellow-400`} />;
      case 'minor':
        return <Info className={`${baseClasses} text-blue-400`} />;
      default:
        return <Info className={`${baseClasses} text-gray-400`} />;
    }
  };

  const getTypeIcon = (type: string) => {
    const baseClasses = "h-4 w-4";
    
    switch (type) {
      case 'focus_lost':
        return <Eye className={`${baseClasses} text-yellow-400`} />;
      case 'multiple_faces':
        return <Users className={`${baseClasses} text-red-400`} />;
      case 'candidate_absent':
        return <Users className={`${baseClasses} text-red-400`} />;
      case 'unauthorized_item':
        return <Smartphone className={`${baseClasses} text-orange-400`} />;
      default:
        return <Info className={`${baseClasses} text-gray-400`} />;
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-900/10';
      case 'major':
        return 'border-l-yellow-500 bg-yellow-900/10';
      case 'minor':
        return 'border-l-blue-500 bg-blue-900/10';
      default:
        return 'border-l-gray-500 bg-gray-900/10';
    }
  };

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventSummary = () => {
    const summary = {
      critical: events.filter(e => e.severity === 'critical').length,
      major: events.filter(e => e.severity === 'major').length,
      minor: events.filter(e => e.severity === 'minor').length,
      focusLost: events.filter(e => e.type === 'focus_lost').length,
      multiplefaces: events.filter(e => e.type === 'multiple_faces').length,
      unauthorizedItems: events.filter(e => e.type === 'unauthorized_item').length
    };
    return summary;
  };

  const summary = getEventSummary();

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold mb-2">Event Log</h2>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-gray-400">Critical: {summary.critical}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-400">Major: {summary.major}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-400">Minor: {summary.minor}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No events recorded</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 space-y-2">
            {events
              .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
              .map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border-l-4 ${getSeverityColor(event.severity)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      {getTypeIcon(event.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white mb-1">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{formatTime(event.timestamp)}</span>
                          <span className="capitalize">{event.severity}</span>
                          {event.metadata?.faceCount !== undefined && (
                            <span>Faces: {event.metadata.faceCount}</span>
                          )}
                          {event.metadata?.confidence && (
                            <span>Confidence: {Math.round(event.metadata.confidence * 100)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getSeverityIcon(event.severity, event.type)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventLogger;