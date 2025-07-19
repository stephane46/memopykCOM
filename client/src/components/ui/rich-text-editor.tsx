import { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useLanguage } from "@/hooks/use-language";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Tapez votre contenu...",
  className = "",
  height = "300px",
  disabled = false
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe onChange handler that prevents delta errors
  const handleChange = (content: string) => {
    if (onChange) {
      onChange(content);
    }
  };

  // Simplified and stable toolbar configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['link']
    ]
  };

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'blockquote', 'code-block', 'link'
  ];

  // Define tooltips based on language
  const tooltips = {
    fr: {
      header: 'En-tête',
      bold: 'Gras',
      italic: 'Italique',
      underline: 'Souligné',
      list: 'Liste numérotée',
      bullet: 'Liste à puces',
      blockquote: 'Citation',
      'code-block': 'Bloc de code',
      link: 'Lien (utilisez mailto:email@example.com pour les emails)'
    },
    en: {
      header: 'Header',
      bold: 'Bold',
      italic: 'Italic',
      underline: 'Underline',
      list: 'Numbered list',
      bullet: 'Bullet list',
      blockquote: 'Blockquote',
      'code-block': 'Code block',
      link: 'Link (use mailto:email@example.com for emails)'
    }
  };

  const currentTooltips = tooltips[language] || tooltips.en;

  if (!mounted) {
    return <div className="h-64 border rounded animate-pulse bg-gray-50 flex items-center justify-center">
      <span className="text-gray-500">Chargement de l'éditeur...</span>
    </div>;
  }

  return (
    <div className={`${className}`} style={{ height }}>
      <style dangerouslySetInnerHTML={{
        __html: `

          

          
          /* Enhanced toolbar styling */
          .ql-toolbar {
            border: 1px solid #d1d5db !important;
            border-radius: 6px 6px 0 0 !important;
            background: #f9fafb !important;
          }
          .ql-container {
            border: 1px solid #d1d5db !important;
            border-top: none !important;
            border-radius: 0 0 6px 6px !important;
            font-family: 'Poppins', sans-serif !important;
          }
          .ql-editor {
            min-height: 200px !important;
            font-size: 14px !important;
            line-height: 1.5 !important;
            font-family: 'Poppins', sans-serif !important;
          }
          .ql-editor.ql-blank::before {
            color: #9ca3af !important;
            font-style: normal !important;
          }
          
          /* Tooltips for toolbar buttons */
          .ql-toolbar button {
            position: relative;
          }
          .ql-toolbar button:hover::after {
            content: attr(title);
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #1f2937;
            color: white;
            padding: 4px 8px;
            font-size: 12px;
            border-radius: 4px;
            white-space: nowrap;
            z-index: 1000;
            margin-top: 5px;
          }
          .ql-toolbar button:hover::before {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-bottom: 5px solid #1f2937;
            z-index: 1000;
          }
          
          /* Specific button tooltips */
          .ql-toolbar .ql-bold:hover::after { content: "${currentTooltips.bold}"; }
          .ql-toolbar .ql-italic:hover::after { content: "${currentTooltips.italic}"; }
          .ql-toolbar .ql-underline:hover::after { content: "${currentTooltips.underline}"; }
          .ql-toolbar .ql-list[value="ordered"]:hover::after { content: "${currentTooltips.list}"; }
          .ql-toolbar .ql-list[value="bullet"]:hover::after { content: "${currentTooltips.bullet}"; }
          .ql-toolbar .ql-blockquote:hover::after { content: "${currentTooltips.blockquote}"; }
          .ql-toolbar .ql-code-block:hover::after { content: "${currentTooltips['code-block']}"; }
          .ql-toolbar .ql-link:hover::after { content: "${currentTooltips.link}"; }
          .ql-toolbar .ql-email:hover::after { content: "${currentTooltips.email}"; }

        `
      }} />
      
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={handleChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        style={{ height: `calc(${height} - 42px)` }}
        readOnly={disabled}
      />
    </div>
  );
}

// Rich Text Display Component
interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export function RichTextDisplay({ content, className = "" }: RichTextDisplayProps) {
  if (!content) return null;
  
  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        fontFamily: "'Poppins', sans-serif"
      }}
    />
  );
}