import { StreamParser } from "./streamParser";

/**
 * Example usage of the StreamParser to demonstrate how it handles
 * <think> tags and prevents raw tokens from being displayed
 */

// Example 1: Simple thinking followed by response
export function exampleSimpleThinking() {
  const parser = new StreamParser();

  console.log("=== Example 1: Simple Thinking ===");

  // Simulate streaming chunks
  const chunks = [
    "Hello! ",
    "<think>",
    "I need to think about this question carefully. ",
    "The user is asking about...",
    "</think>",
    "Based on my analysis, I can tell you that...",
  ];

  chunks.forEach((chunk, index) => {
    const result = parser.parseChunk(chunk, index === chunks.length - 1);
    console.log(`Chunk ${index + 1}: "${chunk}"`);
    console.log(`  Display: "${result.displayContent}"`);
    console.log(
      `  Thinking: ${result.isThinkingActive ? "ACTIVE" : "INACTIVE"}`
    );
    console.log(`  Thinking Content: "${result.thinkingContent}"`);
    console.log("---");
  });

  parser.reset();
}

// Example 2: Thinking tag split across chunks
export function exampleSplitThinking() {
  const parser = new StreamParser();

  console.log("=== Example 2: Split Thinking Tag ===");

  // Simulate streaming chunks where tags are split
  const chunks = [
    "Let me help you with that. ",
    "<thi",
    "nk>",
    "This is a complex question that requires ",
    "careful consideration of multiple factors.",
    "</think>",
    "Here is my response...",
  ];

  chunks.forEach((chunk, index) => {
    const result = parser.parseChunk(chunk, index === chunks.length - 1);
    console.log(`Chunk ${index + 1}: "${chunk}"`);
    console.log(`  Display: "${result.displayContent}"`);
    console.log(
      `  Thinking: ${result.isThinkingActive ? "ACTIVE" : "INACTIVE"}`
    );
    console.log(`  Thinking Content: "${result.thinkingContent}"`);
    console.log("---");
  });

  parser.reset();
}

// Example 3: Multiple thinking sections
export function exampleMultipleThinking() {
  const parser = new StreamParser();

  console.log("=== Example 3: Multiple Thinking Sections ===");

  const chunks = [
    "First, let me consider this. ",
    "<think>Initial thoughts about the problem...</think>",
    "Now, let me think more deeply. ",
    "<think>Deeper analysis of the implications...</think>",
    "Finally, here is my conclusion.",
  ];

  chunks.forEach((chunk, index) => {
    const result = parser.parseChunk(chunk, index === chunks.length - 1);
    console.log(`Chunk ${index + 1}: "${chunk}"`);
    console.log(`  Display: "${result.displayContent}"`);
    console.log(
      `  Thinking: ${result.isThinkingActive ? "ACTIVE" : "INACTIVE"}`
    );
    console.log(`  Thinking Content: "${result.thinkingContent}"`);
    console.log("---");
  });

  parser.reset();
}

// Example 4: Mixed content with artifacts
export function exampleMixedContent() {
  const parser = new StreamParser();

  console.log("=== Example 4: Mixed Content with Artifacts ===");

  const chunks = [
    "I'll create a solution for you. ",
    "<think>I need to write a React component that handles user input...</think>",
    "Here's the code:\n\n",
    '<CODE_ARTIFACT language="typescript" title="UserInput Component">',
    'import React from "react";\n\nconst UserInput = () => {\n  return <input />;\n};',
    "</CODE_ARTIFACT>",
    "\n\nThis component provides basic input functionality.",
  ];

  chunks.forEach((chunk, index) => {
    const result = parser.parseChunk(chunk, index === chunks.length - 1);
    console.log(`Chunk ${index + 1}: "${chunk}"`);
    console.log(`  Display: "${result.displayContent}"`);
    console.log(
      `  Thinking: ${result.isThinkingActive ? "ACTIVE" : "INACTIVE"}`
    );
    console.log(`  Thinking Content: "${result.thinkingContent}"`);
    console.log(`  Artifacts: ${result.artifacts.length}`);
    if (result.artifacts.length > 0) {
      console.log(
        `    Latest: ${result.artifacts[result.artifacts.length - 1].title}`
      );
    }
    console.log("---");
  });

  parser.reset();
}

// Run all examples
export function runAllExamples() {
  exampleSimpleThinking();
  exampleSplitThinking();
  exampleMultipleThinking();
  exampleMixedContent();
}

// Uncomment to run examples in development
// runAllExamples();
