import { useRef, useEffect, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { load as loadCocoSsd } from '@tensorflow-models/coco-ssd';
import { FaceMesh } from '@mediapipe/face_mesh';
import { DetectionResults } from '../types/proctoring';

export const useVideoAnalysis = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [focusStatus, setFocusStatus] = useState<'focused' | 'lost' | 'unknown'>('unknown');
  const [faceCount, setFaceCount] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState<string[]>([]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  
  const cocoSsdModelRef = useRef<any>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const focusLostTimeRef = useRef<number | null>(null);

  // Initialize AI models
  useEffect(() => {
    const initializeModels = async () => {
      try {
        // Initialize TensorFlow.js
        await tf.ready();
        await tf.setBackend('webgl');
        
        // Load COCO-SSD model for object detection
        cocoSsdModelRef.current = await loadCocoSsd();
        
        // Initialize MediaPipe FaceMesh
        const faceMesh = new FaceMesh({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          }
        });
        
        faceMesh.setOptions({
          maxNumFaces: 5,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        faceMesh.onResults(handleFaceMeshResults);
        faceMeshRef.current = faceMesh;
        
        setIsModelLoading(false);
        console.log('AI models loaded successfully');
      } catch (error) {
        console.error('Error initializing AI models:', error);
        setIsModelLoading(false);
      }
    };

    initializeModels();
    
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  const handleFaceMeshResults = useCallback((results: any) => {
    if (!results.multiFaceLandmarks) return;
    
    const faceCount = results.multiFaceLandmarks.length;
    setFaceCount(faceCount);
    
    if (faceCount === 0) {
      setFocusStatus('lost');
      if (!focusLostTimeRef.current) {
        focusLostTimeRef.current = Date.now();
      }
    } else if (faceCount === 1) {
      // Analyze gaze direction using face landmarks
      const landmarks = results.multiFaceLandmarks[0];
      const isLookingAtScreen = analyzeFocusFromLandmarks(landmarks);
      
      if (isLookingAtScreen) {
        setFocusStatus('focused');
        focusLostTimeRef.current = null;
      } else {
        setFocusStatus('lost');
        if (!focusLostTimeRef.current) {
          focusLostTimeRef.current = Date.now();
        }
      }
    } else {
      // Multiple faces detected
      setFocusStatus('lost');
    }
  }, []);

  const analyzeFocusFromLandmarks = (landmarks: any[]): boolean => {
    if (!landmarks || landmarks.length === 0) return false;
    
    // Get key facial landmarks for gaze detection
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const noseTip = landmarks[1];
    const chinBottom = landmarks[175];
    
    // Simple gaze detection based on eye and nose positions
    // This is a basic implementation - for production, use more sophisticated algorithms
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2
    };
    
    const faceCenter = {
      x: noseTip.x,
      y: (noseTip.y + chinBottom.y) / 2
    };
    
    // Calculate deviation from center
    const deviation = Math.sqrt(
      Math.pow(eyeCenter.x - faceCenter.x, 2) + 
      Math.pow(eyeCenter.y - faceCenter.y, 2)
    );
    
    // Consider focused if deviation is small (threshold can be adjusted)
    return deviation < 0.05;
  };

  const detectObjects = useCallback(async () => {
    if (!videoRef.current || !cocoSsdModelRef.current || !videoRef.current.videoWidth) {
      return;
    }

    try {
      // Create tensor from video element
      const videoTensor = tf.browser.fromPixels(videoRef.current);
      
      // Run object detection
      const predictions = await cocoSsdModelRef.current.detect(videoTensor);
      
      // Filter for suspicious objects
      const suspiciousObjects = predictions
        .filter((prediction: any) => {
          const suspiciousItems = [
            'cell phone', 'book', 'laptop', 'computer', 'tablet',
            'notebook', 'paper', 'phone', 'mobile phone'
          ];
          return suspiciousItems.some(item => 
            prediction.class.toLowerCase().includes(item) && 
            prediction.score > 0.6
          );
        })
        .map((prediction: any) => prediction.class);
      
      setDetectedObjects(suspiciousObjects);
      
      // Clean up tensor
      videoTensor.dispose();
    } catch (error) {
      console.error('Object detection error:', error);
    }
  }, [videoRef]);

  const processFaceDetection = useCallback(async () => {
    if (!videoRef.current || !faceMeshRef.current || !videoRef.current.videoWidth) {
      return;
    }

    try {
      await faceMeshRef.current.send({ image: videoRef.current });
    } catch (error) {
      console.error('Face detection error:', error);
    }
  }, [videoRef]);

  const startAnalysis = useCallback(() => {
    if (isModelLoading) {
      console.warn('Models are still loading...');
      return;
    }
    
    setIsAnalyzing(true);
    
    // Run analysis every 500ms
    analysisIntervalRef.current = setInterval(async () => {
      await Promise.all([
        processFaceDetection(),
        detectObjects()
      ]);
    }, 500);
  }, [isModelLoading, processFaceDetection, detectObjects]);

  const stopAnalysis = useCallback(() => {
    setIsAnalyzing(false);
    
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    setFocusStatus('unknown');
    setFaceCount(0);
    setDetectedObjects([]);
    focusLostTimeRef.current = null;
  }, []);

  // Get focus lost duration
  const getFocusLostDuration = useCallback((): number => {
    if (!focusLostTimeRef.current) return 0;
    return Math.floor((Date.now() - focusLostTimeRef.current) / 1000);
  }, []);

  return {
    isAnalyzing,
    focusStatus,
    faceCount,
    detectedObjects,
    isModelLoading,
    startAnalysis,
    stopAnalysis,
    getFocusLostDuration
  };
};