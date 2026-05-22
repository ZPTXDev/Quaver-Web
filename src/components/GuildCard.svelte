<script lang="ts">
import { env } from '$env/dynamic/public';
import { getGuildBannerURL, getGuildIconURL, getInitials, type WebGuild } from '$lib/util';
import { ImageSolid, MusicAltSolid } from 'flowbite-svelte-icons';

const DISCORD_BASE_URL = `https://discord.com/api/oauth2/authorize?client_id=${env.PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${location.origin}&response_type=code&scope=applications.commands%20bot&permissions=3459072`;
const LOADING_WIDTHS = ['w-3/4', 'w-1/2', 'w-1/3', 'w-2/3'];

let { guild, loading }: { guild?: WebGuild, loading?: boolean } = $props();
let imgsLoaded = $state(0);

function getGuildURL(guild?: WebGuild): string {
	if (!guild) return DISCORD_BASE_URL;
	if (guild.botInGuild) return `/guild/${guild.id}`;
	return `${DISCORD_BASE_URL}&guild_id=${guild.id}`;
}
function lazy(image: HTMLImageElement, src: string) {
	const loaded = () => {
		imgsLoaded += 1;
	}
	const observer = new IntersectionObserver(entries => {
		if (entries[0].isIntersecting) {
			image.src = src;
			if (image.complete) {
				loaded();
			} else {
				image.addEventListener('load', loaded);
			}
		}
	}, {
		root: null,
		rootMargin: "0px",
		threshold: 0,
	})
	observer.observe(image);

	return {
		destroy() {
			image.removeEventListener('load', loaded);
		}
	};
}
</script>

{#if loading}
	<div class="flex flex-col gap-2 animate-pulse w-full p-3 rounded-2xl">
		<div class="flex items-center justify-center background-700 rounded-xl relative h-32 w-full">
			<ImageSolid class="w-10 h-10 text-100" />
		</div>
		<div class="h-4 rounded-full background-700 {LOADING_WIDTHS[Math.floor(Math.random() * LOADING_WIDTHS.length)]}"></div>
	</div>
{:else}
	<a href={getGuildURL(guild)} class="flex flex-col gap-1 text-900 hover:background-200 focus:background-200 font-semibold w-full p-3 transition rounded-2xl truncate">
		<div class="rounded-xl relative h-32 w-full overflow-hidden">
			{#if guild?.banner || guild?.icon}
				<div class="{imgsLoaded >= 2 ? 'opacity-0' : 'opacity-50'} transition-opacity absolute h-32 w-full {guild ? 'background-700' : 'background-400'}"></div>
				{#key guild.banner}
					<img draggable="false" ondragstart={(e) => {e.preventDefault(); return false;}} src="" use:lazy={guild.banner ? getGuildBannerURL(guild) : getGuildIconURL(guild)} alt={guild.name} class="{imgsLoaded >= 2 ? 'opacity-100' : 'opacity-0'} transition-opacity pointer-events-none drag-none absolute h-32 w-full blur-sm {guild.banner ? '' : ' object-none scale-150'}" />
				{/key}
				{#key guild.icon}
					<img draggable="false" ondragstart={(e) => {e.preventDefault(); return false;}} src="" use:lazy={getGuildIconURL(guild)} alt={guild.name} class="{imgsLoaded >= 2 ? 'opacity-100' : 'opacity-0'} transition-opacity pointer-events-none drag-none absolute h-20 w-20 object-cover rounded-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
				{/key}
			{:else}
				<div class="absolute h-32 w-full {guild ? 'background-700' : 'background-400'}"></div>
				<span class="absolute h-20 w-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 {guild ? 'text-3xl' : 'text-4xl'} text-100 text-center leading-[80px]">{guild ? getInitials(guild.name) : "+"}</span>
			{/if}
		</div>
		<span class="truncate">{guild?.name ?? "Add a server"}</span>
		{#if guild?.track}
			<span class="flex flex-row gap-0.5 items-center text-xs -mt-1">
				<MusicAltSolid class="w-4 h-4 text-green-500 dark:text-green-400"></MusicAltSolid>
				<span class="truncate">{guild.track}</span>
			</span>
		{/if}
	</a>
{/if}