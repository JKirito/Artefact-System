# LLM Output Parser System

This directory contains the stream parser system for handling LLM output with special tags like `<think>` and `<CODE_ARTIFACT>`.

## Overview

The parser system intercepts streaming LLM output and intelligently routes content to appropriate UI components, ensuring that raw tags are never displayed to users.

## Key Features

- **Real-time Tag Detection**: Detects and processes tags as they stream in
- **Thinking Mode**: Special handling for `<think>` tags with dedicated UI
- **Artifact Extraction**: Processes `<CODE_ARTIFACT>` tags for code display
- **Extensible**: Easy to add new tag handlers
- **Stream-Safe**: Handles tags split across multiple chunks

## Components

### StreamParser (`streamParser.ts`)

The core parser class that processes streaming content:

```typescript
import { StreamParser } from "./streamParser";

const parser = new StreamParser();
const result = parser.parseChunk(chunk, isComplete);

// Result contains:
// - displayContent: Clean content for main message
// - thinkingContent: Content from <think> tags
// - isThinkingActive: Whether AI is currently thinking
// - artifacts: Extracted code artifacts
```

### ThinkingIndicator (`../components/chat/ThinkingIndicator.tsx`)

UI component that shows when the AI is thinking:

```typescript
<ThinkingIndicator
  isActive={isThinking}
  thinkingContent={thinkingContent}
  showContent={true}
/>
```

## How It Works

### 1. Stream Processing

When LLM output streams in, each chunk is processed through the parser:

```
Input: "Hello! <think>I need to consider...</think>Here's my answer."

Processing:
- "Hello! " → Display content
- "<think>" → Start thinking mode
- "I need to consider..." → Thinking content
- "</think>" → End thinking mode
- "Here's my answer." → Display content

Output:
- Display: "Hello! Here's my answer."
- Thinking: "I need to consider..."
```

### 2. Tag Routing

Different tags are routed to different handlers:

- `<think>` → Thinking UI component
- `<CODE_ARTIFACT>` → Artifact system
- Regular content → Main message display

### 3. State Management

The parser maintains state for:

- Current thinking status
- Accumulated thinking content
- Extracted artifacts
- Display buffer

## Usage in Components

### ChatContainer Integration

```typescript
// In ChatContainer.tsx
{
  isThinking && (
    <ThinkingIndicator
      isActive={isThinking}
      thinkingContent={currentThinkingContent}
      showContent={true}
    />
  );
}

{
  currentResponse && (
    <div className="message-content">
      <MarkdownRenderer content={currentResponse} />
    </div>
  );
}
```

### Message History

Completed messages store parsed content:

```typescript
// In Message.tsx
{
  message.parsedContent?.thinkingContent && (
    <ThinkingIndicator
      isActive={false}
      thinkingContent={message.parsedContent.thinkingContent}
      showContent={true}
    />
  );
}
```

## Supported Tags

### `<think>` Tags

Used for AI reasoning that should be shown in a special thinking UI:

```
<think>
Let me analyze this step by step:
1. First, I need to understand...
2. Then, I should consider...
</think>
```

### `<CODE_ARTIFACT>` Tags

Used for code that should be extracted to the artifact system:

```
<CODE_ARTIFACT language="typescript" title="Component">
import React from 'react';
const MyComponent = () => <div>Hello</div>;
</CODE_ARTIFACT>
```

## Adding New Tag Handlers

To add support for new tags:

```typescript
parser.registerTagHandler({
  tagName: "custom",
  parse: (content: string, context: ParserContext) => {
    return {
      displayContent: "", // What to show in main message
      specialContent: { type: "custom", data: content },
      shouldRemoveFromDisplay: true, // Remove from main display
    };
  },
});
```

## Examples

See `streamParser.example.ts` for detailed examples of how the parser handles various scenarios:

- Simple thinking followed by response
- Tags split across multiple chunks
- Multiple thinking sections
- Mixed content with artifacts

## Benefits

1. **Clean UI**: Users never see raw tags or malformed content
2. **Rich Interaction**: Special content gets appropriate UI treatment
3. **Real-time Feedback**: Thinking indicators show AI reasoning process
4. **Extensible**: Easy to add new content types
5. **Robust**: Handles edge cases like split tags gracefully

## Testing

Run the examples to see the parser in action:

```typescript
import { runAllExamples } from "./streamParser.example";
runAllExamples();
```

This will demonstrate how different streaming scenarios are handled and what output is produced for each case.
