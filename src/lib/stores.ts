import { env } from '$env/dynamic/public';
import { io } from 'socket.io-client';
import { sineIn } from 'svelte/easing';
import { readable, writable } from 'svelte/store';

export const managerMode = writable(false);
export const manualLoading = writable(false);
export const socket = readable(io(env.PUBLIC_WEBSOCKET_HOST));
export const transitionParams = readable({
	x: -320,
	duration: 200,
	easing: sineIn
});

export const loadingHeadline = readable([
	'Loading...',
	'Just a second...',
	'Almost there...',
	'Getting there...',
	'Thinking really hard...',
	'Working on it...'
]);
export const tips = readable([
	'Quaver is open source! You can contribute to the project on GitHub.',
	"Quaver's translations are entirely crowdsourced.",
	'The source code for this website is available on GitHub!',
	'Quaver was created on March 22nd, 2021.',
	'The website has gone through at least 3 redesigns.'
]);
