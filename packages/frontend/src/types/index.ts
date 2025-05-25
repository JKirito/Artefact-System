// Message type definition
export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  // New fields for parsed content
  parsedContent?: ParsedContent;
  isThinking?: boolean;
}

// Artifact type definition
export interface Artifact {
  id: string;
  content: string;
  language?: string;
  title?: string;
  timestamp: Date;
}

// New types for the parser system
export interface ParsedContent {
  displayContent: string;
  thinkingContent?: string;
  artifacts: Artifact[];
  hasActiveThinking: boolean;
}

export interface ThinkingState {
  isActive: boolean;
  content: string;
  startTime?: Date;
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
}

export interface ParsedChunk {
  displayContent: string;
  thinkingContent?: string;
  artifacts: Artifact[];
  isThinkingActive: boolean;
  isComplete: boolean;
}

// Chat session types
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSummary {
  id: string;
  title: string;
  lastMessage?: string;
  updatedAt: Date;
}

// Code component props for markdown rendering
export interface CodeComponentProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}
