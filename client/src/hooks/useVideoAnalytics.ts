import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface VideoAnalyticsConfig {
  sessionId: string;
  language: string;
  trackingEnabled?: boolean;
}

interface VideoViewData {
  videoId: string;
  videoType: 'hero' | 'gallery';
  videoTitle?: string;
  videoDuration?: number;
}

class VideoAnalyticsManager {
  private sessionId: string;
  private language: string;
  private trackingEnabled: boolean;
  private currentViews: Map<string, any> = new Map();
  private sessionInitialized: boolean = false;

  constructor(config: VideoAnalyticsConfig) {
    this.sessionId = config.sessionId;
    this.language = config.language;
    this.trackingEnabled = config.trackingEnabled ?? true;
  }

  async initializeSession() {
    if (this.sessionInitialized || !this.trackingEnabled) return;

    try {
      await apiRequest('POST', '/api/analytics/session', {
        sessionId: this.sessionId,
        language: this.language
      });
      this.sessionInitialized = true;
      console.log('📊 Analytics session initialized');
    } catch (error) {
      console.error('Failed to initialize analytics session:', error);
    }
  }

  async startVideoView(videoData: VideoViewData): Promise<string | null> {
    if (!this.trackingEnabled) return null;

    await this.initializeSession();

    try {
      const response = await apiRequest('POST', '/api/analytics/view', {
        sessionId: this.sessionId,
        videoId: videoData.videoId,
        videoType: videoData.videoType,
        videoTitle: videoData.videoTitle || videoData.videoId,
        videoDuration: videoData.videoDuration || 0,
        language: this.language
      });
      
      const result = await response.json();

      const viewId = result.id;
      this.currentViews.set(videoData.videoId, {
        id: viewId,
        startTime: Date.now(),
        lastUpdateTime: Date.now(),
        watchTime: 0,
        maxWatchTime: 0
      });

      console.log(`📊 Started tracking view for video: ${videoData.videoId}`);
      return viewId;
    } catch (error) {
      console.error('Failed to start video view tracking:', error);
      return null;
    }
  }

  async updateVideoProgress(
    videoId: string,
    currentTime: number,
    duration: number,
    isPlaying: boolean
  ) {
    if (!this.trackingEnabled) return;

    const view = this.currentViews.get(videoId);
    if (!view) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - view.lastUpdateTime;

    if (isPlaying && timeSinceLastUpdate > 0) {
      // Add time watched since last update (in seconds)
      const additionalWatchTime = Math.min(timeSinceLastUpdate / 1000, 2); // Cap at 2 seconds to handle edge cases
      view.watchTime += additionalWatchTime;
      view.maxWatchTime = Math.max(view.maxWatchTime, currentTime);
    }

    view.lastUpdateTime = now;

    // Calculate watch percentage
    const watchPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const isCompleted = watchPercentage >= 90; // 90% completion threshold

    // Update server every 5 seconds or when video completes
    const shouldUpdate = 
      timeSinceLastUpdate >= 5000 || 
      isCompleted || 
      !isPlaying;

    if (shouldUpdate) {
      try {
        await apiRequest('PATCH', `/api/analytics/view/${view.id}`, {
          watchTime: Math.round(view.watchTime),
          watchPercentage: Math.round(watchPercentage * 100) / 100,
          maxWatchTime: Math.round(view.maxWatchTime),
          isCompleted
        });
      } catch (error) {
        console.error('Failed to update video progress:', error);
      }
    }
  }

  stopVideoView(videoId: string) {
    if (!this.trackingEnabled) return;

    const view = this.currentViews.get(videoId);
    if (view) {
      // Final update when video stops
      this.currentViews.delete(videoId);
      console.log(`📊 Stopped tracking view for video: ${videoId}`);
    }
  }

  updateLanguage(newLanguage: string) {
    this.language = newLanguage;
  }

  setTrackingEnabled(enabled: boolean) {
    this.trackingEnabled = enabled;
  }
}

// Global analytics manager instance
let analyticsManager: VideoAnalyticsManager | null = null;

export function useVideoAnalytics(language: string = 'en-US') {
  const [sessionId] = useState(() => {
    // Generate or retrieve session ID
    let id = localStorage.getItem('memopyk_session_id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('memopyk_session_id', id);
    }
    return id;
  });

  useEffect(() => {
    // Initialize or update analytics manager
    if (!analyticsManager) {
      analyticsManager = new VideoAnalyticsManager({
        sessionId,
        language,
        trackingEnabled: true
      });
    } else {
      analyticsManager.updateLanguage(language);
    }

    // Initialize session on first load
    analyticsManager.initializeSession();
  }, [sessionId, language]);

  const trackVideoView = async (videoData: VideoViewData) => {
    if (!analyticsManager) return null;
    return await analyticsManager.startVideoView(videoData);
  };

  const updateVideoProgress = async (
    videoId: string,
    currentTime: number,
    duration: number,
    isPlaying: boolean
  ) => {
    if (!analyticsManager) return;
    await analyticsManager.updateVideoProgress(videoId, currentTime, duration, isPlaying);
  };

  const stopVideoTracking = (videoId: string) => {
    if (!analyticsManager) return;
    analyticsManager.stopVideoView(videoId);
  };

  const setTrackingEnabled = (enabled: boolean) => {
    if (!analyticsManager) return;
    analyticsManager.setTrackingEnabled(enabled);
  };

  return {
    trackVideoView,
    updateVideoProgress,
    stopVideoTracking,
    setTrackingEnabled,
    sessionId
  };
}

// Hook for video elements with automatic tracking
export function useVideoElementTracking(
  videoRef: React.RefObject<HTMLVideoElement>,
  videoData: VideoViewData,
  language: string = 'en-US'
) {
  const analytics = useVideoAnalytics(language);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let viewId: string | null = null;

    const startTracking = async () => {
      if (isTracking) return;
      
      viewId = await analytics.trackVideoView({
        ...videoData,
        videoDuration: video.duration || 0
      });
      
      setIsTracking(true);

      // Start periodic updates
      trackingIntervalRef.current = setInterval(() => {
        if (video && viewId) {
          analytics.updateVideoProgress(
            videoData.videoId,
            video.currentTime,
            video.duration,
            !video.paused
          );
        }
      }, 1000); // Update every second
    };

    const stopTracking = () => {
      if (!isTracking) return;
      
      setIsTracking(false);
      
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
      
      if (viewId) {
        analytics.stopVideoTracking(videoData.videoId);
        viewId = null;
      }
    };

    // Event listeners
    const handlePlay = () => startTracking();
    const handlePause = () => {
      // Don't stop tracking on pause, just update progress
      if (isTracking && viewId) {
        analytics.updateVideoProgress(
          videoData.videoId,
          video.currentTime,
          video.duration,
          false
        );
      }
    };
    const handleEnded = () => stopTracking();
    const handleLoadedMetadata = () => {
      // Update duration when metadata loads
      if (isTracking && viewId) {
        analytics.updateVideoProgress(
          videoData.videoId,
          video.currentTime,
          video.duration,
          !video.paused
        );
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      
      stopTracking();
    };
  }, [videoRef, videoData, analytics, isTracking]);

  return {
    isTracking,
    sessionId: analytics.sessionId
  };
}