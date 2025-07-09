import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileVideo, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  onUploadComplete: (url: string, fileName: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  label?: string;
  currentUrl?: string;
  disabled?: boolean;
}

export function FileUpload({
  onUploadComplete,
  accept = "video/*,image/*",
  maxSize = 50,
  label = "Upload File",
  currentUrl,
  disabled = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiRequest('POST', '/api/upload', formData);
      const result = await response.json();

      clearInterval(progressInterval);
      setProgress(100);

      if (result.url) {
        onUploadComplete(result.url, result.originalName);
        toast({
          title: "Upload successful",
          description: `${result.originalName} has been uploaded successfully`,
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      uploadFile(files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files && files[0]) {
      uploadFile(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    onUploadComplete('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (url: string) => {
    if (url.includes('video') || url.endsWith('.mp4') || url.endsWith('.webm')) {
      return <FileVideo className="h-4 w-4" />;
    }
    return <Image className="h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {currentUrl ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
          {getFileIcon(currentUrl)}
          <span className="flex-1 text-sm truncate">{currentUrl.split('/').pop()}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFile}
            disabled={disabled || uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-gray-400'}
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!disabled && !uploading ? openFileDialog : undefined}
        >
          {uploading ? (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto animate-pulse" />
              <p className="text-sm text-gray-600">Uploading...</p>
              <Progress value={progress} className="w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-gray-400">
                Max size: {maxSize}MB
              </p>
            </div>
          )}
        </div>
      )}

      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}