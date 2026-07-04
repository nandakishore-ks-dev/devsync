import { useState } from "react";
import JoinRoom from "./components/JoinRoom";
import EditorRoom from "./components/EditorRoom";

export default function App() {
  const [session, setSession] = useState<{ roomId: string; name: string } | null>(null);

  if (!session) {
    return <JoinRoom onJoin={(roomId, name) => setSession({ roomId, name })} />;
  }

  return <EditorRoom roomId={session.roomId} name={session.name} onLeave={() => setSession(null)} />;
}