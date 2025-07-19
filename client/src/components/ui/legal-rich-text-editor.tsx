import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface LegalRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function LegalRichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Entrez le contenu...", 
  readOnly = false, 
  className = "" 
}: LegalRichTextEditorProps) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link'],
      [{ 'align': [] }],
      ['clean']
    ],
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'blockquote', 'code-block',
    'link', 'align'
  ];

  return (
    <div className={`legal-rich-text-editor ${className}`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        .legal-rich-text-editor .ql-editor {
          min-height: 200px;
          font-family: 'Poppins', sans-serif;
          line-height: 1.6;
        }
        
        .legal-rich-text-editor .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-bottom: none;
          border-radius: 6px 6px 0 0;
        }
        
        .legal-rich-text-editor .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
          border-top: none;
          border-radius: 0 0 6px 6px;
        }
        
        .legal-rich-text-editor .ql-editor h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #011526;
        }
        
        .legal-rich-text-editor .ql-editor h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: #2A4759;
        }
        
        .legal-rich-text-editor .ql-editor h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #2A4759;
        }
        
        .legal-rich-text-editor .ql-editor p {
          margin-bottom: 1rem;
          text-align: justify;
        }
        
        .legal-rich-text-editor .ql-editor ul,
        .legal-rich-text-editor .ql-editor ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
        }
        
        .legal-rich-text-editor .ql-editor li {
          margin-bottom: 0.25rem;
        }
        
        .legal-rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #D67C4A;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          background-color: #F2EBDC;
          padding: 1rem;
          border-radius: 4px;
        }
        
        .legal-rich-text-editor .ql-editor a {
          color: #2A4759;
          text-decoration: underline;
        }
        
        .legal-rich-text-editor .ql-editor a:hover {
          color: #D67C4A;
        }
        
        .legal-rich-text-editor .ql-editor code {
          background-color: #f4f4f4;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-size: 0.9rem;
        }
        
        .legal-rich-text-editor .ql-editor pre {
          background-color: #f4f4f4;
          padding: 1rem;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1rem 0;
        }

        .legal-rich-text-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="1"]::before,
        .legal-rich-text-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="1"]::before {
          content: 'Titre 1';
        }
        
        .legal-rich-text-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="2"]::before,
        .legal-rich-text-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="2"]::before {
          content: 'Titre 2';
        }
        
        .legal-rich-text-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="3"]::before,
        .legal-rich-text-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="3"]::before {
          content: 'Titre 3';
        }
        
        .legal-rich-text-editor .ql-snow .ql-picker.ql-header .ql-picker-label[data-value="false"]::before,
        .legal-rich-text-editor .ql-snow .ql-picker.ql-header .ql-picker-item[data-value="false"]::before {
          content: 'Normal';
        }
        `
      }} />
      
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
      />
    </div>
  );
}

interface LegalRichTextDisplayProps {
  content: string;
  className?: string;
}

export function LegalRichTextDisplay({ content, className = "" }: LegalRichTextDisplayProps) {
  return (
    <div 
      className={`legal-rich-text-display prose prose-lg max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        fontFamily: 'Poppins, sans-serif',
        lineHeight: '1.6',
        color: '#374151'
      }}
    />
  );
}