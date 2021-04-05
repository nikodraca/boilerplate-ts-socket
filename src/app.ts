require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

import express from 'express';
import SocketIO from 'socket.io';
import cors from 'cors';

import config from './config';
import { RoomEvents, SongEvents } from './events';
import { RoomService, SpotifyService } from './services';
import { SpotifyGateway } from './gateways';
import { RoomController } from './controllers';

export const start = () => {
  const spotifyGateway = new SpotifyGateway();
  const spotifyService = new SpotifyService(spotifyGateway);

  const roomService = new RoomService();
  const roomController = new RoomController(roomService);

  const server = express()
    .use(
      cors({
        allowedHeaders: [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'X-Access-Token',
          'Access-Control-Allow-Origin',
        ],
        origin: 'http://localhost:3001',
      })
    )
    .use(express.json())
    .use('/room', roomController.routes())
    .listen(config.port, () => console.log(`Listening on ${config.port}`));

  const io = new SocketIO.Server(server);

  io.on('connection', (socket) => {
    const roomEvents = new RoomEvents(io, socket);
    roomEvents.init();

    const songEvents = new SongEvents(io, socket, spotifyService);
    songEvents.init();

    socket.on('disconnect', () => {
      console.log('disconnect');
    });
  });

  return server;
};
