import { sineIn } from 'svelte/easing';

export const transitionParams = {
	x: -320,
	duration: 200,
	easing: sineIn,
};
export const toastOptions = {
	reversed: true,
	intro: { y: 192 },
};
export const loadingHeadline = [
	'Loading...',
	'Just a second...',
	'Almost there...',
	'Getting there...',
	'Thinking really hard...',
	'Working on it...',
];
export const tips = [
	'Quaver is open source! You can contribute to the project on GitHub.',
	"Quaver's translations are entirely crowdsourced.",
	'The source code for this website is available on GitHub!',
	'Quaver started as a hobby project on March 22nd, 2021.',
	'This website is on its 4th redesign!',
];
export const dashboardHeadline = [
	'Welcome back,',
	'Hey there,',
	'Hello again,',
	'Good to see you,',
];
export const nowPlayingHeadline = [
	'Now playing',
	'Listening now',
	'Actively jamming',
	'Currently vibing',
	'Now grooving',
];
export const featureMap = {
	stay: {
		id: 'stay',
		name: 'Stay in voice channel',
	},
	autolyrics: {
		id: 'autoLyrics',
		name: 'Auto Lyrics',
	},
	smartqueue: {
		id: 'smartQueue',
		name: 'Smart Queue',
	},
} as Record<string, Record<string, string>>;
export const initialWebUserState = {
	id: '',
	username: '',
	discriminator: '',
	avatar: '',
	global_name: '',
};