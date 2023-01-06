import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST = (({ cookies, url }) => {
	const redirectID = url.searchParams.get('redirect');
	if (redirectID) cookies.set('redirect', redirectID, { path: '/' });
	cookies.delete('token', { path: '/' });
	return json({ success: true });
}) as RequestHandler;
