
import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LaTeXRendererProps {
  latex: string;
  displayMode?: boolean;
  className?: string;
}

const LaTeXRenderer: React.FC<LaTeXRendererProps> = ({ 
  latex, 
  displayMode = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && latex) {
      try {
        // Clean the LaTeX string
        let cleanLatex = latex
          .replace(/\\style{[^}]*}/g, '') // Remove style commands
          .replace(/\\color{[^}]*}/g, '') // Remove color commands
          .trim();

        // Handle special cases
        if (cleanLatex.startsWith('\\[') && cleanLatex.endsWith('\\]')) {
          cleanLatex = cleanLatex.slice(2, -2).trim();
        } else if (cleanLatex.startsWith('$$') && cleanLatex.endsWith('$$')) {
          cleanLatex = cleanLatex.slice(2, -2).trim();
        } else if (cleanLatex.startsWith('\\(') && cleanLatex.endsWith('\\)')) {
          cleanLatex = cleanLatex.slice(2, -2).trim();
        } else if (cleanLatex.startsWith('$') && cleanLatex.endsWith('$')) {
          cleanLatex = cleanLatex.slice(1, -1).trim();
        }

        katex.render(cleanLatex, containerRef.current, {
          displayMode,
          throwOnError: false,
          trust: true,
          strict: false,
          output: 'html',
          macros: {
            '\\RR': '\\mathbb{R}',
            '\\NN': '\\mathbb{N}',
            '\\ZZ': '\\mathbb{Z}',
            '\\CC': '\\mathbb{C}',
            '\\QQ': '\\mathbb{Q}',
            '\\vec': '\\boldsymbol',
            '\\mat': '\\boldsymbol',
            '\\T': '^\\top'
          },
          minRuleThickness: 0.05,
          maxSize: Infinity,
          maxExpand: 1000,
          fleqn: false,
          leqno: false,
          errorColor: '#cc0000'
        });
      } catch (error) {
        console.error('LaTeX rendering error:', error);
        if (containerRef.current) {
          containerRef.current.textContent = `Error rendering LaTeX: ${latex}`;
          containerRef.current.className = 'latex-error';
        }
      }
    }
  }, [latex, displayMode]);

  return (
    <div 
      ref={containerRef} 
      className={`latex-renderer ${displayMode ? 'block my-4' : 'inline-block'} ${className}`}
    />
  );
};

// LaTeX Initializer component that processes all LaTeX blocks in the document
const LaTeXInitializer: React.FC = () => {
  useEffect(() => {
    const processLaTeXContent = () => {
      // Process display mode LaTeX: \[ ... \] and $$ ... $$
      const displayModeRegex = /\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g;
      document.querySelectorAll('*:not(.katex):not(script):not(style)').forEach((element) => {
        if (element instanceof HTMLElement && 
            (element.innerHTML.includes('\\[') || 
             element.innerHTML.includes('\\]') || 
             element.innerHTML.includes('$$'))) {
          element.innerHTML = element.innerHTML.replace(displayModeRegex, (match, latex) => {
            try {
              return katex.renderToString(latex.trim(), { 
                displayMode: true, 
                throwOnError: false,
                trust: true,
                strict: false,
                output: 'html',
                macros: {
                  '\\RR': '\\mathbb{R}',
                  '\\NN': '\\mathbb{N}',
                  '\\ZZ': '\\mathbb{Z}',
                  '\\CC': '\\mathbb{C}',
                  '\\QQ': '\\mathbb{Q}',
                  '\\vec': '\\boldsymbol',
                  '\\mat': '\\boldsymbol',
                  '\\T': '^\\top'
                },
                minRuleThickness: 0.05,
                maxSize: Infinity,
                maxExpand: 1000,
                fleqn: false,
                leqno: false,
                errorColor: '#cc0000'
              });
            } catch (error) {
              console.error('LaTeX rendering error:', error);
              return `<span class="latex-error">${latex}</span>`;
            }
          });
        }
      });

      // Process inline mode LaTeX: \( ... \) and $ ... $
      const inlineModeRegex = /\\\(([\s\S]*?)\\\)|\$([^\$\n]+?)\$/g;
      document.querySelectorAll('*:not(.katex):not(script):not(style)').forEach((element) => {
        if (element instanceof HTMLElement && 
            (element.innerHTML.includes('\\(') || 
             element.innerHTML.includes('\\)') || 
             element.innerHTML.includes('$'))) {
          element.innerHTML = element.innerHTML.replace(inlineModeRegex, (match, latex) => {
            // Skip if it looks like currency
            if (/^\s*\d+(\.\d+)?\s*$/.test(latex)) {
              return match;
            }
            try {
              return katex.renderToString(latex.trim(), { 
                displayMode: false, 
                throwOnError: false,
                trust: true,
                strict: false,
                output: 'html',
                macros: {
                  '\\RR': '\\mathbb{R}',
                  '\\NN': '\\mathbb{N}',
                  '\\ZZ': '\\mathbb{Z}',
                  '\\CC': '\\mathbb{C}',
                  '\\QQ': '\\mathbb{Q}',
                  '\\vec': '\\boldsymbol',
                  '\\mat': '\\boldsymbol',
                  '\\T': '^\\top'
                },
                minRuleThickness: 0.05,
                maxSize: Infinity,
                maxExpand: 1000,
                fleqn: false,
                leqno: false,
                errorColor: '#cc0000'
              });
            } catch (error) {
              console.error('LaTeX rendering error:', error);
              return `<span class="latex-error">${latex}</span>`;
            }
          });
        }
      });
    };

    // Process LaTeX content after a short delay to ensure content is loaded
    const timeoutId = setTimeout(processLaTeXContent, 100);

    // Set up a MutationObserver to handle dynamic content changes
    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const target = mutation.target;
          if (target instanceof HTMLElement) {
            const isEditable = target.isContentEditable || 
                             target instanceof HTMLTextAreaElement || 
                             target instanceof HTMLInputElement;
            if (!isEditable && !target.closest('.katex')) {
              shouldProcess = true;
            }
          }
        }
      });
      
      if (shouldProcess) {
        processLaTeXContent();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  return null;
};

export { LaTeXRenderer, LaTeXInitializer };
export default LaTeXRenderer;
