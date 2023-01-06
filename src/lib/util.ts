import type { APIGuild, APIUser, Snowflake } from 'discord-api-types/v10';

export type WebGuild = APIGuild & {
	botInGuild?: boolean;
	idle?: boolean;
	track?: string;
	premium?: boolean;
};
export type WebUser = APIUser & { manager?: boolean };

export const getInitials = (name: string) =>
	name
		.split(' ')
		.map((word: string) => word[0])
		.join('');
export const preload = (src: string): Promise<string> => {
	if (src === '') return Promise.resolve('');
	return new Promise(function (resolve) {
		const img = new Image();
		img.onload = () => resolve(src);
		img.src = src;
	});
};
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
