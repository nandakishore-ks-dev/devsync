import { User } from "../types";

export default function ParticipantsList({ users }: { users: User[] }) {
  return (
    <div className="flex-1 overflow-auto p-3 space-y-2">
      {users.map((u) => (
        <div key={u.id} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: u.color }} />
          {u.name}
        </div>
      ))}
      {users.length === 0 && <p className="text-white/40 text-sm">No one here yet.</p>}
    </div>
  );
}