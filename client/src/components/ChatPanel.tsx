import { useState } from "react";
import { ChatMessage } from "../types";

export default function ChatPanel({ messages, onSend }: { messages: ChatMessage[]; onSend: (text: string) => void }) {
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-semibold text-indigo-400">{m.sender}: </span>
            <span className="text-white/80">{m.text}</span>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-white/10 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message..."
          className="flex-1 px-2 py-1 rounded bg-base border border-white/10 text-sm outline-none"
        />
        <button onClick={send} className="px-3 py-1 rounded bg-indigo-600 text-sm">Send</button>
      </div>
    </div>
  );
}