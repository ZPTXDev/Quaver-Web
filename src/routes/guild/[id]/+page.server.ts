import { socket } from '$lib/socket';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies, params }) => {
	if (!cookies.get('token') || !socket.connected) {
		cookies.set('redirect', params.id, { path: '/' });
		throw redirect(307, '/');
	}
	cookies.delete('redirect', { path: '/' });
	return { token: cookies.get('token'), guildId: params.id };
}) satisfies PageServerLoad;
