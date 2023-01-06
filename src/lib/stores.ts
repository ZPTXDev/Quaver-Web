import { env } from '$env/dynamic/public';
import { io } from 'socket.io-client';
import { readable, writable } from 'svelte/store';

export const managerMode = writable(false);
export const manualLoading = writable(false);
export const socket = readable(io(env.PUBLIC_WEBSOCKET_HOST));
