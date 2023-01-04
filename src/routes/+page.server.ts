import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ url, cookies }) => {
	const guildId = url.searchParams.get('guild_id');
	// part of discord callback - let's send the user to the guild page
	if (guildId) throw redirect(307, `/guild/${guildId}`);
	return { token: cookies.get('token') };
}) satisfies PageServerLoad;
