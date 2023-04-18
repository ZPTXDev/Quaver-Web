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
	'This website has gone through about 3 redesigns.'
]);
export const featureMap = readable({
	stay: {
		id: 'stay',
		name: '24/7 Mode'
	},
	autolyrics: {
		id: 'autoLyrics',
		name: 'Auto Lyrics'
	},
	smartqueue: {
		id: 'smartQueue',
		name: 'Smart Queue'
	}
} as Record<string, Record<string, string>>);
