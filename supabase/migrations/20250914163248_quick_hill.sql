/*
  # Create proctoring system tables

  1. New Tables
    - `proctoring_sessions`
      - `id` (uuid, primary key)
      - `candidate_name` (text)
      - `start_time` (timestamp)
      - `end_time` (timestamp, nullable)
      - `integrity_score` (integer, default 100)
      - `video_recording_url` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `proctoring_events`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `event_type` (text) - focus_lost, candidate_absent, multiple_faces, unauthorized_item
      - `severity` (text) - minor, major, critical
      - `description` (text)
      - `timestamp` (timestamp)
      - `metadata` (jsonb, nullable) - additional data like face count, object type, etc.
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create proctoring_sessions table
CREATE TABLE IF NOT EXISTS proctoring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_name text NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  integrity_score integer DEFAULT 100,
  video_recording_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create proctoring_events table
CREATE TABLE IF NOT EXISTS proctoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('focus_lost', 'candidate_absent', 'multiple_faces', 'unauthorized_item', 'session_start', 'session_end')),
  severity text NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  description text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_start_time ON proctoring_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_proctoring_sessions_candidate_name ON proctoring_sessions(candidate_name);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_session_id ON proctoring_events(session_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_timestamp ON proctoring_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_type_severity ON proctoring_events(event_type, severity);

-- Enable Row Level Security
ALTER TABLE proctoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_events ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - customize based on your auth requirements)
CREATE POLICY "Allow all operations on proctoring_sessions"
  ON proctoring_sessions
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on proctoring_events"
  ON proctoring_events
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger for sessions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proctoring_sessions_updated_at 
  BEFORE UPDATE ON proctoring_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();