import React from 'react';
import { Eye, Users, Shield, StopCircle } from 'lucide-react';
import { ProctoringSession } from '../types/proctoring';

interface StatusPanelProps {
  session: ProctoringSession | null;
  focusStatus: 'focused' | 'lost' | 'unknown';
  faceCount: number;
  detectedObjects: string[];
  integrityScore: number;
  onEndSession: () => void;
}

const StatusPanel: React.FC<StatusPanelProps> = ({
  session,
  focusStatus,
  faceCount,
  detectedObjects,
  integrityScore,
  onEndSession
}) => {
  const getSessionDuration = (): string => {
    if (!session) return '0:00';
    
    const start = session.startTime;
    const end = session.endTime || new Date();
    const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getFocusColor = (status: string): string => {
    switch (status) {
      case 'focused': return 'text-green-400';
      case 'lost': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Session Status</h2>
        {session && !session.endTime && (
          <button
            onClick={onEndSession}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors"
          >
            <StopCircle className="h-4 w-4" />
            End Session
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className={`h-5 w-5 ${getFocusColor(focusStatus)}`} />
            <span className="text-sm font-medium text-gray-300">Focus Status</span>
          </div>
          <p className={`text-lg font-semibold ${getFocusColor(focusStatus)} capitalize`}>
            {focusStatus}
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className={`h-5 w-5 ${faceCount === 1 ? 'text-green-400' : 'text-red-400'}`} />
            <span className="text-sm font-medium text-gray-300">Faces</span>
          </div>
          <p className={`text-lg font-semibold ${faceCount === 1 ? 'text-green-400' : 'text-red-400'}`}>
            {faceCount}
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className={`h-5 w-5 ${getScoreColor(integrityScore)}`} />
            <span className="text-sm font-medium text-gray-300">Integrity</span>
          </div>
          <p className={`text-lg font-semibold ${getScoreColor(integrityScore)}`}>
            {integrityScore}%
          </p>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-5 bg-blue-400 rounded-full flex items-center justify-center">
              <div className="h-2 w-2 bg-white rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-gray-300">Duration</span>
          </div>
          <p className="text-lg font-semibold text-blue-400">
            {getSessionDuration()}
          </p>
        </div>
      </div>

      {session && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-lg font-semibold mb-3">Session Details</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-400">Candidate:</span> {session.candidateName}</p>
            <p><span className="text-gray-400">Started:</span> {session.startTime.toLocaleString()}</p>
            {session.endTime && (
              <p><span className="text-gray-400">Ended:</span> {session.endTime.toLocaleString()}</p>
            )}
          </div>
        </div>
      )}

      {detectedObjects.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2">Detected Objects:</h4>
          <div className="flex flex-wrap gap-2">
            {detectedObjects.map((obj, index) => (
              <span key={index} className="px-2 py-1 bg-yellow-800 text-yellow-200 text-xs rounded">
                {obj}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusPanel;