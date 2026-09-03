import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { save } from "../lib/storage";
import type { Message } from "../types";
import ChatPane from "./ChatPane";

function seedMessages(messages: Message[]) {
  save({ threads: [], messages, presets: [] });
}

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
});

describe("ChatPane message rendering", () => {
  test("renders a user message as a plain-text bubble, without parsing markdown", () => {
    seedMessages([
      {
        id: "1",
        threadId: "t1",
        role: "user",
        content: "**bold** text",
        createdAt: Date.now(),
      },
    ]);
    render(<ChatPane threadId="t1" presetTrigger={0} />);

    const bubble = screen.getByText("**bold** text");
    expect(bubble).toHaveClass("chat-bubble-user");
  });

  test("renders an assistant message with markdown formatting and no role label", () => {
    seedMessages([
      {
        id: "2",
        threadId: "t1",
        role: "assistant",
        content: "**bold** text",
        createdAt: Date.now(),
      },
    ]);
    render(<ChatPane threadId="t1" presetTrigger={0} />);

    expect(screen.queryByText(/assistant:/i)).not.toBeInTheDocument();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
  });

  test("copy action on an assistant message copies the raw markdown content", async () => {
    // userEvent.setup() installs its own clipboard stub, so mock after it runs.
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    seedMessages([
      {
        id: "3",
        threadId: "t1",
        role: "assistant",
        content: "hello world",
        createdAt: Date.now(),
      },
    ]);
    render(<ChatPane threadId="t1" presetTrigger={0} />);

    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("hello world");
  });
});
