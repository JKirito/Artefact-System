import React, { useState, useEffect } from "react";

interface ThinkingIndicatorProps {
  isActive: boolean;
  thinkingContent?: string;
  showContent?: boolean;
  className?: string;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  isActive,
  thinkingContent = "",
  showContent = false,
  className = "",
}) => {
  const [dots, setDots] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Animate the thinking dots
  useEffect(() => {
    if (!isActive) {
      setDots("");
      return;
    }

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive && !thinkingContent) {
    return null;
  }

  const handleToggleExpand = () => {
    if (thinkingContent) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`thinking-indicator ${className}`}>
      {/* Main thinking indicator */}
      <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg backdrop-blur-sm">
        {/* Animated brain icon */}
        <div className="relative">
          <div
            className={`w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center ${
              isActive ? "animate-pulse" : ""
            }`}
          >
            <svg
              className="w-4 h-4 text-purple-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Thinking waves animation */}
          {isActive && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" />
              <div
                className="absolute inset-0 rounded-full border border-purple-400/20 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              />
            </>
          )}
        </div>

        {/* Thinking text */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-purple-300 font-medium">
              {isActive ? "Thinking" : "Thought process"}
            </span>
            <span className="text-purple-400 font-mono text-sm min-w-[20px]">
              {isActive ? dots : "✓"}
            </span>
          </div>

          {/* Show content preview if available */}
          {thinkingContent && !isActive && (
            <div className="text-xs text-purple-400/70 mt-1">
              {thinkingContent.length > 50
                ? `${thinkingContent.substring(0, 50)}...`
                : thinkingContent}
            </div>
          )}
        </div>

        {/* Expand/collapse button for completed thinking */}
        {thinkingContent && !isActive && showContent && (
          <button
            onClick={handleToggleExpand}
            className="text-purple-400 hover:text-purple-300 transition-colors p-1 rounded"
            aria-label={isExpanded ? "Collapse thinking" : "Expand thinking"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded thinking content */}
      {isExpanded && thinkingContent && (
        <div className="mt-2 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
          <div className="text-sm text-purple-200/80 whitespace-pre-wrap leading-relaxed">
            {thinkingContent}
          </div>
        </div>
      )}

      {/* Active thinking content (streaming) */}
      {isActive && thinkingContent && showContent && (
        <div className="mt-2 p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
          <div className="text-sm text-purple-200/60 whitespace-pre-wrap leading-relaxed">
            {thinkingContent}
            <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
};

// Additional component for inline thinking status
export const InlineThinkingStatus: React.FC<{ isThinking: boolean }> = ({
  isThinking,
}) => {
  if (!isThinking) return null;

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 rounded-full text-xs text-purple-300">
      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
      <span>thinking</span>
    </div>
  );
};
