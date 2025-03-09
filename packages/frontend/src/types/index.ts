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

// Code component props for markdown rendering
export type CodeComponentProps = {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
};
