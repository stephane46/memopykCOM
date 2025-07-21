import React, { useState } from 'react';

interface TestVideo {
  id: string;
  title: string;
  filename: string;
}

const testVideos: TestVideo[] = [
  { id: '1', title: 'Safari Video', filename: 'safari-1.mp4' },
  { id: '2', title: 'Vitamin Sea Video', filename: 'Our vitamin sea rework 2 compressed.mp4' },
  { id: '3', title: 'Pom Video', filename: 'Pom Gallery (RAV AAA_001) compressed.mp4' }
];

export default function GalleryVideoTest() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [playStatus, setPlayStatus] = useState<Record<string, string>>({});

  const testVideoPlayback = async (filename: string, videoId: string) => {
    try {
      setPlayStatus(prev => ({ ...prev, [videoId]: 'Loading...' }));
      
      // Test if video URL is accessible
      const proxyUrl = `/api/video-proxy/memopyk-gallery/${encodeURIComponent(filename)}`;
      console.log('🎬 Testing video URL:', proxyUrl);
      
      // Create video element for testing
      const video = document.createElement('video');
      video.src = proxyUrl;
      video.muted = false; // Allow sound
      video.controls = true;
      
      video.onloadedmetadata = () => {
        console.log('✅ Video metadata loaded successfully');
        setPlayStatus(prev => ({ ...prev, [videoId]: `Ready (${video.videoWidth}x${video.videoHeight})` }));
      };
      
      video.onerror = (e) => {
        console.error('❌ Video error:', e);
        setPlayStatus(prev => ({ ...prev, [videoId]: 'Error loading video' }));
      };
      
      video.oncanplay = () => {
        console.log('✅ Video can play');
        setPlayStatus(prev => ({ ...prev, [videoId]: 'Can play - Ready!' }));
      };
      
      // Try to play
      const playPromise = video.play();
      if (playPromise) {
        playPromise.then(() => {
          console.log('✅ Video playing successfully');
          setPlayStatus(prev => ({ ...prev, [videoId]: 'Playing successfully!' }));
        }).catch((error) => {
          console.error('❌ Play failed:', error);
          setPlayStatus(prev => ({ ...prev, [videoId]: `Play failed: ${error.message}` }));
        });
      }
      
      setSelectedVideo(videoId);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setPlayStatus(prev => ({ ...prev, [videoId]: `Failed: ${error.message}` }));
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-[#011526]">Gallery Video Playback Test</h2>
      
      <div className="grid gap-4">
        {testVideos.map((video) => (
          <div key={video.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg">{video.title}</h3>
              <button
                onClick={() => testVideoPlayback(video.filename, video.id)}
                className="bg-[#D67C4A] text-white px-4 py-2 rounded hover:bg-[#B8663D] transition-colors"
              >
                Test Playback
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">File: {video.filename}</p>
            <p className="text-sm">Status: {playStatus[video.id] || 'Not tested'}</p>
            
            {selectedVideo === video.id && (
              <div className="mt-4">
                <video
                  controls
                  className="w-full max-w-md mx-auto"
                  src={`/api/video-proxy/memopyk-gallery/${encodeURIComponent(video.filename)}`}
                >
                  Your browser does not support video playback.
                </video>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded-lg">
        <h4 className="font-semibold mb-2">Debug Info:</h4>
        <p className="text-sm">Check browser console for detailed logs</p>
        <p className="text-sm">Server logs show videos are streaming with 206 responses</p>
      </div>
    </div>
  );
}