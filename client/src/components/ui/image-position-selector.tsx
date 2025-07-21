import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Position {
  x: number;
  y: number;
  scale: number;
}

interface ImagePositionSelectorProps {
  imageUrl: string;
  onPositionChange: (position: Position) => void;
  onGenerateStatic?: () => void;
  initialPosition?: Position;
  label?: string;
}

export function ImagePositionSelector({ 
  imageUrl, 
  onPositionChange, 
  onGenerateStatic,
  initialPosition = { x: 0, y: 0, scale: 1 },
  label = "Position de l'image"
}: ImagePositionSelectorProps) {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [scaleInputValue, setScaleInputValue] = useState<string>(Math.round(initialPosition.scale * 100).toString());
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Output frame is always 600x400
  const FRAME_WIDTH = 600;
  const FRAME_HEIGHT = 400;

  // Reset image states when URL changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [imageUrl]);

  // Only reset position when we have a meaningful initialPosition (not default zeros)
  useEffect(() => {
    if (initialPosition && (initialPosition.x !== 0 || initialPosition.y !== 0 || initialPosition.scale !== 1)) {
      setPosition(initialPosition);
      setScaleInputValue(Math.round(initialPosition.scale * 100).toString());
    }
  }, [initialPosition.x, initialPosition.y, initialPosition.scale]);

  useEffect(() => {
    onPositionChange(position);
  }, [position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return;
    
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left - position.x,
        y: e.clientY - rect.top - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageLoaded) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const newX = e.clientX - rect.left - dragStart.x;
      const newY = e.clientY - rect.top - dragStart.y;

      setPosition(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (newScale: number[]) => {
    setPosition(prev => ({
      ...prev,
      scale: newScale[0]
    }));
    setScaleInputValue(Math.round(newScale[0] * 100).toString());
  };

  const handleReset = () => {
    const resetPosition = { x: 0, y: 0, scale: 1 };
    setPosition(resetPosition);
  };

  const handleZoomIn = () => {
    setPosition(prev => {
      const newScale = Math.min(prev.scale + 0.05, 3);
      setScaleInputValue(Math.round(newScale * 100).toString());
      return {
        ...prev,
        scale: newScale
      };
    });
  };

  const handleZoomOut = () => {
    setPosition(prev => {
      const newScale = Math.max(prev.scale - 0.05, 0.1);
      setScaleInputValue(Math.round(newScale * 100).toString());
      return {
        ...prev,
        scale: newScale
      };
    });
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    
    // Auto-fit image if no meaningful position is set
    if (position.x === 0 && position.y === 0 && position.scale === 1 && imageRef.current) {
      const img = imageRef.current;
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      
      if (imgWidth > 0 && imgHeight > 0) {
        // Calculate scale to fit image nicely in frame
        const scaleX = FRAME_WIDTH / imgWidth;
        const scaleY = FRAME_HEIGHT / imgHeight;
        const autoScale = Math.min(scaleX, scaleY, 1); // Don't scale up
        
        // Center the image
        const scaledWidth = imgWidth * autoScale;
        const scaledHeight = imgHeight * autoScale;
        const centerX = (FRAME_WIDTH - scaledWidth) / 2;
        const centerY = (FRAME_HEIGHT - scaledHeight) / 2;
        
        const autoPosition = { x: centerX, y: centerY, scale: autoScale };
        setPosition(autoPosition);
      }
    }
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{label}</h3>
      
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
        {/* Loading state */}
        {!imageLoaded && !imageError && imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <div className="text-gray-500">Loading image...</div>
          </div>
        )}
        
        {/* Error state */}
        {(imageError || !imageUrl) && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100">
            <div className="text-red-500 text-center px-4">
              {!imageUrl ? 'No image selected' : 'Image failed to load'}
              <br />
              <span className="text-xs">Please upload a new image</span>
            </div>
          </div>
        )}
        
        {imageUrl && !imageError && (
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
              maxHeight: 'none',
              visibility: imageLoaded ? 'visible' : 'hidden'
            }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />
        )}
        
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
              step={0.05}
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

        {/* Manual Position Controls */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600">X Position</label>
              <Input
                type="number"
                value={Math.round(position.x)}
                onChange={(e) => setPosition(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Y Position</label>
              <Input
                type="number"
                value={Math.round(position.y)}
                onChange={(e) => setPosition(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Scale (%)</label>
              <div className="flex items-center space-x-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentScale = position.scale;
                    const newScale = Math.max(0.1, currentScale - 0.01);
                    setPosition(prev => ({ ...prev, scale: newScale }));
                    setScaleInputValue(Math.round(newScale * 100).toString());
                  }}
                  disabled={position.scale <= 0.1}
                  className="h-8 w-8 p-0"
                >
                  -
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={scaleInputValue}
                  onChange={(e) => {
                    setScaleInputValue(e.target.value);
                  }}
                  onBlur={() => {
                    const num = Number(scaleInputValue);
                    if (!isNaN(num) && num > 0) {
                      const scale = Math.max(0.1, Math.min(3, num / 100));
                      setPosition(prev => ({ ...prev, scale }));
                      setScaleInputValue(Math.round(scale * 100).toString());
                    } else {
                      setScaleInputValue(Math.round(position.scale * 100).toString());
                    }
                  }}
                  className="h-8 text-xs flex-1"
                  placeholder="100"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentScale = position.scale;
                    const newScale = Math.min(3, currentScale + 0.01);
                    setPosition(prev => ({ ...prev, scale: newScale }));
                    setScaleInputValue(Math.round(newScale * 100).toString());
                  }}
                  disabled={position.scale >= 3}
                  className="h-8 w-8 p-0"
                >
                  +
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Position
          </Button>
          
          {onGenerateStatic && (
            <Button
              type="button"
              onClick={onGenerateStatic}
              className="flex-1"
            >
              Generate Static Image
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}