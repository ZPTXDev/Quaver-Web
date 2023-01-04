import { env } from '$env/dynamic/public';
import { io } from 'socket.io-client';
import { readable } from 'svelte/store';

export const socket = readable(io(env.PUBLIC_WEBSOCKET_HOST));
