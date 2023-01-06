import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (async ({ request, cookies }) => {
	const { token } = await request.json();
	if (!token) return json({ success: false });
	cookies.set('token', token, { path: '/' });
	return json({ success: true });
}) satisfies RequestHandler;
