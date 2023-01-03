import { socket } from '$lib/socket';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
	if (!cookies.get('token') || !socket.connected) throw redirect(307, '/');
	if (cookies.get('redirect')) throw redirect(307, `/guild/${cookies.get('redirect')}`);
	return { token: cookies.get('token') };
}) satisfies PageServerLoad;
