import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ cookies }) => {
	return { token: cookies.get('token'), redirect: cookies.get('redirect') };
}) satisfies PageServerLoad;