import React, { useState, useEffect } from 'react';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import './ArtifactWindow.css';

interface ArtifactWindowProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: {
    id: string;
    content: string;
    language?: string;
    title?: string;
  } | null;
}

export const ArtifactWindow: React.FC<ArtifactWindowProps> = ({ 
  isOpen, 
  onClose, 
  artifact 
}) => {
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAnimationClass('artifact-window-open');
    } else {
      setAnimationClass('artifact-window-close');
    }
  }, [isOpen]);

  // Always render the component when isOpen is true, even if artifact is null
  if (!isOpen) return null;
  
  // If no artifact is available, show a placeholder
  const displayArtifact = artifact || {
    id: 'placeholder',
    content: '```\nNo code artifacts available yet.\n```',
    title: 'No Artifacts',
  };

  return (
    <div className={`artifact-window-overlay ${isOpen ? 'visible' : ''}`}>
      <div className={`artifact-window ${animationClass}`}>
        <div className="artifact-window-header">
          <h2>{displayArtifact.title || 'Code Artifact'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="artifact-window-content">
          <MarkdownRenderer content={displayArtifact.content} />
        </div>
        <div className="artifact-window-footer">
          {displayArtifact.id !== 'placeholder' && (
            <button className="copy-button" onClick={() => {
              navigator.clipboard.writeText(displayArtifact.content);
              // Show a temporary "Copied!" message
              const copyButton = document.querySelector('.copy-button');
              if (copyButton) {
                const originalText = copyButton.textContent;
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                  copyButton.textContent = originalText;
                }, 2000);
              }
            }}>
              Copy Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
