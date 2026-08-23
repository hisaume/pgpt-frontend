/*
    messages display, composer, send
*/

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { load, save } from "../lib/storage";
import type { Message } from "../types";
import ReactMarkdown from "react-markdown";

/*
  Expected response shape:
  data = {
    assistant: {
      role: "assistant",
      content: "Hello"
    }
  }
*/
interface BackendResponse {
  assistant: {
    role: string;
    content: string;
  };
}

export default function ChatPane({
  threadId,
  presetAppend,
  presetTrigger,
  onFocus,
}: {
  threadId: string;
  presetAppend?: string;
  presetTrigger: number; // Trigger for the preset use
  onFocus?: () => void;
}) {
  const [store, setStore] = useState(load());
  const [inputs, setInputs] = useState<Record<string, string>>({}); // 1 user input per threadId
  const messageContainerRef = useRef<HTMLDivElement>(null); // Ref for the message display area

  const messages = store.messages.filter((m) => m.threadId === threadId);

  // threadId has changed. Maybe a new thread, or thread switching.
  useEffect(() => {
    setInputs((previousInputs) => {
      if (threadId in previousInputs) {
        return previousInputs; // Save the existing input if threadId already exists.
      }
      return { ...previousInputs, [threadId]: "" }; // Create an empty input for the threadId.
    });
  }, [threadId]);

  const appendPreset = useEffectEvent(() => {
    if (!presetAppend) return;
    setInputs((prev) => ({
      ...prev,
      // If user text exists, preserve it then add space before appending.
      [threadId]: `${prev[threadId] || ""}${prev[threadId] ? " " : ""}${presetAppend}`,
    }));
  });

  useEffect(() => {
    appendPreset();
  }, [presetTrigger]);

  useEffect(() => {
    // Scroll to the bottom
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]); // When messages get updated, need to scroll

  function addMessage(role: "user" | "assistant", content: string) {
    const m: Message = {
      id: crypto.randomUUID(),
      threadId,
      role,
      content,
      createdAt: Date.now(),
    };
    setStore((prev) => {
      const next = { ...prev, messages: [...prev.messages, m] };
      save(next);
      return next;
    });
  }

  async function send() {
    const input = inputs[threadId] || "";
    if (!input.trim()) return;

    // Add the user message to the store
    const userMessage: Message = {
      id: crypto.randomUUID(),
      threadId,
      role: "user",
      content: input,
      createdAt: Date.now(),
    };

    let threadMessages: { role: string; content: string }[] = [];

    // Need the user input to go into the stored messages before fetch()
    await new Promise<void>((resolve) => {
      setStore((prev) => {
        const next = { ...prev, messages: [...prev.messages, userMessage] };
        save(next);

        // Prepare the message array in threadMessages for fetch()
        threadMessages = next.messages
          .filter((m) => m.threadId === threadId)
          .map((m) => ({ role: m.role, content: m.content }));

        resolve(); // Ensure this step completes before proceeding
        return next;
      });
    });

    // Clear the input box for this thread
    setInputs((prev) => ({ ...prev, [threadId]: "" }));
    // TODO ?: Consider locking the send button here?

    let data: BackendResponse | null = null;
    try {
      // fetch() from the backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          //"X-Api-Key": import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({ threadId, messages: threadMessages }),
      });

      if (!response.ok) {
        if (response.status === 504) {
          addMessage("assistant", `⚠️ Error: Backend timed out (504).`);
          return; // Exit early if the backend times out
        }
        throw new Error(
          `Backend error: ${response.status} ${response.statusText}`,
        );
      }
      data = await response.json();
      if (!data || !data.assistant) {
        addMessage(
          "assistant",
          "⚠️ Error: Backend response data (or .assistant) is missing.",
        );
        return; // Exit early if the backend response is malformed
      }
      console.log("Backend response data:", data);
    } catch (err) {
      const error = err as Error;
      addMessage(
        "assistant",
        `⚠️ Error: Could not reach backend. ${error.message}`,
      );
      return; // Exit early if the fetch fails
    }

    try {
      // Process the backend response
      const assistantContent = data.assistant?.content;

      if (!assistantContent) {
        console.error("Assistant content is undefined or null.");
        addMessage(
          "assistant",
          `⚠️ Parse Error: Assistant content is undefined or null.`,
        );
      } else {
        addMessage("assistant", assistantContent);
      }
    } catch (err) {
      const error = err as Error;
      addMessage(
        "assistant",
        `⚠️ Error: Failed to process backend response. ${error.message}`,
      );
    }
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
      onFocus={onFocus} // Attach the onFocus handler to the main container
      tabIndex={-1} // Ensure the div can receive focus
    >
      {/* Message Display div */}
      <div
        ref={messageContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          paddingTop: "8px",
          paddingRight: "20px",
          paddingBottom: "8px",
          paddingLeft: "30px",
        }}
        tabIndex={-1}
      >
        {messages.map((m) => (
          <div key={m.id}>
            <strong>{m.role}:</strong>
            <ReactMarkdown>{m.content}</ReactMarkdown>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          borderTop: "1px solid #eee",
          paddingTop: "8px",
          paddingRight: "18px",
          paddingBottom: "8px",
          paddingLeft: "18px",
        }}
      >
        <textarea
          className="chatTextArea"
          value={inputs[threadId] || ""}
          onChange={(e) =>
            setInputs((prev) => ({ ...prev, [threadId]: e.target.value }))
          }
          placeholder="Type a message..."
          style={{ flex: 1, resize: "none", height: "80px" }}
        />
        <button
          className="major-button"
          onClick={send}
          disabled={(inputs[threadId]?.trim().length || 0) === 0}
          style={{
            alignSelf: "flex-start",
            padding: "10px 15px",
            fontSize: "16px",
          }}
        >
          {/*▶*/}
          <svg width="22" height="22" viewBox="0 0 16 13" fill="currentColor">
            <path d="M4 2l10 6-10 6V2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
