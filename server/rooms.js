export function createRoomStore() {
  const rooms = new Map();

  function getOrCreate(roomId) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        code: "// Start coding together!\n",
        language: "javascript",
        messages: [],
        users: new Map(),
      });
    }
    return rooms.get(roomId);
  }

  return {
    join(roomId, socketId, name, color) {
      const room = getOrCreate(roomId);
      room.users.set(socketId, { id: socketId, name, color });
      return room;
    },
    leave(roomId, socketId) {
      const room = rooms.get(roomId);
      if (!room) return;
      room.users.delete(socketId);
      if (room.users.size === 0) rooms.delete(roomId);
    },
    setCode(roomId, code) {
      const room = rooms.get(roomId);
      if (room) room.code = code;
    },
    setLanguage(roomId, language) {
      const room = rooms.get(roomId);
      if (room) room.language = language;
    },
    addMessage(roomId, message) {
      const room = rooms.get(roomId);
      if (!room) return;
      room.messages.push(message);
      if (room.messages.length > 100) room.messages.shift();
    },
    getUsers(roomId) {
      const room = rooms.get(roomId);
      return room ? Array.from(room.users.values()) : [];
    },
  };
}