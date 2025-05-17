import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatInput } from "../ChatInput";
import { PromptType } from "../../../hooks/useSocket";

describe("ChatInput", () => {
  it("calls onSendMessage with the message and prompt type", () => {
    const onSend = vi.fn();
    render(<ChatInput onSendMessage={onSend} isDisabled={false} />);

    const input = screen.getByPlaceholderText(
      "Type your message here..."
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "hello" } });
    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(onSend).toHaveBeenCalledWith("hello", PromptType.DEFAULT);
    expect(input.value).toBe("");
  });

  it("disables send button when disabled", () => {
    const onSend = vi.fn();
    render(<ChatInput onSendMessage={onSend} isDisabled={true} />);
    const button = screen.getByRole("button", { name: /send/i });
    expect(button).toBeDisabled();
  });
});
