/*
        Preset CRUD
*/

import { useState, useRef } from "react";
import { load, save } from "../lib/storage";
import { useClickOutside } from "../lib/useClickOutside";
import type { Preset } from "../types";

export default function PresetList(
  { onAppend, isMenuOpen }: { onAppend: (text: string) => void, isMenuOpen: boolean }
) {
  const [store, setStore] = useState(load());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setOpenMenuId(null));

  function createPreset() {
    const p: Preset = {
      id: crypto.randomUUID(),
      title,
      text,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = { ...store, presets: [p, ...store.presets] };
    setStore(next);
    save(next);
    setTitle("");
    setText("");
  }

  function updatePreset(id: string, patch: Partial<Preset>) {
    const next = {
      ...store,
      presets: store.presets.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
      ),
    };
    setStore(next);
    save(next);
  }

  function deletePreset(id: string) {
    const next = { ...store, presets: store.presets.filter((p) => p.id !== id) };
    setStore(next);
    save(next);
  }

  return (
    <div>
      <div style={{ textAlign: "center" }}>
        <h4 style={{ color: "#aaaaaaff" }}>Prompt Presets</h4>

        <input
          className="threadInput"
          placeholder="Prompt title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ display: "block", margin: "0 auto", marginBottom: "8px" }}
          tabIndex={isMenuOpen ? 0 : -1}
        />

        <textarea
          className="threadInput"
          placeholder="Prompt you want to save"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ display: "block", margin: "0 auto", marginBottom: "8px", resize: "vertical" }}
          tabIndex={isMenuOpen ? 0 : -1}
        />

        <div style={{ marginTop: "8px" }}>
          <button
            onClick={createPreset}
            className="major-button"
            style={{ display: "block", margin: "2px auto 14px" }}
            tabIndex={isMenuOpen ? 0 : -1}
          >
            Add preset
          </button>
        </div>
      </div>

      <ul>
        {store.presets.map((p) => (
          <li key={p.id} style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative", marginBottom: "8px" }}>
            <input
              className="threadInput"
              defaultValue={p.title}
              onBlur={(e) => updatePreset(p.id, { title: e.target.value })}
              style={{ flex: 1 }}
              tabIndex={isMenuOpen ? 0 : -1}
            />
            <button
              onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                border: "1px solid #ccc",
                background: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                padding: 0,
              }}
              tabIndex={isMenuOpen ? 0 : -1}
            >
              <span style={{ transform: "translateY(-1.6px)" }}>⋮</span>
            </button>
            {openMenuId === p.id && (
              <div
                ref={menuRef}
                style={{
                  position: "absolute",
                  right: "-20px",
                  top: "20px",
                  paddingLeft: "5px",
                  background: "white",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                  minWidth: "20px",
                  maxWidth: "50px"
                }}
              >
                <button
                  onClick={() => {
                    onAppend(p.text);
                    setOpenMenuId(null);
                  }}
                  className="minor-button"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderRadius: 0,
                    borderBottom: "0px solid #eee",
                    paddingTop: "0px",
                    paddingBottom: "4px",
                    marginTop: "0px",
                    marginBottom: "0px"
                  }}
                  tabIndex={isMenuOpen ? 0 : -1}
                >
                  Use
                </button>
                <button
                  onClick={() => {
                    deletePreset(p.id);
                    setOpenMenuId(null);
                  }}
                  className="minor-button"
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderRadius: 0,
                    borderTop: "0px solid #ca8e17",
                    paddingTop: "4px",
                    margin: "0px"
                  }}
                  tabIndex={isMenuOpen ? 0 : -1}
                >
                  Delete
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
