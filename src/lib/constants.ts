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