import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (({ cookies, url }) => {
	const redirectID = url.searchParams.get('redirect');
	if (redirectID)
		cookies.set('redirect', redirectID, {
			path: '/',
			secure: env.PRIVATE_SECURE?.toLowerCase() === 'true' ?? false
		});
	cookies.delete('token', {
		path: '/',
		secure: env.PRIVATE_SECURE?.toLowerCase() === 'true' ?? false
	});
	return json({ success: true });
}) as RequestHandler;
