import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ProctoringSession, ProctoringEvent } from '../types/proctoring';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, Shield, AlertTriangle, Download, Eye, Users, Smartphone } from 'lucide-react';

const ReportViewer: React.FC = () => {
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ProctoringSession | null>(null);
  const [sessionEvents, setSessionEvents] = useState<ProctoringEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionEvents(selectedSession.id);
    }
  }, [selectedSession]);

  const fetchSessions = async () => {
    try {
      const { data: sessionsData, error } = await supabase
        .from('proctoring_sessions')
        .select('*')
        .order('start_time', { ascending: false });

      if (error) throw error;

      const formattedSessions: ProctoringSession[] = sessionsData.map(session => ({
        id: session.id,
        candidateName: session.candidate_name,
        startTime: new Date(session.start_time),
        endTime: session.end_time ? new Date(session.end_time) : null,
        integrityScore: session.integrity_score,
        events: [],
        videoRecordingUrl: session.video_recording_url
      }));

      setSessions(formattedSessions);
      if (formattedSessions.length > 0) {
        setSelectedSession(formattedSessions[0]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionEvents = async (sessionId: string) => {
    try {
      const { data: eventsData, error } = await supabase
        .from('proctoring_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const formattedEvents: ProctoringEvent[] = eventsData.map(event => ({
        id: event.id,
        sessionId: event.session_id,
        type: event.event_type,
        severity: event.severity,
        description: event.description,
        timestamp: new Date(event.timestamp),
        metadata: event.metadata
      }));

      setSessionEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching session events:', error);
    }
  };

  const generateReport = (session: ProctoringSession, events: ProctoringEvent[]) => {
    const duration = session.endTime 
      ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60)
      : 0;

    const focusLostEvents = events.filter(e => e.type === 'focus_lost');
    const multiplefaces = events.filter(e => e.type === 'multiple_faces');
    const unauthorizedItems = events.filter(e => e.type === 'unauthorized_item');
    const candidateAbsent = events.filter(e => e.type === 'candidate_absent');

    const eventsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      events: events.filter(e => e.timestamp.getHours() === hour).length
    }));

    const severityDistribution = [
      { name: 'Critical', value: events.filter(e => e.severity === 'critical').length, color: '#ef4444' },
      { name: 'Major', value: events.filter(e => e.severity === 'major').length, color: '#f59e0b' },
      { name: 'Minor', value: events.filter(e => e.severity === 'minor').length, color: '#3b82f6' }
    ].filter(item => item.value > 0);

    return {
      summary: {
        duration,
        totalEvents: events.length,
        focusLostCount: focusLostEvents.length,
        multiplefaces: multiplefaces.length,
        unauthorizedItems: unauthorizedItems.length,
        candidateAbsent: candidateAbsent.length,
        integrityScore: session.integrityScore
      },
      charts: {
        eventsByHour: eventsByHour.filter(item => item.events > 0),
        severityDistribution
      }
    };
  };

  const downloadReport = (session: ProctoringSession, events: ProctoringEvent[]) => {
    const report = generateReport(session, events);
    const reportData = {
      candidate: session.candidateName,
      session: {
        id: session.id,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        duration: `${report.summary.duration} minutes`,
        integrityScore: `${report.summary.integrityScore}%`
      },
      summary: report.summary,
      events: events.map(event => ({
        timestamp: event.timestamp.toISOString(),
        type: event.type,
        severity: event.severity,
        description: event.description
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proctoring-report-${session.candidateName}-${session.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading reports...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-400">
          <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">No proctoring sessions found</p>
          <p className="mt-2">Start a new session to generate reports</p>
        </div>
      </div>
    );
  }

  const selectedReport = selectedSession ? generateReport(selectedSession, sessionEvents) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Session Selector */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-2xl font-semibold mb-4">Proctoring Reports</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Session
            </label>
            <select
              value={selectedSession?.id || ''}
              onChange={(e) => {
                const session = sessions.find(s => s.id === e.target.value);
                setSelectedSession(session || null);
              }}
              className="w-full max-w-md px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.candidateName} - {session.startTime.toLocaleDateString()} {session.startTime.toLocaleTimeString()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedSession && selectedReport && (
        <>
          {/* Report Header */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold">{selectedSession.candidateName}</h3>
                <p className="text-gray-400 mt-1">Session Report</p>
              </div>
              <button
                onClick={() => downloadReport(selectedSession, sessionEvents)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Report
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-6 w-6 text-blue-400" />
                <span className="text-gray-300 font-medium">Duration</span>
              </div>
              <p className="text-2xl font-semibold text-white">{selectedReport.summary.duration} min</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className={`h-6 w-6 ${
                  selectedReport.summary.integrityScore >= 90 ? 'text-green-400' :
                  selectedReport.summary.integrityScore >= 70 ? 'text-yellow-400' : 'text-red-400'
                }`} />
                <span className="text-gray-300 font-medium">Integrity Score</span>
              </div>
              <p className={`text-2xl font-semibold ${
                selectedReport.summary.integrityScore >= 90 ? 'text-green-400' :
                selectedReport.summary.integrityScore >= 70 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {selectedReport.summary.integrityScore}%
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="h-6 w-6 text-orange-400" />
                <span className="text-gray-300 font-medium">Total Events</span>
              </div>
              <p className="text-2xl font-semibold text-white">{selectedReport.summary.totalEvents}</p>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Eye className="h-6 w-6 text-yellow-400" />
                <span className="text-gray-300 font-medium">Focus Lost</span>
              </div>
              <p className="text-2xl font-semibold text-white">{selectedReport.summary.focusLostCount}</p>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h4 className="text-lg font-semibold mb-4">Event Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-yellow-400" />
                    <span className="text-gray-300">Focus Lost</span>
                  </div>
                  <span className="text-white font-medium">{selectedReport.summary.focusLostCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-red-400" />
                    <span className="text-gray-300">Multiple Faces</span>
                  </div>
                  <span className="text-white font-medium">{selectedReport.summary.multiplefaces}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-orange-400" />
                    <span className="text-gray-300">Unauthorized Items</span>
                  </div>
                  <span className="text-white font-medium">{selectedReport.summary.unauthorizedItems}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-red-400" />
                    <span className="text-gray-300">Candidate Absent</span>
                  </div>
                  <span className="text-white font-medium">{selectedReport.summary.candidateAbsent}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h4 className="text-lg font-semibold mb-4">Severity Distribution</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={selectedReport.charts.severityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {selectedReport.charts.severityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h4 className="text-lg font-semibold mb-4">Session Information</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Session ID:</span>
                  <p className="text-white font-mono text-xs break-all">{selectedSession.id}</p>
                </div>
                <div>
                  <span className="text-gray-400">Start Time:</span>
                  <p className="text-white">{selectedSession.startTime.toLocaleString()}</p>
                </div>
                {selectedSession.endTime && (
                  <div>
                    <span className="text-gray-400">End Time:</span>
                    <p className="text-white">{selectedSession.endTime.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Events Timeline */}
          {sessionEvents.length > 0 && (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h4 className="text-lg font-semibold mb-4">Event Timeline</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sessionEvents.map(event => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      event.severity === 'critical' ? 'border-l-red-500 bg-red-900/10' :
                      event.severity === 'major' ? 'border-l-yellow-500 bg-yellow-900/10' :
                      'border-l-blue-500 bg-blue-900/10'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{event.description}</p>
                        <p className="text-gray-400 text-sm mt-1">
                          {event.timestamp.toLocaleTimeString()} - {event.severity}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.severity === 'critical' ? 'bg-red-900 text-red-300' :
                        event.severity === 'major' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-blue-900 text-blue-300'
                      }`}>
                        {event.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportViewer;