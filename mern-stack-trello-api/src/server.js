import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "*/config/cors";
import { connectDB } from "*/config/mongodb";
import { env } from "*/config/environtment";
import { apiV1 } from "*/routes/v1";

//socket
import socketIo from "socket.io";
import http from "http";
import inviteUserToBoardSocket from "*/sockets/notifications/inviteUserToBoardSocket";

connectDB()
  .then(() => console.log("Connected successfully to database server!"))
  .then(() => bootServer())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

const bootServer = () => {
  const app = express();

  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  app.use(cookieParser());

  app.use(cors(corsOptions));

  // Enable req.body data
  app.use(express.json());

  // Use APIs v1
  app.use("/v1", apiV1);

  // For real-time
  const server = http.createServer(app);
  const io = socketIo(server, { cors: corsOptions });
  io.on("connection", (socket) => {
    console.log("New socket client connected with id: ", socket.id);
    // // Lắng nghe sự kiện có tên là "c_user_invited_to_board" từ phía client emit lên
    // socket.on('c_user_invited_to_board', (invitation) => {
    //   console.log(invitation)
    //   // Emit ngược lại một sự kiện có tên là "s_user_invited_to_board" về cho client khác (ngoại trừ chính thằng user gửi lên)
    //   socket.broadcast.emit('s_user_invited_to_board', invitation)
    // })
    inviteUserToBoardSocket(socket);
    // ... others realtime tasks

    socket.on("disconnect", () => console.log("Client disconnected"));
  });

  // Support heroku deploy
  // app.listen(process.env.PORT || env.APP_PORT, () => {
  server.listen(process.env.PORT || env.APP_PORT, () => {
    console.log(
      `Hello Bao how to , I'm running at port: ${
        process.env.PORT || env.APP_PORT
      }/`
    );
  });
};
