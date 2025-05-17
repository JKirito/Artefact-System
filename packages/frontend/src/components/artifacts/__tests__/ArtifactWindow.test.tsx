import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArtifactWindow } from "../ArtifactWindow";

describe("ArtifactWindow", () => {
  const artifact = {
    id: "1",
    content: 'console.log("hi")',
    language: "javascript",
    title: "Test",
  };

  it("renders nothing when closed", () => {
    const { container } = render(
      <ArtifactWindow isOpen={false} onClose={() => {}} artifact={artifact} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("displays artifact content when open", () => {
    render(
      <ArtifactWindow isOpen={true} onClose={() => {}} artifact={artifact} />
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copy code/i })
    ).toBeInTheDocument();
  });

  it("shows placeholder when open with no artifact", () => {
    render(<ArtifactWindow isOpen={true} onClose={() => {}} artifact={null} />);
    expect(
      screen.getByText(/No code artifacts available yet/i)
    ).toBeInTheDocument();
  });
});
