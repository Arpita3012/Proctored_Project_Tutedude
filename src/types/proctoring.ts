export interface ProctoringSession {
  id: string;
  candidateName: string;
  startTime: Date;
  endTime: Date | null;
  events: ProctoringEvent[];
  integrityScore: number;
  videoRecordingUrl?: string;
}

export interface ProctoringEvent {
  id: string;
  sessionId?: string;
  type: 'focus_lost' | 'candidate_absent' | 'multiple_faces' | 'unauthorized_item' | 'session_start' | 'session_end';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  timestamp: Date;
  metadata?: {
    faceCount?: number;
    objectType?: string;
    confidence?: number;
    duration?: number;
  };
}

export interface DetectionResults {
  faces: {
    count: number;
    landmarks?: any[];
    isLookingAtScreen: boolean;
  };
  objects: {
    type: string;
    confidence: number;
    bbox: number[];
  }[];
  focusStatus: 'focused' | 'lost' | 'unknown';
}