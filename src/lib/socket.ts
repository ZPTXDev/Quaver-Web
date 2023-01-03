import { env } from '$env/dynamic/public';
import { io } from 'socket.io-client';

export const socket = io(env.PUBLIC_WEBSOCKET_HOST);
