import React, { useRef, useEffect, useState, useCallback } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useLanguage } from "@/hooks/use-language";

interface StableRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

export const StableRichTextEditor = React.memo(function StableRichTextEditor({
  value,
  onChange,
  placeholder = "Type your content...",
  height = "250px"
}: StableRichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const quillRef = useRef<ReactQuill>(null);
  const isUpdatingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update internal value when external value changes (but not when we're updating it)
  useEffect(() => {
    if (!isUpdatingRef.current && value !== internalValue) {
      setInternalValue(value);
    }
  }, [value, internalValue]);

  // Stable change handler with debouncing
  const handleChange = useCallback((content: string) => {
    if (isUpdatingRef.current) return;
    
    setInternalValue(content);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the onChange call
    timeoutRef.current = setTimeout(() => {
      isUpdatingRef.current = true;
      onChange(content);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }, 300);
  }, [onChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Enhanced toolbar configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['link', 'email']
      ],
      handlers: {
        'link': function(value: boolean) {
          const href = prompt('Enter URL:');
          if (href) {
            const url = href.startsWith('http') ? href : `https://${href}`;
            this.quill.format('link', url);
          }
        },
        'email': function() {
          const email = prompt('Enter email:');
          if (email && email.includes('@')) {
            this.quill.format('link', `mailto:${email}`);
          }
        }
      }
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'blockquote', 'code-block', 'link'
  ];

  if (!mounted) {
    return (
      <div className="h-64 border rounded animate-pulse bg-gray-50 flex items-center justify-center">
        <span className="text-gray-500">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className="stable-rich-text-editor">
      <ReactQuill
        ref={quillRef}
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ height }}
        className="bg-white"
      />
    </div>
  );
});