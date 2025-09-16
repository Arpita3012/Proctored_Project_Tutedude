import React, { useState, useRef, useEffect } from 'react';
import VideoMonitor from './VideoMonitor';
import EventLogger from './EventLogger';
import StatusPanel from './StatusPanel';
import { ProctoringEvent, ProctoringSession } from '../types/proctoring';
import { useVideoAnalysis } from '../hooks/useVideoAnalysis';
import { supabase } from '../lib/supabase';

const ProctoringDashboard: React.FC = () => {
  const [session, setSession] = useState<ProctoringSession | null>(null);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [candidateName, setCandidateName] = useState('');
  const [showStartDialog, setShowStartDialog] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { 
    isAnalyzing, 
    focusStatus, 
    faceCount, 
    detectedObjects, 
    startAnalysis, 
    stopAnalysis 
  } = useVideoAnalysis(videoRef);

  const startSession = async () => {
    if (!candidateName.trim()) return;

    const newSession: ProctoringSession = {
      id: crypto.randomUUID(),
      candidateName: candidateName.trim(),
      startTime: new Date(),
      endTime: null,
      events: [],
      integrityScore: 100
    };

    setSession(newSession);
    setShowStartDialog(false);
    
    // Save session to database
    try {
      await supabase.from('proctoring_sessions').insert({
        id: newSession.id,
        candidate_name: newSession.candidateName,
        start_time: newSession.startTime.toISOString(),
        integrity_score: newSession.integrityScore
      });
    } catch (error) {
      console.error('Error saving session:', error);
    }

    // Start video analysis
    startAnalysis();
  };

  const endSession = async () => {
    if (!session) return;

    const endTime = new Date();
    const updatedSession = { ...session, endTime, events };
    
    // Calculate final integrity score
    const score = calculateIntegrityScore(events);
    updatedSession.integrityScore = score;

    setSession(updatedSession);
    stopAnalysis();

    // Update session in database
    try {
      await supabase.from('proctoring_sessions')
        .update({
          end_time: endTime.toISOString(),
          integrity_score: score
        })
        .eq('id', session.id);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const addEvent = async (event: Omit<ProctoringEvent, 'id' | 'timestamp'>) => {
    const newEvent: ProctoringEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setEvents(prev => [...prev, newEvent]);

    // Save event to database
    if (session) {
      try {
        await supabase.from('proctoring_events').insert({
          id: newEvent.id,
          session_id: session.id,
          event_type: newEvent.type,
          severity: newEvent.severity,
          description: newEvent.description,
          timestamp: newEvent.timestamp.toISOString()
        });
      } catch (error) {
        console.error('Error saving event:', error);
      }
    }
  };

  const calculateIntegrityScore = (events: ProctoringEvent[]): number => {
    let score = 100;
    
    events.forEach(event => {
      switch (event.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'major':
          score -= 10;
          break;
        case 'minor':
          score -= 5;
          break;
      }
    });

    return Math.max(score, 0);
  };

  // Monitor video analysis results
  useEffect(() => {
    if (!session || !isAnalyzing) return;

    // Focus detection
    if (focusStatus === 'lost') {
      const recentFocusEvents = events.filter(
        e => e.type === 'focus_lost' && 
        Date.now() - e.timestamp.getTime() < 10000
      );
      
      if (recentFocusEvents.length === 0) {
        addEvent({
          type: 'focus_lost',
          severity: 'major',
          description: 'Candidate lost focus - looking away from screen'
        });
      }
    }

    // Face detection
    if (faceCount === 0) {
      const recentAbsenceEvents = events.filter(
        e => e.type === 'candidate_absent' && 
        Date.now() - e.timestamp.getTime() < 15000
      );
      
      if (recentAbsenceEvents.length === 0) {
        addEvent({
          type: 'candidate_absent',
          severity: 'critical',
          description: 'No face detected - candidate may have left'
        });
      }
    } else if (faceCount > 1) {
      const recentMultiFaceEvents = events.filter(
        e => e.type === 'multiple_faces' && 
        Date.now() - e.timestamp.getTime() < 10000
      );
      
      if (recentMultiFaceEvents.length === 0) {
        addEvent({
          type: 'multiple_faces',
          severity: 'critical',
          description: `Multiple faces detected (${faceCount})`
        });
      }
    }

    // Object detection
    detectedObjects.forEach(obj => {
      if (['phone', 'book', 'laptop', 'tablet'].includes(obj)) {
        const recentObjectEvents = events.filter(
          e => e.type === 'unauthorized_item' && 
          e.description.includes(obj) &&
          Date.now() - e.timestamp.getTime() < 30000
        );
        
        if (recentObjectEvents.length === 0) {
          addEvent({
            type: 'unauthorized_item',
            severity: 'major',
            description: `Unauthorized item detected: ${obj}`
          });
        }
      }
    });
  }, [focusStatus, faceCount, detectedObjects, session, isAnalyzing, events]);

  if (showStartDialog) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-center mb-6">Start Proctoring Session</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Candidate Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                placeholder="Enter candidate's full name"
              />
            </div>
            <button
              onClick={startSession}
              disabled={!candidateName.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <VideoMonitor
            videoRef={videoRef}
            isRecording={!!session && !session.endTime}
          />
          <StatusPanel
            session={session}
            focusStatus={focusStatus}
            faceCount={faceCount}
            detectedObjects={detectedObjects}
            integrityScore={calculateIntegrityScore(events)}
            onEndSession={endSession}
          />
        </div>
        <div>
          <EventLogger events={events} />
        </div>
      </div>
    </div>
  );
};

export default ProctoringDashboard;