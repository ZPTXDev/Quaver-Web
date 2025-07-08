import { env } from '$env/dynamic/public';
import { io } from 'socket.io-client';

const url = new URL(env.PUBLIC_WEBSOCKET_HOST);
export const state = $state({
	manualLoading: false,
	socket: url.pathname === '/' ? io(url.origin) : io(url.origin, { path: `${url.pathname}/socket.io` }),
});
