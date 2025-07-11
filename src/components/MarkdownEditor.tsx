
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bold, Italic, Code, Image, Link, List, ListOrdered, Quote, Heading1, Heading2 } from 'lucide-react';
import { LaTeXRenderer, LaTeXInitializer } from './LaTeXRenderer';
import katex from 'katex';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Start writing your post..." 
}) => {
  const [activeTab, setActiveTab] = useState('write');
  const previewRef = useRef<HTMLDivElement>(null);

  // Process LaTeX in preview when tab changes to preview
  useEffect(() => {
    if (activeTab === 'preview' && previewRef.current) {
      // Give a small delay to ensure content is rendered
      setTimeout(() => {
        renderLaTeXInPreview();
      }, 50);
    }
  }, [activeTab, value]);

  const renderLaTeXInPreview = () => {
    if (!previewRef.current) return;

    // Process display mode LaTeX: \[ ... \]
    previewRef.current.querySelectorAll('.latex-block').forEach((element) => {
      try {
        if (element.textContent) {
          katex.render(element.textContent, element as HTMLElement, {
            displayMode: true,
            throwOnError: false,
            trust: true
          });
        }
      } catch (error) {
        console.error('LaTeX rendering error:', error);
      }
    });

    // Find all LaTeX notation in the preview
    const processLaTeXSyntax = (element: Element) => {
      if (!element.textContent || element.classList.contains('katex')) return;
      
      // Check if this element or its children contain LaTeX syntax
      if (
        element.textContent.includes('\\[') || 
        element.textContent.includes('\\]') || 
        element.textContent.includes('\\(') || 
        element.textContent.includes('\\)')
      ) {
        const html = element.innerHTML;
        
        // Replace display mode LaTeX: \[ ... \]
        let processedHtml = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
          try {
            return katex.renderToString(latex, { displayMode: true, throwOnError: false });
          } catch (error) {
            console.error('LaTeX rendering error:', error);
            return `<span class="text-red-500">Error rendering: ${latex}</span>`;
          }
        });
        
        // Replace inline mode LaTeX: \( ... \)
        processedHtml = processedHtml.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
          try {
            return katex.renderToString(latex, { displayMode: false, throwOnError: false });
          } catch (error) {
            console.error('LaTeX rendering error:', error);
            return `<span class="text-red-500">Error rendering: ${latex}</span>`;
          }
        });
        
        if (html !== processedHtml) {
          element.innerHTML = processedHtml;
        }
      }
    };

    // Process all elements in the preview
    const processElements = (rootElement: Element) => {
      processLaTeXSyntax(rootElement);
      
      // Process child elements that aren't KaTeX elements
      Array.from(rootElement.children).forEach(child => {
        if (!child.classList.contains('katex') && !child.classList.contains('katex-display')) {
          processElements(child);
        }
      });
    };

    processElements(previewRef.current);
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 10);
  };

  const renderPreview = (text: string) => {
    // Simple markdown-to-HTML converter for preview
    let html = text
      // Headers
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mb-2">$1</h3>')
      
      // Bold and Italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Code
      .replace(/`(.*?)`/g, '<code class="bg-secondary text-secondary-foreground px-1 py-0.5 rounded text-sm">$1</code>')
      
      // Line breaks
      .replace(/\n/g, '<br />');

    // Process LaTeX blocks
    // We'll mark them for processing by the useEffect
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
      return `<div class="latex-block my-4">${latex}</div>`;
    });
    
    html = html.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
      return `<span class="latex-inline">${latex}</span>`;
    });

    return html;
  };

  const PreviewContent = () => {
    if (!value) {
      return <p className="text-gray-500 italic">Nothing to preview yet. Start writing in the Write tab.</p>;
    }

    const htmlContent = renderPreview(value);
    
    return (
      <div className="prose prose-sm max-w-none">
        <div ref={previewRef} dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
          <TabsList className="bg-transparent">
            <TabsTrigger value="write">Write</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          {activeTab === 'write' && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('**', '**')}
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('*', '*')}
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('`', '`')}
                title="Code"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('# ', '')}
                title="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('## ', '')}
                title="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('> ', '')}
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('- ', '')}
                title="List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('\\(', '\\)')}
                title="Inline LaTeX Math"
                className="font-mono text-xs"
              >
                ƒ(x)
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertText('\\[', '\\]')}
                title="Block LaTeX Math"
                className="font-mono text-xs"
              >
                ∑
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="write" className="m-0">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-96 p-4 resize-none border-0 outline-none font-mono text-sm"
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="p-4 h-96 overflow-y-auto">
            <PreviewContent />
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>
            Supports Markdown formatting and LaTeX math: \(x^2\) or \[\sum_n x_n\]
          </span>
          <span>
            {value.length} characters
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
