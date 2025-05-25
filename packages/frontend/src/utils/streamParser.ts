import { ParsedChunk, Artifact, ThinkingState } from "../types";

/**
 * Tag handler interface for extensible parsing
 */
interface TagHandler {
  tagName: string;
  parse: (content: string, context: ParserContext) => ParseResult;
}

interface ParseResult {
  displayContent: string;
  specialContent?: any;
  shouldRemoveFromDisplay: boolean;
}

interface ParserContext {
  fullContent: string;
  currentPosition: number;
  isStreaming: boolean;
}

/**
 * Stream parser class for handling LLM output with special tags
 */
export class StreamParser {
  private buffer: string = "";
  private thinkingState: ThinkingState = {
    isActive: false,
    content: "",
  };
  private artifacts: Artifact[] = [];
  private tagHandlers: Map<string, TagHandler> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Register default tag handlers
   */
  private registerDefaultHandlers(): void {
    // Think tag handler
    this.registerTagHandler({
      tagName: "think",
      parse: (content: string, context: ParserContext) => {
        return {
          displayContent: "",
          specialContent: { type: "thinking", content },
          shouldRemoveFromDisplay: true,
        };
      },
    });

    // Code artifact handler (existing functionality)
    this.registerTagHandler({
      tagName: "CODE_ARTIFACT",
      parse: (content: string, context: ParserContext) => {
        try {
          // Extract language and title from attributes if present
          const lines = content.split("\n");
          const firstLine = lines[0] || "";

          // Simple attribute parsing (can be enhanced)
          const languageMatch = firstLine.match(/language="([^"]+)"/);
          const titleMatch = firstLine.match(/title="([^"]+)"/);

          const codeContent = lines.slice(1).join("\n");

          const artifact: Artifact = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            content: codeContent,
            language: languageMatch?.[1] || "text",
            title: titleMatch?.[1] || "Code Artifact",
            timestamp: new Date(),
          };

          return {
            displayContent: "",
            specialContent: { type: "artifact", artifact },
            shouldRemoveFromDisplay: true,
          };
        } catch (error) {
          console.error("Error parsing CODE_ARTIFACT:", error);
          return {
            displayContent: content,
            specialContent: null,
            shouldRemoveFromDisplay: false,
          };
        }
      },
    });
  }

  /**
   * Register a new tag handler
   */
  public registerTagHandler(handler: TagHandler): void {
    this.tagHandlers.set(handler.tagName.toLowerCase(), handler);
  }

  /**
   * Parse a stream chunk and return processed content
   */
  public parseChunk(chunk: string, isComplete: boolean = false): ParsedChunk {
    this.buffer += chunk;

    // Check for tag boundaries in the new content to route appropriately
    const result = this.processBufferWithRouting(isComplete);

    return {
      displayContent: result.displayContent,
      thinkingContent: this.thinkingState.content,
      artifacts: [...this.artifacts],
      isThinkingActive: this.thinkingState.isActive,
      isComplete,
    };
  }

  /**
   * Process the current buffer with intelligent routing for streaming content
   */
  private processBufferWithRouting(isComplete: boolean): {
    displayContent: string;
  } {
    let workingBuffer = this.buffer;
    let displayBuffer = "";

    // Process the buffer character by character to handle streaming properly
    while (workingBuffer.length > 0) {
      const thinkOpenIndex = workingBuffer.indexOf("<think>");
      const thinkCloseIndex = workingBuffer.indexOf("</think>");

      // If we're not currently thinking
      if (!this.thinkingState.isActive) {
        if (thinkOpenIndex === -1) {
          // No think tag found, add all content to display
          displayBuffer += workingBuffer;
          workingBuffer = "";
        } else {
          // Found think tag opening
          // Add content before the tag to display
          displayBuffer += workingBuffer.substring(0, thinkOpenIndex);

          // Check if we have a complete think tag
          if (thinkCloseIndex !== -1 && thinkCloseIndex > thinkOpenIndex) {
            // Complete think tag found
            const thinkingContent = workingBuffer.substring(
              thinkOpenIndex + 7,
              thinkCloseIndex
            );
            this.thinkingState.content = thinkingContent;
            this.thinkingState.isActive = false; // Complete, so not active

            // Continue with content after the think tag
            workingBuffer = workingBuffer.substring(thinkCloseIndex + 8);
          } else {
            // Incomplete think tag - start thinking mode
            this.thinkingState.isActive = true;
            this.thinkingState.startTime = new Date();
            this.thinkingState.content = workingBuffer.substring(
              thinkOpenIndex + 7
            );
            workingBuffer = "";
          }
        }
      } else {
        // We're currently in thinking mode
        if (thinkCloseIndex === -1) {
          // No closing tag yet, add all content to thinking
          this.thinkingState.content = workingBuffer;
          workingBuffer = "";
        } else {
          // Found closing tag
          this.thinkingState.content = workingBuffer.substring(
            0,
            thinkCloseIndex
          );
          this.thinkingState.isActive = false;

          // Continue with content after the think tag
          workingBuffer = workingBuffer.substring(thinkCloseIndex + 8);
        }
      }
    }

    // Update the buffer with the display content
    this.buffer = displayBuffer;

    // Now process the remaining buffer for other tags (artifacts, etc.)
    return this.processBuffer(isComplete);
  }

  /**
   * Process the current buffer and extract special content
   */
  private processBuffer(isComplete: boolean): { displayContent: string } {
    let processedContent = this.buffer;
    let hasChanges = true;

    // Keep processing until no more tags are found
    while (hasChanges) {
      hasChanges = false;

      for (const [tagName, handler] of this.tagHandlers) {
        // Skip think tags as they're handled in processBufferWithRouting
        if (tagName === "think") continue;

        const result = this.extractTag(
          processedContent,
          tagName,
          handler,
          isComplete
        );
        if (result.found) {
          processedContent = result.remainingContent;
          hasChanges = true;

          // Handle special content based on type
          if (result.specialContent) {
            this.handleSpecialContent(result.specialContent);
          }
        }
      }
    }

    return { displayContent: processedContent };
  }

  /**
   * Extract and process a specific tag from content
   */
  private extractTag(
    content: string,
    tagName: string,
    handler: TagHandler,
    isComplete: boolean
  ): {
    found: boolean;
    remainingContent: string;
    specialContent?: any;
  } {
    const openTag = `<${tagName}>`;
    const closeTag = `</${tagName}>`;

    const openIndex = content.indexOf(openTag);
    if (openIndex === -1) {
      return { found: false, remainingContent: content };
    }

    const closeIndex = content.indexOf(closeTag, openIndex);

    // If we haven't found the closing tag and streaming isn't complete, wait
    if (closeIndex === -1 && !isComplete) {
      // Check if we're in the middle of a thinking tag
      if (tagName === "think") {
        const thinkingContent = content.substring(openIndex + openTag.length);
        this.thinkingState = {
          isActive: true,
          content: thinkingContent,
          startTime: this.thinkingState.startTime || new Date(),
        };
      }
      return { found: false, remainingContent: content };
    }

    // If we found a complete tag or streaming is complete
    if (closeIndex !== -1) {
      const tagContent = content.substring(
        openIndex + openTag.length,
        closeIndex
      );
      const beforeTag = content.substring(0, openIndex);
      const afterTag = content.substring(closeIndex + closeTag.length);

      const context: ParserContext = {
        fullContent: content,
        currentPosition: openIndex,
        isStreaming: !isComplete,
      };

      const parseResult = handler.parse(tagContent, context);

      // Handle thinking tag completion
      if (tagName === "think") {
        this.thinkingState = {
          isActive: false,
          content: tagContent,
        };
      }

      return {
        found: true,
        remainingContent:
          beforeTag +
          (parseResult.shouldRemoveFromDisplay
            ? ""
            : parseResult.displayContent) +
          afterTag,
        specialContent: parseResult.specialContent,
      };
    }

    return { found: false, remainingContent: content };
  }

  /**
   * Handle special content extracted from tags
   */
  private handleSpecialContent(specialContent: any): void {
    if (specialContent.type === "artifact") {
      this.artifacts.push(specialContent.artifact);
    }
    // Add more special content handlers as needed
  }

  /**
   * Reset the parser state
   */
  public reset(): void {
    this.buffer = "";
    this.thinkingState = {
      isActive: false,
      content: "",
    };
    this.artifacts = [];
  }

  /**
   * Get current thinking state
   */
  public getThinkingState(): ThinkingState {
    return { ...this.thinkingState };
  }

  /**
   * Get current artifacts
   */
  public getArtifacts(): Artifact[] {
    return [...this.artifacts];
  }

  /**
   * Get processed content without special tags
   */
  public getDisplayContent(): string {
    return this.processBuffer(true).displayContent;
  }
}
