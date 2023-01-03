import { socket } from '$lib/socket';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ url, cookies }) => {
	const guildId = url.searchParams.get('guild_id');
	// part of discord callback - let's send the user to the guild page
	if (guildId) throw redirect(307, `/guild/${guildId}`);
	// socket is connected and we previously authenticated - redirect to dashboard
	if (socket.connected && cookies.get('token')) throw redirect(307, '/dashboard');
	const code = url.searchParams.get('code');
	// socket is connected and we have a callback - authenticate and redirect to dashboard
	if (socket.connected && code) {
		throw await new Promise((resolve) => {
			socket.emit(
				'exchange',
				[code, url.origin],
				(response: { status: string; encryptedToken: string }) => {
					if (response.status !== 'success') resolve(redirect(307, '/'));
					cookies.set('token', response.encryptedToken, { path: '/' });
					resolve(redirect(307, `/dashboard`));
					return;
				}
			);
		});
	}
	// socket not connected, or we never authenticated and have no callback - pass existence of cookie back so we know how to handle it
	return { cookiePresent: !!cookies.get('token') };
}) satisfies PageServerLoad;
