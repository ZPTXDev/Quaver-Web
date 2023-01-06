import type { Snowflake } from 'discord-api-types/v10';

export const signout = async (guildId?: Snowflake) => {
	const result = await fetch('/signout', {
		method: 'POST',
		body: JSON.stringify({ guildId }),
		headers: { 'content-type': 'application/json' }
	});
	const json = (await result.json()) as { success: boolean };
	if (!json.success) throw new Error('Failed to sign out');
	return result;
};
