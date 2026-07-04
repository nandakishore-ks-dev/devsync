import { useState } from "react";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function JoinRoom({ onJoin }: { onJoin: (roomId: string, name: string) => void }) {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onJoin(roomId.trim().toUpperCase() || generateRoomId(), name.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base text-white">
      <form onSubmit={handleJoin} className="bg-panel p-8 rounded-xl w-full max-w-sm space-y-4 shadow-xl border border-white/10">
        <h1 className="text-2xl font-bold text-center">⚡ DevSync</h1>
        <p className="text-sm text-white/60 text-center">Real-time collaborative code editor</p>
        <input
          className="w-full px-4 py-2 rounded-lg bg-base border border-white/10 outline-none focus:border-indigo-500"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full px-4 py-2 rounded-lg bg-base border border-white/10 outline-none focus:border-indigo-500"
          placeholder="Room code (leave blank to create new)"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 transition font-semibold">
          {roomId ? "Join Room" : "Create Room"}
        </button>
      </form>
    </div>
  );
}