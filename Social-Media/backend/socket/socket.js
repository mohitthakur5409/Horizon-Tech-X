// socket.js
// Socket.IO setup for real-time communication

const { Server } = require('socket.io');

function initSocket(server) {
  // Attach Socket.IO to your existing HTTP server
  const io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins (adjust for production)
      methods: ['GET', 'POST']
    }
  });

  // Handle client connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Example: join a room for a specific user
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    });

    // Example: broadcast new story
    socket.on('newStory', (storyData) => {
      // Emit to all connected clients
      io.emit('storyCreated', storyData);
    });

    // Example: broadcast reaction
    socket.on('reaction', (reactionData) => {
      io.emit('storyReaction', reactionData);
    });

    // Example: broadcast story view
    socket.on('viewStory', (viewData) => {
      io.emit('storyViewed', viewData);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}

module.exports = initSocket;