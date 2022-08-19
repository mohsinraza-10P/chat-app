const users = [];

const addUser = ({ id, username, room }) => {
  // Validate if fields are not undefined
  if (isEmpty(username) || isEmpty(room)) {
    return {
      error: "Username and room are required.",
    };
  }

  username = username.trim();
  room = room.trim();

  // Validate existing user
  const existingUser = users.find((u) => {
    return (
      u.room.toLowerCase() === room.toLowerCase() &&
      u.username.toLowerCase() === username.toLowerCase()
    );
  });
  if (existingUser) {
    return {
      error: "This user is already in this room.",
    };
  }

  // Store user
  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = (id) => {
  const index = users.findIndex((u) => u.id === id);
  if (index < 0) {
    return;
  }

  const deleteUsers = users.splice(index, 1);
  return deleteUsers[0];
};

const getUser = (id) => {
  return users.find((u) => u.id === id);
};

const getUsersInRoom = (room) => {
  if (isEmpty(room)) {
    return [];
  }
  room = room.trim().toLowerCase();
  return users.filter((u) => u.room.toLowerCase() === room);
};

const isEmpty = (value) => {
  return (
    // null or undefined
    value == null ||
    // has length and it's zero
    (value.hasOwnProperty("length") && value.length === 0) ||
    // is an Object and has no keys
    (value.constructor === Object && Object.keys(value).length === 0)
  );
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
