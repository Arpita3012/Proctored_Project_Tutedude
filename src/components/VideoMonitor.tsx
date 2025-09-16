import React, { useEffect, useState } from 'react';
import { Camera, CameraOff, Video, VideoOff } from 'lucide-react';

interface VideoMonitorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isRecording: boolean;
}

const VideoMonitor: React.FC<VideoMonitorProps> = ({ videoRef, isRecording }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording && stream && !mediaRecorder) {
      startRecording();
    } else if (!isRecording && mediaRecorder) {
      stopRecording();
    }
  }, [isRecording, stream, mediaRecorder]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      
      setStream(mediaStream);
      setIsVideoOn(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsVideoOn(false);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const startRecording = () => {
    if (!stream) return;

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      setRecordedChunks(chunks);
    };

    recorder.start(1000); // Record in 1-second chunks
    setMediaRecorder(recorder);
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setMediaRecorder(null);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Candidate Video</h2>
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2 text-red-400">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Recording</span>
            </div>
          )}
          <button
            onClick={toggleCamera}
            className={`p-2 rounded-lg transition-colors ${
              isVideoOn 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isVideoOn ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
          </button>
        </div>
      </div>
      
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-96 bg-gray-900 object-cover"
          muted
          autoPlay
          playsInline
        />
        
        {!isVideoOn && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <VideoOff className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg">Camera is off</p>
            </div>
          </div>
        )}

        {/* AI Analysis Overlay */}
        <div className="absolute top-4 left-4">
          <canvas
            className="border-2 border-blue-400 rounded-lg opacity-75"
            width="160"
            height="120"
            id="analysis-canvas"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoMonitor;