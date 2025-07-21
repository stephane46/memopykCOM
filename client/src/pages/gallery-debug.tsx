import React, { useState, useRef, useEffect } from 'react';

export default function GalleryDebugPage() {
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const testGalleryVideos = [
    { id: 'safari', filename: 'safari-1.mp4', name: 'Safari Video' },
    { id: 'vitamin', filename: 'Our vitamin sea rework 2 compressed.mp4', name: 'Vitamin Sea Video' },
    { id: 'pom', filename: 'Pom Gallery (RAV AAA_001) compressed.mp4', name: 'Pom Video' }
  ];

  const updateResult = (id: string, message: string) => {
    setTestResults(prev => ({ ...prev, [id]: message }));
    console.log(`🎬 ${id.toUpperCase()}: ${message}`);
  };

  const testVideoPlayback = async (videoId: string, filename: string) => {
    setIsLoading(true);
    updateResult(videoId, 'Testing...');

    try {
      // Test 1: Check if proxy URL is accessible
      const proxyUrl = `/api/video-proxy/memopyk-gallery/${encodeURIComponent(filename)}`;
      updateResult(videoId, `Testing proxy URL: ${proxyUrl}`);

      // Test 2: Create video element
      const video = document.createElement('video');
      video.src = proxyUrl;
      video.muted = false;
      video.controls = true;

      // Test 3: Add event listeners
      let metadataLoaded = false;
      let canPlay = false;
      let hasError = false;

      video.onloadedmetadata = () => {
        metadataLoaded = true;
        updateResult(videoId, `✅ Metadata loaded (${video.videoWidth}x${video.videoHeight}, ${video.duration.toFixed(1)}s)`);
      };

      video.oncanplay = () => {
        canPlay = true;
        updateResult(videoId, '✅ Can play - attempting autoplay...');
        
        // Try to play
        video.play()
          .then(() => {
            updateResult(videoId, '✅ PLAYING SUCCESSFULLY!');
          })
          .catch((error) => {
            updateResult(videoId, `❌ Play failed: ${error.message}`);
          });
      };

      video.onerror = (e) => {
        hasError = true;
        const error = video.error;
        if (error) {
          updateResult(videoId, `❌ Video error: ${error.code} - ${error.message}`);
        } else {
          updateResult(videoId, `❌ Unknown video error`);
        }
      };

      video.onloadstart = () => updateResult(videoId, 'Loading started...');
      video.onprogress = () => updateResult(videoId, 'Download progress...');
      video.onloadeddata = () => updateResult(videoId, 'First frame loaded');

      // Test 4: Wait for results
      setTimeout(() => {
        if (!metadataLoaded && !hasError) {
          updateResult(videoId, '⚠️ Timeout - metadata not loaded after 10s');
        }
      }, 10000);

      // Test 5: Add to page temporarily for testing
      if (videoRef.current) {
        videoRef.current.src = proxyUrl;
        videoRef.current.load();
      }

    } catch (error) {
      updateResult(videoId, `❌ Test failed: ${error.message}`);
    }

    setIsLoading(false);
  };

  const testDirectModal = (filename: string) => {
    console.log('🎬 TESTING DIRECT MODAL:', filename);
    
    const proxyUrl = `/api/video-proxy/memopyk-gallery/${encodeURIComponent(filename)}`;
    
    // Create video element
    const video = document.createElement('video');
    video.src = proxyUrl;
    video.controls = true;
    video.autoplay = true;
    video.muted = false;
    video.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 9999;
      max-width: 90vw;
      max-height: 90vh;
      background: black;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    `;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Close function
    const closeVideo = () => {
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
      video.pause();
      video.remove();
    };
    
    // Event listeners
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeVideo();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeVideo();
    }, { once: true });
    
    video.addEventListener('loadedmetadata', () => {
      console.log('✅ Modal video metadata loaded');
    });
    
    video.addEventListener('error', (e) => {
      console.error('❌ Modal video error:', e);
      closeVideo();
    });
    
    video.addEventListener('canplay', () => {
      console.log('✅ Modal video can play');
    });
    
    // Add to DOM
    overlay.appendChild(video);
    document.body.appendChild(overlay);
    
    video.play()
      .then(() => console.log('✅ Modal video playing'))
      .catch((error) => {
        console.error('❌ Modal play failed:', error);
        closeVideo();
      });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Gallery Video Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          <div className="grid gap-4 mb-6">
            {testGalleryVideos.map((video) => (
              <div key={video.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{video.name}</h3>
                  <div className="space-x-2">
                    <button
                      onClick={() => testVideoPlayback(video.id, video.filename)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      disabled={isLoading}
                    >
                      Test Playback
                    </button>
                    <button
                      onClick={() => testDirectModal(video.filename)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Test Modal
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">File: {video.filename}</p>
                <div className="text-sm bg-gray-50 p-2 rounded">
                  {testResults[video.id] || 'Not tested yet'}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Test Video Element</h3>
            <video
              ref={videoRef}
              controls
              className="w-full max-w-md"
              onLoadedMetadata={() => console.log('✅ Test video metadata loaded')}
              onCanPlay={() => console.log('✅ Test video can play')}
              onError={(e) => console.error('❌ Test video error:', e)}
            >
              Your browser does not support video playback.
            </video>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Debug Info</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Check browser console for detailed logs</li>
            <li>• Server logs show if videos are being requested properly</li>
            <li>• Hero videos work fine, gallery videos have issues</li>
            <li>• This page isolates the gallery video problem</li>
          </ul>
        </div>
      </div>
    </div>
  );
}