import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Label } from './label';

interface ImagePositionSelectorProps {
  imageUrl: string;
  onPositionChange: (position: { x: number; y: number; scale: number }) => void;
  onGenerateStatic?: () => void;
  initialPosition?: { x: number; y: number; scale: number };
  label?: string;
}

export function ImagePositionSelector({ 
  imageUrl, 
  onPositionChange, 
  onGenerateStatic,
  initialPosition = { x: 0, y: 0, scale: 1 },
  label = "Position de l'image"
}: ImagePositionSelectorProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Gallery thumbnail dimensions (admin panel positioning frame) - 600x400 for direct output matching
  const FRAME_WIDTH = 600;
  const FRAME_HEIGHT = 400;

  useEffect(() => {
    onPositionChange(position);
  }, [position, onPositionChange]);

  // Update position when initialPosition changes (e.g., when editing different items)
  useEffect(() => {
    if (initialPosition && 
        (initialPosition.x !== 0 || initialPosition.y !== 0 || initialPosition.scale !== 1)) {
      setPosition(initialPosition);
      console.log('🔄 Updated to new initial position:', initialPosition);
    }
  }, [initialPosition]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      const img = imageRef.current;
      const newSize = { width: img.naturalWidth, height: img.naturalHeight };
      setImageSize(newSize);
      console.log('🖼️ Image loaded:', newSize);
      
      // Only auto-fit if no valid initialPosition was provided
      if (newSize.width > 0 && newSize.height > 0) {
        const hasValidInitialPosition = initialPosition && 
          (initialPosition.x !== 0 || initialPosition.y !== 0 || initialPosition.scale !== 1);
        
        if (hasValidInitialPosition) {
          // Use the provided initial position
          setPosition(initialPosition);
          console.log('🎯 Using saved position:', initialPosition);
        } else {
          // Calculate scale to fit entire image in frame - start with a reasonable scale
          const scaleX = FRAME_WIDTH / newSize.width;
          const scaleY = FRAME_HEIGHT / newSize.height;
          const fitScale = Math.min(scaleX, scaleY, 1); // Prevent scaling up
          
          // Start with center position
          const centerX = 0;
          const centerY = 0;
          
          setPosition({ x: centerX, y: centerY, scale: fitScale });
          console.log('🎯 Auto-calculated position:', { 
            scale: fitScale,
            calculatedFrom: { scaleX, scaleY },
            position: { x: centerX, y: centerY }
          });
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - containerRect.left - position.x,
        y: e.clientY - containerRect.top - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const scaledWidth = imageSize.width * position.scale;
    const scaledHeight = imageSize.height * position.scale;
    
    // Allow some movement beyond frame boundaries for better UX
    const maxX = FRAME_WIDTH * 0.5;
    const minX = -(scaledWidth - FRAME_WIDTH * 0.5);
    const maxY = FRAME_HEIGHT * 0.5;
    const minY = -(scaledHeight - FRAME_HEIGHT * 0.5);

    const newX = Math.max(minX, Math.min(maxX, e.clientX - containerRect.left - dragStart.x));
    const newY = Math.max(minY, Math.min(maxY, e.clientY - containerRect.top - dragStart.y));

    setPosition(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (newScale: number) => {
    setPosition(prev => ({ ...prev, scale: newScale }));
  };

  const resetPosition = () => {
    if (imageSize.width > 0 && imageSize.height > 0) {
      const scaleX = FRAME_WIDTH / imageSize.width;
      const scaleY = FRAME_HEIGHT / imageSize.height;
      const fitScale = Math.min(scaleX, scaleY, 1);
      
      setPosition({ x: 0, y: 0, scale: fitScale });
      console.log('🔄 Reset to scale:', fitScale);
    } else {
      setPosition({ x: 0, y: 0, scale: 0.5 });
    }
  };

  const centerImage = () => {
    if (imageSize.width > 0 && imageSize.height > 0) {
      const scaledWidth = imageSize.width * position.scale;
      const scaledHeight = imageSize.height * position.scale;
      const centerX = (FRAME_WIDTH - scaledWidth) / 2;
      const centerY = (FRAME_HEIGHT - scaledHeight) / 2;
      setPosition(prev => ({ ...prev, x: centerX, y: centerY }));
      console.log('🎯 Centered to:', { x: centerX, y: centerY });
    }
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {/* Preview Frame */}
      <div 
        ref={containerRef}
        className="relative border-2 border-dashed border-gray-300 bg-gray-50 cursor-grab"
        style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <img
            ref={imageRef}
            src={imageUrl.includes('supabase.memopyk.org:8001') 
              ? imageUrl.replace('http://supabase.memopyk.org:8001/object/public/memopyk-gallery/', '/api/image-proxy/memopyk-gallery/')
              : imageUrl}
            alt="Aperçu"
            className="absolute select-none"
            style={{
              left: position.x,
              top: position.y,
              transform: `scale(${position.scale})`,
              transformOrigin: '0 0',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              maxWidth: 'none',
              maxHeight: 'none'
            }}
            onLoad={handleImageLoad}
            onMouseDown={handleMouseDown}
            draggable={false}
          />
        </div>
        
        {/* Frame overlay */}
        <div className="absolute inset-0 pointer-events-none border-2 border-[#D67C4A] bg-transparent">
          <div className="absolute -top-6 left-0 text-xs text-[#D67C4A] font-medium">
            Aperçu galerie ({FRAME_WIDTH}×{FRAME_HEIGHT})
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Scale Control */}
        <div className="flex items-center gap-3">
          <Label className="text-sm w-16">Zoom:</Label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.01"
            value={position.scale}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className="flex-1"
          />
          <input
            type="number"
            min="10"
            max="200"
            step="1"
            value={Math.round(position.scale * 100)}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value) / 100)}
            className="w-16 px-2 py-1 border rounded text-sm"
          />
          <span className="text-sm text-gray-600">%</span>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={centerImage}
          >
            Centrer
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={resetPosition}
          >
            Réinitialiser
          </Button>
        </div>

        {/* Generate Static Image Button */}
        {onGenerateStatic && (
          <Button 
            type="button" 
            variant="default" 
            size="sm" 
            onClick={onGenerateStatic}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
          >
            Générer Image Statique (300x200)
          </Button>
        )}

        {/* Position Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Position: X: {Math.round(position.x)}, Y: {Math.round(position.y)}</div>
          <div>Glissez l'image pour la repositionner dans le cadre</div>
        </div>
      </div>
    </div>
  );
}