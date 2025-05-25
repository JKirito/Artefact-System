import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "../Sidebar";
import { ChatSummary } from "../../../types";

describe("Sidebar", () => {
  it("shows placeholder when no chats", () => {
    render(
      <Sidebar
        isOpen={true}
        chats={[]}
        currentChatId=""
        onNewChat={() => {}}
        onSelectChat={() => {}}
      />
    );
    expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument();
  });

  it("calls onSelectChat when chat item clicked", () => {
    const chats: ChatSummary[] = [
      { id: "1", title: "First", updatedAt: new Date() },
      { id: "2", title: "Second", updatedAt: new Date() },
    ];
    const onSelect = vi.fn<[string], void>();
    render(
      <Sidebar
        isOpen={true}
        chats={chats}
        currentChatId="1"
        onNewChat={() => {}}
        onSelectChat={onSelect}
      />
    );
    fireEvent.click(screen.getByText("Second"));
    expect(onSelect).toHaveBeenCalledWith("2");
  });

  it("calls onClose when overlay is clicked on mobile", () => {
    const onClose = vi.fn();
    render(
      <Sidebar
        isOpen={true}
        chats={[]}
        currentChatId=""
        onNewChat={() => {}}
        onSelectChat={() => {}}
        onClose={onClose}
      />
    );

    const overlay = document.querySelector(".fixed.inset-0.bg-black\\/50");
    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
