import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Image as ImageIcon, Link, FileText, Save, ChevronDown,
  Type, PaintBucket, Minus, Plus, Maximize2, Minimize2, RotateCcw, RotateCw,
  Code, Quote, Heading1, Heading2, Heading3, Moon, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LaTeXRenderer, LaTeXInitializer } from './LaTeXRenderer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import katex from 'katex';
import 'katex/dist/katex.min.css';

interface WordLikeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoSave?: boolean;
}

// Define accessible color palettes based on WCAG 2.1 standards
const LIGHT_THEME = {
  background: '#FFFFFF',    // White background
  text: '#1A1A1A',          // Very dark gray for main text (~17:1 contrast)
  heading: '#000000',       // Pure black for headings (~21:1 contrast)
  accent: '#107896',        // Teal accent color for links/buttons (~5.1:1 contrast)
  secondaryText: '#737373', // Medium gray for secondary text (~6.2:1 contrast)
  codeBackground: '#F5F5F5', // Very light gray for code blocks
  codeText: '#1A1A1A',      // Same as main text for code
  border: '#E6E6E6'         // Light gray for borders
};

const DARK_THEME = {
  background: '#121212',    // Dark gray background (not pure black)
  text: '#E0E0E0',          // Off-white text (~14.2:1 contrast)
  heading: '#FFFFFF',       // Pure white for headings (~18.7:1 contrast)
  accent: '#8AB4F8',        // Light blue accent for links/buttons (~8.9:1 contrast)
  secondaryText: '#B3B3B3', // Medium gray for secondary text (~5.6:1 contrast)
  codeBackground: '#1E1E1E', // Slightly lighter gray for code blocks
  codeText: '#ECECEC',      // Light gray for code text (~14.1:1 contrast)
  border: '#333333'         // Medium gray for borders
};

const WordLikeEditor: React.FC<WordLikeEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your post...",
  autoSave = true
}) => {
  const [activeTab, setActiveTab] = useState('write');
  const [textColor, setTextColor] = useState<string>('#1A1A1A');
  const [highlightColor, setHighlightColor] = useState<string>('transparent');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>('');
  const [imagePosition, setImagePosition] = useState<string>('inline');
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [linkText, setLinkText] = useState<string>('');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Get current theme based on dark mode state
  const theme = isDarkMode ? DARK_THEME : LIGHT_THEME;

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

  // Helper to save the current selection
  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    return selection.getRangeAt(0).cloneRange();
  };
  
  // Helper to restore a saved selection
  const restoreSelection = (range: Range | null) => {
    if (!range) return;
    
    const selection = window.getSelection();
    if (!selection) return;
    
    selection.removeAllRanges();
    selection.addRange(range);
  };
  
  // Improved execCommand wrapper that preserves selection
  const handleExecCommand = (command: string, value: string = '') => {
    // Save selection state
    const selection = window.getSelection();
    if (!selection || !editorRef.current) {
      if (editorRef.current) editorRef.current.focus();
      return;
    }
    
    // Save the current selection
    const savedRange = saveSelection();
    
    // Focus the editor first to ensure commands work properly
    editorRef.current.focus();
    
    // Execute the command
    document.execCommand(command, false, value);
    
    // Restore the selection if possible
    if (savedRange) {
      try {
        restoreSelection(savedRange);
      } catch (e) {
        // If restoration fails, just ensure editor stays focused
        editorRef.current.focus();
      }
    } else {
      // Ensure editor stays focused
      editorRef.current.focus();
    }
    
    // Clean up formatting
    setTimeout(cleanupEditorContent, 10);
  };

  // Add a function to normalize formatting when applying multiple formats
  const normalizeFormattingAfterCommand = () => {
    if (!editorRef.current) return;
    
    // Wait for the browser to apply the formatting command
    setTimeout(() => {
      // Get the current selection
      const selection = window.getSelection();
      if (!selection) return;
      
      // Get the range if there is one
      if (selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      
      // Only process if we have a selection
      if (range.collapsed) return;
      
      // Get the selected node
      const container = range.commonAncestorContainer;
      if (!container) return;
      
      // Clean up nested formatting elements
      cleanupEditorContent();
      
      // Restore focus to the editor
      editorRef.current.focus();
    }, 10);
  };
  
  // Enhanced formatting handler with normalization
  const handleFormatting = (command: 'bold' | 'italic' | 'underline') => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false);
      normalizeFormattingAfterCommand();
    }
  };

  const handleFontSizeChange = (size: number) => {
    // We're using a fixed font size now, so this function is just a stub
    return;
  };

  // Enhanced font family handler with normalization
  const handleFontFamilyChange = (family: string) => {
    // This function is kept for compatibility but no longer used
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    
    // Focus the editor first
    editorRef.current.focus();
    
    // Use the native fontName command which works better with selections
    document.execCommand('fontName', false, family);
    normalizeFormattingAfterCommand();
  };

  // Enhanced text color handler with normalization
  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    
    // Focus the editor first
    editorRef.current.focus();
    
    // Use the native foreColor command which works better with selections
    document.execCommand('foreColor', false, color);
    normalizeFormattingAfterCommand();
  };

  // Enhanced highlight color handler with normalization
  const handleHighlightColorChange = (color: string) => {
    setHighlightColor(color);
    
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;
    
    // Focus the editor first
    editorRef.current.focus();
    
    // Use the native hiliteColor command which works better with selections
    document.execCommand('hiliteColor', false, color);
    normalizeFormattingAfterCommand();
  };

  const handleInsertImage = () => {
    if (imageUrl) {
      let imageHtml = `<img src="${imageUrl}" alt="${imageAlt || 'Image'}" `;
      
      // Add positioning classes
      switch (imagePosition) {
        case 'left':
          imageHtml += `class="float-left mr-4 mb-2" `;
          break;
        case 'right':
          imageHtml += `class="float-right ml-4 mb-2" `;
          break;
        case 'center':
          imageHtml = `<div class="flex justify-center my-4">${imageHtml}</div>`;
          break;
        default:
          imageHtml += `class="inline-block" `;
      }
      
      if (imagePosition !== 'center') {
        imageHtml += '/>';
      }
      
      handleExecCommand('insertHTML', imageHtml);
      setImageUrl('');
      setImageAlt('');
    }
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      const text = linkText || linkUrl;
      handleExecCommand('insertHTML', `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`);
      setLinkUrl('');
      setLinkText('');
    }
  };

  const handleInsertLatex = (mode: 'inline' | 'block') => {
    const latex = mode === 'inline' ? '\\(x^2 + y^2 = z^2\\)' : '\\[\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\\]';
    handleExecCommand('insertHTML', latex);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderPreview = () => {
    if (!editorRef.current) return '';
    
    // Get HTML content from the contentEditable div
    let html = editorRef.current.innerHTML;
    
    // Process LaTeX blocks
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
      return `<div class="latex-block my-4">${latex}</div>`;
    });
    
    html = html.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
      return `<span class="latex-inline">${latex}</span>`;
    });
    
    // Style links with accent color
    html = html.replace(/<a\s+([^>]*)>/g, (match, attributes) => {
      return `<a ${attributes} style="color: ${theme.accent}; text-decoration: underline;">`;
    });
    
    return html;
  };

  // Helper function to get the current font size of selected text
  const getCurrentSelectionFontSize = (): number => {
    return 18; // Fixed font size
  };
  
  // Function to increase or decrease font size of selected text
  const adjustSelectedTextSize = (increment: boolean) => {
    // No longer needed, but keeping stub for compatibility
    return;
  };

  // Clean up editor content to prevent formatting glitches
  const cleanupEditorContent = () => {
    if (!editorRef.current) return;
    
    // Remove any empty spans that might cause glitches
    const emptySpans = editorRef.current.querySelectorAll('span:empty:not([data-marker])');
    emptySpans.forEach(span => span.remove());
    
    // Merge adjacent spans with the same formatting
    const allSpans = editorRef.current.querySelectorAll('span');
    allSpans.forEach(span => {
      const nextSibling = span.nextSibling;
      if (nextSibling && nextSibling.nodeName === 'SPAN') {
        const nextSpan = nextSibling as HTMLSpanElement;
        
        // Check if they have the same style properties
        const spanStyle = window.getComputedStyle(span);
        const nextSpanStyle = window.getComputedStyle(nextSpan);
        
        if (
          spanStyle.fontFamily === nextSpanStyle.fontFamily &&
          spanStyle.color === nextSpanStyle.color &&
          spanStyle.backgroundColor === nextSpanStyle.backgroundColor &&
          spanStyle.fontWeight === nextSpanStyle.fontWeight &&
          spanStyle.fontStyle === nextSpanStyle.fontStyle &&
          spanStyle.textDecoration === nextSpanStyle.textDecoration
        ) {
          // Merge the spans
          span.innerHTML += nextSpan.innerHTML;
          nextSpan.remove();
        }
      }
    });
  };
  
  // Add event listener for selection changes to maintain formatting state
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || !editorRef.current) return;
      
      // Only process if the selection is inside our editor
      if (!editorRef.current.contains(selection.anchorNode)) return;
      
      // Clean up content after selection changes
      setTimeout(cleanupEditorContent, 0);
    };
    
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if editor is focused
      if (document.activeElement !== editorRef.current) return;
      
      // Add other keyboard shortcuts here if needed
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={`border rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`} style={{ 
      borderColor: theme.border,
      backgroundColor: theme.background
    }}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className={`flex flex-col border-b`} style={{ 
          backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5',
          borderColor: theme.border
        }}>
          {/* Top toolbar */}
          <div className={`flex items-center justify-between px-2 py-1 border-b`} style={{ borderColor: theme.border }}>
            <div className="flex items-center space-x-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className={`h-8 px-2 gap-1`} style={{ color: theme.text }}>
                    <FileText className="h-4 w-4" />
                    <span>File</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent style={{ 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text
                }}>
                  <div className="flex flex-col space-y-1">
                    <Button variant="ghost" size="sm" className={`justify-start`} style={{ color: theme.text }}>
                      <FileText className="h-4 w-4 mr-2" />
                      New Document
                    </Button>
                    <Button variant="ghost" size="sm" className={`justify-start`} style={{ color: theme.text }}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Separator orientation="vertical" className={`h-8`} style={{ backgroundColor: theme.border }} />

              {/* Removed font family chooser */}

              <Separator orientation="vertical" className={`h-8`} style={{ backgroundColor: theme.border }} />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFormatting('bold')}
                className={`h-8 w-8 p-0`}
                style={{ color: theme.text }}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFormatting('italic')}
                className={`h-8 w-8 p-0`}
                style={{ color: theme.text }}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFormatting('underline')}
                className={`h-8 w-8 p-0`}
                style={{ color: theme.text }}
              >
                <Underline className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-8" />

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <div 
                      className="h-4 w-4 border border-gray-300 rounded-sm" 
                      style={{ backgroundColor: textColor }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="grid grid-cols-10 gap-1">
                    {/* Define accessible color palettes based on WCAG 2.1 standards */}
                    {/* Light theme colors */}
                    <Button 
                      key="#1A1A1A"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#1A1A1A' }}
                      onClick={() => handleTextColorChange('#1A1A1A')}
                    />
                    <Button 
                      key="#737373"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#737373' }}
                      onClick={() => handleTextColorChange('#737373')}
                    />
                    <Button 
                      key="#B3B3B3"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#B3B3B3' }}
                      onClick={() => handleTextColorChange('#B3B3B3')}
                    />
                    <Button 
                      key="#E0E0E0"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#E0E0E0' }}
                      onClick={() => handleTextColorChange('#E0E0E0')}
                    />
                    <Button 
                      key="#FFFFFF"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#FFFFFF' }}
                      onClick={() => handleTextColorChange('#FFFFFF')}
                    />
                    {/* Dark theme colors */}
                    <Button 
                      key="#E0E0E0"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#E0E0E0' }}
                      onClick={() => handleTextColorChange('#E0E0E0')}
                    />
                    <Button 
                      key="#B3B3B3"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#B3B3B3' }}
                      onClick={() => handleTextColorChange('#B3B3B3')}
                    />
                    <Button 
                      key="#737373"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#737373' }}
                      onClick={() => handleTextColorChange('#737373')}
                    />
                    <Button 
                      key="#1A1A1A"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#1A1A1A' }}
                      onClick={() => handleTextColorChange('#1A1A1A')}
                    />
                    <Button 
                      key="#121212"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#121212' }}
                      onClick={() => handleTextColorChange('#121212')}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <PaintBucket className="h-4 w-4" style={{ color: highlightColor !== 'transparent' ? highlightColor : 'currentColor' }} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="grid grid-cols-10 gap-1">
                    {/* Define accessible color palettes based on WCAG 2.1 standards */}
                    {/* Light theme colors */}
                    <Button 
                      key="transparent"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm border border-gray-300"
                      style={{ backgroundColor: 'transparent' }}
                      onClick={() => handleHighlightColorChange('transparent')}
                    />
                    <Button 
                      key="#000000"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#000000' }}
                      onClick={() => handleHighlightColorChange('#000000')}
                    />
                    <Button 
                      key="#434343"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#434343' }}
                      onClick={() => handleHighlightColorChange('#434343')}
                    />
                    <Button 
                      key="#666666"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#666666' }}
                      onClick={() => handleHighlightColorChange('#666666')}
                    />
                    <Button 
                      key="#999999"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#999999' }}
                      onClick={() => handleHighlightColorChange('#999999')}
                    />
                    <Button 
                      key="#B7B7B7"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#B7B7B7' }}
                      onClick={() => handleHighlightColorChange('#B7B7B7')}
                    />
                    <Button 
                      key="#CCCCCC"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#CCCCCC' }}
                      onClick={() => handleHighlightColorChange('#CCCCCC')}
                    />
                    <Button 
                      key="#D9D9D9"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#D9D9D9' }}
                      onClick={() => handleHighlightColorChange('#D9D9D9')}
                    />
                    <Button 
                      key="#F3F3F3"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#F3F3F3' }}
                      onClick={() => handleHighlightColorChange('#F3F3F3')}
                    />
                    {/* Dark theme colors */}
                    <Button 
                      key="#F3F3F3"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#F3F3F3' }}
                      onClick={() => handleHighlightColorChange('#F3F3F3')}
                    />
                    <Button 
                      key="#D9D9D9"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#D9D9D9' }}
                      onClick={() => handleHighlightColorChange('#D9D9D9')}
                    />
                    <Button 
                      key="#CCCCCC"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#CCCCCC' }}
                      onClick={() => handleHighlightColorChange('#CCCCCC')}
                    />
                    <Button 
                      key="#B7B7B7"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#B7B7B7' }}
                      onClick={() => handleHighlightColorChange('#B7B7B7')}
                    />
                    <Button 
                      key="#999999"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#999999' }}
                      onClick={() => handleHighlightColorChange('#999999')}
                    />
                    <Button 
                      key="#666666"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#666666' }}
                      onClick={() => handleHighlightColorChange('#666666')}
                    />
                    <Button 
                      key="#434343"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#434343' }}
                      onClick={() => handleHighlightColorChange('#434343')}
                    />
                    <Button 
                      key="#000000"
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 rounded-sm"
                      style={{ backgroundColor: '#000000' }}
                      onClick={() => handleHighlightColorChange('#000000')}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center">
              <TabsList className="bg-transparent" style={{ 
                backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5',
              }}>
                <TabsTrigger 
                  value="write"
                  style={{
                    color: activeTab === 'write' ? theme.accent : theme.text,
                    backgroundColor: activeTab === 'write' ? theme.background : 'transparent'
                  }}
                >
                  Edit
                </TabsTrigger>
                <TabsTrigger 
                  value="preview"
                  style={{
                    color: activeTab === 'preview' ? theme.accent : theme.text,
                    backgroundColor: activeTab === 'preview' ? theme.background : 'transparent'
                  }}
                >
                  Preview
                </TabsTrigger>
              </TabsList>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleDarkMode}
                className="h-8 w-8 p-0 ml-2"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                style={{ color: theme.accent }}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFullscreen}
                className="h-8 w-8 p-0 ml-2"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                style={{ color: theme.accent }}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Second toolbar row */}
          {activeTab === 'write' && (
            <div className="flex items-center px-2 py-1 overflow-x-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('justifyLeft')}
                className="h-8 w-8 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('justifyCenter')}
                className="h-8 w-8 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('justifyRight')}
                className="h-8 w-8 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('justifyFull')}
                className="h-8 w-8 p-0"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-8 mx-2" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('insertUnorderedList')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('insertOrderedList')}
                className="h-8 w-8 p-0"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-8 mx-2" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('formatBlock', '<h1>')}
                className="h-8 w-8 p-0"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('formatBlock', '<h2>')}
                className="h-8 w-8 p-0"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('formatBlock', '<h3>')}
                className="h-8 w-8 p-0"
              >
                <Heading3 className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-8 mx-2" />

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                    style={{ color: theme.text }}
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Image
                  </Button>
                </DialogTrigger>
                <DialogContent style={{
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                  color: theme.text
                }}>
                  <DialogHeader>
                    <DialogTitle style={{ color: theme.heading }}>Insert Image</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="imageUrl" style={{ color: theme.text }}>Image URL</Label>
                      <Input 
                        id="imageUrl" 
                        value={imageUrl} 
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/image.jpg" 
                        style={{
                          backgroundColor: isDarkMode ? theme.codeBackground : theme.background,
                          borderColor: theme.border,
                          color: theme.text
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="imageAlt" style={{ color: theme.text }}>Alt Text</Label>
                      <Input 
                        id="imageAlt" 
                        value={imageAlt} 
                        onChange={(e) => setImageAlt(e.target.value)}
                        placeholder="Image description" 
                        style={{
                          backgroundColor: isDarkMode ? theme.codeBackground : theme.background,
                          borderColor: theme.border,
                          color: theme.text
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label style={{ color: theme.text }}>Position</Label>
                      <div className="flex space-x-2">
                        <Button 
                          variant={imagePosition === 'inline' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setImagePosition('inline')}
                          style={{
                            backgroundColor: imagePosition === 'inline' ? theme.accent : 'transparent',
                            borderColor: theme.border,
                            color: imagePosition === 'inline' ? theme.background : theme.text
                          }}
                        >
                          Inline
                        </Button>
                        <Button 
                          variant={imagePosition === 'left' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setImagePosition('left')}
                          style={{
                            backgroundColor: imagePosition === 'left' ? theme.accent : 'transparent',
                            borderColor: theme.border,
                            color: imagePosition === 'left' ? theme.background : theme.text
                          }}
                        >
                          Left
                        </Button>
                        <Button 
                          variant={imagePosition === 'center' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setImagePosition('center')}
                          style={{
                            backgroundColor: imagePosition === 'center' ? theme.accent : 'transparent',
                            borderColor: theme.border,
                            color: imagePosition === 'center' ? theme.background : theme.text
                          }}
                        >
                          Center
                        </Button>
                        <Button 
                          variant={imagePosition === 'right' ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => setImagePosition('right')}
                          style={{
                            backgroundColor: imagePosition === 'right' ? theme.accent : 'transparent',
                            borderColor: theme.border,
                            color: imagePosition === 'right' ? theme.background : theme.text
                          }}
                        >
                          Right
                        </Button>
                      </div>
                    </div>
                    <Button onClick={handleInsertImage} style={{
                      backgroundColor: theme.accent,
                      color: theme.background
                    }}>Insert Image</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                  >
                    <Link className="h-4 w-4 mr-1" />
                    Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Insert Link</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="linkUrl">URL</Label>
                      <Input 
                        id="linkUrl" 
                        value={linkUrl} 
                        onChange={(e) => setLinkUrl(e.target.value)}
                        placeholder="https://example.com" 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="linkText">Link Text</Label>
                      <Input 
                        id="linkText" 
                        value={linkText} 
                        onChange={(e) => setLinkText(e.target.value)}
                        placeholder="Click here" 
                      />
                    </div>
                    <Button onClick={handleInsertLink}>Insert Link</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Separator orientation="vertical" className="h-8 mx-2" />

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2"
                  >
                    <span className="font-mono">∑</span>
                    <span className="ml-1">LaTeX</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="flex flex-col space-y-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="justify-start"
                      onClick={() => handleInsertLatex('inline')}
                    >
                      Inline Math
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="justify-start"
                      onClick={() => handleInsertLatex('block')}
                    >
                      Block Math
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Separator orientation="vertical" className="h-8 mx-2" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('undo')}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExecCommand('redo')}
                className="h-8 w-8 p-0"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="write" className="m-0">
          <div
            ref={editorRef}
            contentEditable
            className={`w-full h-[600px] p-4 overflow-auto outline-none`}
            style={{ 
              fontFamily: 'Georgia, serif', 
              fontSize: '18px',
              lineHeight: '1.6',
              color: theme.text,
              backgroundColor: theme.background,
              minHeight: isFullscreen ? 'calc(100vh - 120px)' : undefined,
            }}
            onInput={(e) => {
              // Update content
              const html = (e.target as HTMLDivElement).innerHTML;
              onChange(html);
              
              // Clean up editor content to prevent formatting glitches
              setTimeout(cleanupEditorContent, 0);
            }}
            onKeyDown={(e) => {
              // Handle tab key for indentation
              if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
              }
            }}
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className={`p-4 overflow-auto`} style={{
            backgroundColor: theme.background,
            height: isFullscreen ? 'calc(100vh - 120px)' : '600px'
          }}>
            {!value ? (
              <p style={{ color: theme.secondaryText, fontStyle: 'italic' }}>Nothing to preview yet. Start writing in the Edit tab.</p>
            ) : (
              <div 
                ref={previewRef}
                className={`prose ${isDarkMode ? 'prose-invert' : ''} prose-lg max-w-none`}
                style={{ 
                  fontFamily: 'Georgia, serif',
                  fontSize: '18px',
                  lineHeight: '1.8',
                  color: theme.text
                }}
                dangerouslySetInnerHTML={{ __html: renderPreview() }} 
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className={`border-t px-4 py-2 text-xs`} style={{ 
        backgroundColor: isDarkMode ? '#1E1E1E' : '#F5F5F5',
        borderColor: theme.border,
        color: theme.secondaryText
      }}>
        <div className="flex items-center justify-between">
          <span>
            Blog editor with Georgia font (18px) optimized for comfortable reading across all devices
          </span>
          <span>
            {value.length} characters | {isDarkMode ? 'Dark' : 'Light'} mode
          </span>
        </div>
      </div>
    </div>
  );
};

export default WordLikeEditor; 