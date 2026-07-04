import { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { socket } from "../socket";
import { User, ChatMessage } from "../types";
import ParticipantsList from "./ParticipantsList";
import ChatPanel from "./ChatPanel";
import LanguageSelector from "./LanguageSelector";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function EditorRoom({ roomId, name, onLeave }: { roomId: string; name: string; onLeave: () => void }) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tab, setTab] = useState<"chat" | "people">("people");
  const [output, setOutput] = useState<string>("");
  const [running, setRunning] = useState(false);

  const editorRef = useRef<any>(null);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    socket.connect();
    socket.emit("join-room", { roomId, name });

    socket.on("room-state", (state) => {
      setCode(state.code);
      setLanguage(state.language);
      setMessages(state.messages);
      setUsers(state.users);
    });

    socket.on("users-update", setUsers);

    socket.on("code-update", (newCode: string) => {
      isRemoteUpdate.current = true;
      setCode(newCode);
    });

    socket.on("language-update", setLanguage);
    socket.on("chat-message", (msg: ChatMessage) => setMessages((prev) => [...prev, msg]));

    return () => {
      socket.off("room-state");
      socket.off("users-update");
      socket.off("code-update");
      socket.off("language-update");
      socket.off("chat-message");
      socket.disconnect();
    };
  }, [roomId, name]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleCodeChange = (value?: string) => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    setCode(value || "");
    socket.emit("code-change", { roomId, code: value || "" });
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    socket.emit("language-change", { roomId, language: lang });
  };

 const runCode = async () => {
  setRunning(true);
  setOutput("Running...");
  try {
    const res = await fetch(`${SERVER_URL}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Execute request failed:", res.status, errBody);
      setOutput(`Server error (${res.status}): ${errBody}`);
      return;
    }

    const data = await res.json();
    console.log("Execute response:", data);

    if (data.error) {
      setOutput(`Error: ${data.error}${data.details ? `\n${data.details}` : ""}`);
      return;
    }

    const stdout = data.run?.stdout || "";
    const stderr = data.run?.stderr || "";
    const combined = (stdout + (stderr ? `\n${stderr}` : "")).trim();

    setOutput(combined || "(program ran with no output)");
  } catch (err: any) {
    console.error("Execute fetch threw:", err);
    setOutput(`Network error: ${err.message}`);
  } finally {
    setRunning(false);
  }
};

  const downloadCode = () => {
    const ext: Record<string, string> = { javascript: "js", python: "py", cpp: "cpp", java: "java" };
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devsync-code.${ext[language] || "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-base text-white">
      <header className="flex items-center justify-between px-4 py-2 bg-panel border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="font-bold">⚡ DevSync</span>
          <span className="text-xs text-white/50">Room: {roomId}</span>
          <button
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            Copy Code
          </button>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector value={language} onChange={handleLanguageChange} />
          <button onClick={runCode} disabled={running} className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-sm font-medium disabled:opacity-50">
            {running ? "Running…" : "▶ Run"}
          </button>
          <button onClick={downloadCode} className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-sm">
            ⬇ Download
          </button>
          <button onClick={onLeave} className="px-3 py-1 rounded bg-red-600/80 hover:bg-red-500 text-sm">
            Leave
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col">
          <Editor
            height="65%"
            language={language}
            theme="vs-dark"
            value={code}
            onMount={handleEditorMount}
            onChange={handleCodeChange}
            options={{ fontSize: 14, minimap: { enabled: false } }}
          />
          <div className="h-[35%] bg-black/60 border-t border-white/10 p-3 overflow-auto font-mono text-sm whitespace-pre-wrap">
            <div className="text-white/40 mb-1">Output:</div>
            {output || "Run your code to see output here."}
          </div>
        </div>

        <aside className="w-72 bg-panel border-l border-white/10 flex flex-col">
          <div className="flex border-b border-white/10">
            <button onClick={() => setTab("people")} className={`flex-1 py-2 text-sm ${tab === "people" ? "bg-white/10" : ""}`}>
              People ({users.length})
            </button>
            <button onClick={() => setTab("chat")} className={`flex-1 py-2 text-sm ${tab === "chat" ? "bg-white/10" : ""}`}>
              Chat
            </button>
          </div>
          {tab === "people" ? (
            <ParticipantsList users={users} />
          ) : (
            <ChatPanel messages={messages} onSend={(text) => socket.emit("chat-message", { roomId, text })} />
          )}
        </aside>
      </div>
    </div>
  );
}