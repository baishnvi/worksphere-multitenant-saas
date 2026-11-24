import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import createApp from './app';
import { config } from './config';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.io for Real-time Task updates (Assessment 07)
export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Join tenant organization room
  socket.on('join_org', (orgId: string) => {
    socket.join(`org:${orgId}`);
  });

  // Join project room
  socket.on('join_project', (projectId: string) => {
    socket.join(`project:${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const PORT = config.port;

server.listen(PORT, () => {
  console.log(`[WorkSphere Core API] Server running on port ${PORT} in ${config.env} mode`);
  console.log(`[WorkSphere Core API] Health check at http://localhost:${PORT}/health`);
});
