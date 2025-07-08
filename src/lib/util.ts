import type { APIGuild, APIUser, Snowflake } from 'discord-api-types/v10';
import type { Socket } from 'socket.io-client';
import type { TimeObject } from '@zptxdev/zptx-lib';

export type WebGuild = APIGuild & {
	botInGuild?: boolean;
	idle?: boolean;
	track?: string;
	premium?: boolean;
};
export type WebUser = APIUser & { manager?: boolean };

export const hasManageServerPermissions = (permissions?: string): boolean => (Number(permissions) & 0x20) !== 0;
export const friendlyTimeString = (time: TimeObject): string => {
	if (time.s >= 30 && time.m > 0) {
		return `${time.m + 1} minute${time.m + 1 > 1 ? 's' : ''}`;
	} else if (time.m > 0) {
		return `${time.m} minute${time.m > 1 ? 's' : ''}`;
	} else {
		return `${time.s} second${time.s > 1 ? 's' : ''}`;
	}
}
export const getGuildIconURL = (guild: WebGuild): string => `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=4096`;
export const getGuildBannerURL = (guild: WebGuild): string => `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png?size=4096`;
export const getUserAvatarURL = (user: WebUser): string => `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=4096`;
export const fetchUser = async (socket: Socket, token: string) => {
	return new Promise<{ status: string; user: WebUser; version: string }>((resolve, reject) => {
		socket.emit(
			'fetchuser',
			[token],
			(response: { status: string; user: WebUser; version: string }) => {
				if (response.status !== 'success') reject();
				else resolve(response);
			}
		);
	});
};
export const fetchGuilds = async (socket: Socket, token: string) => {
	return new Promise<{
		status: string;
		guilds: { message?: string } & WebGuild[];
		version: string;
	}>((resolve, reject) => {
		socket.emit(
			'fetchguilds',
			[token],
			(response: {
				status: string;
				guilds: { message?: string } & WebGuild[];
				version: string;
			}) => {
				if (response.status !== 'success') reject();
				else resolve(response);
			}
		);
	});
};
export const join = async (socket: Socket, guildId: Snowflake) => {
	return new Promise<{ status: string }>((resolve, reject) => {
		socket.emit('join', [guildId], (response: { status: string }) => {
			if (response.status !== 'success') reject();
			else resolve(response);
		});
	});
};
export const request = async (socket: Socket, guildId: Snowflake, type: string) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return new Promise<{ status: string; response?: any }>((resolve, reject) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		socket.emit('request', [guildId, type], (response: { status: string; response?: any }) => {
			if (response.status !== 'success') reject();
			else resolve(response);
		});
	});
};
export const getInitials = (name: string): string => {
	const cleaned = name.replace(/\s+/g, ' ').trim();
	const parts = cleaned.split(/([ .\-#])/).filter(Boolean);
	let result = '';
	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (['.', '-', '#'].includes(part)) {
			result += part;
		} else if (part !== ' ') {
			result += part[0];
		}
	}
	return result;
};
export const preload = (src: string): Promise<string> => {
	if (src === '') return Promise.resolve('');
	return new Promise(function (resolve) {
		const img = new Image();
		img.onload = () => resolve(src);
		img.src = src;
	});
};
export const sortGuilds = (a: WebGuild, b: WebGuild) => {
	if (a.botInGuild && !a.idle && b.botInGuild && b.idle) return -1;
	if (b.botInGuild && !b.idle && a.botInGuild && a.idle) return 1;
	if (a.botInGuild && !b.botInGuild) return -1;
	if (b.botInGuild && !a.botInGuild) return 1;
	if (!a.permissions || !b.permissions) return 0;
	if ((Number(a.permissions) & 0x20) !== 0 && (Number(b.permissions) & 0x20) === 0) return -1;
	if ((Number(b.permissions) & 0x20) !== 0 && (Number(a.permissions) & 0x20) === 0) return 1;
	return a.name.localeCompare(b.name);
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
