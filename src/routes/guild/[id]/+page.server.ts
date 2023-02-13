import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies, params }) => {
	if (!cookies.get('token')) {
		cookies.set('redirect', params.id, {
			path: '/',
			secure: env.PRIVATE_SECURE?.toLowerCase() === 'true' ?? false
		});
		throw redirect(307, '/');
	}
	cookies.delete('redirect', {
		path: '/',
		secure: env.PRIVATE_SECURE?.toLowerCase() === 'true' ?? false
	});
	return { token: cookies.get('token'), guildId: params.id };
}) satisfies PageServerLoad;
