import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (({ cookies, url }) => {
	const redirectID = url.searchParams.get('redirect');
	if (redirectID) cookies.set('redirect', redirectID, { path: '/' });
	cookies.delete('token', { path: '/' });
	throw redirect(307, '/');
}) satisfies PageServerLoad;
