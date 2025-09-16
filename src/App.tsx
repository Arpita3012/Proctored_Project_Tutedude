import React, { useState } from 'react';
import ProctoringDashboard from './components/ProctoringDashboard';
import ReportViewer from './components/ReportViewer';
import { Monitor, FileText } from 'lucide-react';

function App() {
  const [activeView, setActiveView] = useState<'proctoring' | 'reports'>('proctoring');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Monitor className="h-8 w-8 text-blue-400" />
              <h1 className="ml-3 text-xl font-semibold">ProctorAI</h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveView('proctoring')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeView === 'proctoring'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Monitor className="h-4 w-4" />
                Live Proctoring
              </button>
              <button
                onClick={() => setActiveView('reports')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeView === 'reports'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <FileText className="h-4 w-4" />
                Reports
              </button>
            </div>
          </div>
        </div>
      </nav>

      {activeView === 'proctoring' ? <ProctoringDashboard /> : <ReportViewer />}
    </div>
  );
}

export default App;