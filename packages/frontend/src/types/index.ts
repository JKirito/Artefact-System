// Message type definition
export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

// Artifact type definition
export interface Artifact {
  id: string;
  content: string;
  language?: string;
  title?: string;
  timestamp: Date;
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
