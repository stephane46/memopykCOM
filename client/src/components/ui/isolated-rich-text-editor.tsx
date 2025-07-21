import React, { useRef, useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface IsolatedRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  editorId: string; // Unique ID to prevent re-mounting
}

// Create a global registry to track editor instances
const editorRegistry = new Map<string, any>();

export function IsolatedRichTextEditor({
  value,
  onChange,
  placeholder = "Type your content...",
  height = "250px",
  editorId
}: IsolatedRichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<ReactQuill | null>(null);
  const isInitializedRef = useRef(false);

  // Enhanced toolbar configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['blockquote', 'code-block'],
        ['link']
      ],
      handlers: {
        'link': function(value: boolean) {
          const href = prompt('Enter URL:');
          if (href) {
            const url = href.startsWith('http') ? href : `https://${href}`;
            this.quill.format('link', url);
          }
        }
      }
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'blockquote', 'code-block', 'link'
  ];

  // Initialize editor only once
  useEffect(() => {
    if (!isInitializedRef.current) {
      setMounted(true);
      isInitializedRef.current = true;
    }
  }, []);

  // Handle value changes from outside
  useEffect(() => {
    if (mounted && quillInstanceRef.current) {
      try {
        const quill = quillInstanceRef.current.getEditor();
        if (quill && quill.root.innerHTML !== value) {
          quill.root.innerHTML = value || '';
        }
      } catch (error) {
        console.error('Error updating editor value:', error);
      }
    }
  }, [value, mounted]);

  // Handle change events
  const handleChange = (content: string) => {
    onChange(content);
  };

  if (!mounted) {
    return (
      <div className="h-64 border rounded animate-pulse bg-gray-50 flex items-center justify-center">
        <span className="text-gray-500">Loading editor...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="isolated-rich-text-editor">
      <ReactQuill
        ref={quillInstanceRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ height }}
        className="bg-white"
      />
    </div>
  );
}