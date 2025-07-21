import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Position {
  x: number;
  y: number;
  scale: number;
}

interface ImagePositionSelectorProps {
  imageUrl: string;
  initialPosition?: Position;
  onPositionChange: (position: Position) => void;
}

export function ImagePositionSelector({ 
  imageUrl, 
  initialPosition = { x: 0, y: 0, scale: 1 }, 
  onPositionChange 
}: ImagePositionSelectorProps) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Output frame is always 600x400
  const FRAME_WIDTH = 600;
  const FRAME_HEIGHT = 400;

  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  useEffect(() => {
    onPositionChange(position);
  }, [position, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageLoaded) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    setPosition(prev => ({
      ...prev,
      x: newX,
      y: newY
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (newScale: number[]) => {
    setPosition(prev => ({
      ...prev,
      scale: newScale[0]
    }));
  };

  const handleReset = () => {
    const resetPosition = { x: 0, y: 0, scale: 1 };
    setPosition(resetPosition);
  };

  const handleZoomIn = () => {
    setPosition(prev => ({
      ...prev,
      scale: Math.min(prev.scale + 0.1, 3)
    }));
  };

  const handleZoomOut = () => {
    setPosition(prev => ({
      ...prev,
      scale: Math.max(prev.scale - 0.1, 0.1)
    }));
  };

  return (
    <div className="space-y-4">
      {/* Preview Frame */}
      <div 
        ref={containerRef}
        className="relative border-2 border-gray-300 overflow-hidden cursor-move bg-gray-100"
        style={{ 
          width: FRAME_WIDTH, 
          height: FRAME_HEIGHT 
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Position preview"
          className="absolute select-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: `scale(${position.scale})`,
            transformOrigin: '0 0',
            maxWidth: 'none',
            maxHeight: 'none'
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(false)}
          draggable={false}
        />
        
        {/* Frame overlay */}
        <div className="absolute inset-0 border-2 border-orange-500 pointer-events-none" />
        
        {/* Center crosshair */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 w-4 h-4 border border-orange-500 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Zoom Slider */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Zoom: {Math.round(position.scale * 100)}%</label>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={position.scale <= 0.1}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <Slider
              value={[position.scale]}
              onValueChange={handleScaleChange}
              min={0.1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={position.scale >= 3}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Position Info */}
        <div className="text-sm text-gray-600 space-y-1">
          <div>Position: X: {Math.round(position.x)}, Y: {Math.round(position.y)}</div>
          <div>Scale: {position.scale.toFixed(1)}</div>
        </div>

        {/* Reset Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="w-full"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Position
        </Button>
      </div>
    </div>
  );
}