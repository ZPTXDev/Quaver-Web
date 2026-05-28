import { env } from '$env/dynamic/public';
import { io } from 'socket.io-client';

const url = new URL(env.PUBLIC_WEBSOCKET_HOST);
export const state = $state({
	manualLoading: false,
	socket: url.pathname === '/' 
		? io(url.origin, {
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: Infinity,
		}) 
		: io(url.origin, { 
			path: `${url.pathname}/socket.io`,
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			reconnectionAttempts: Infinity,
		}),
	connected: false,
});
