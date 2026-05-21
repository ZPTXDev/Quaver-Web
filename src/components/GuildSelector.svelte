<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { SearchOutline } from 'flowbite-svelte-icons';
	import { getGuildIconURL, getInitials, lazy, scrollChildIntoView, type WebGuild } from '$lib/util';
	import 'simplebar';
	import 'simplebar/dist/simplebar.min.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { guilds, currentGuildId = '', open = $bindable(false) } = $props();
	let searchInput: HTMLInputElement | null = $state(null);
	let value = $state('');
	let focused = $state('');

	let filteredGuilds = $derived(
		guilds.toSorted((a: WebGuild, b: WebGuild) => a.name.localeCompare(b.name)).filter((guild: WebGuild) => guild.botInGuild && guild.name.toLowerCase().includes(value.toLowerCase()))
	);

	function reset() {
		value = '';
		open = false;
		focused = '';
	}

	function setFocused(guildId: string) {
		focused = guildId;
	}

	function arrowFocusChange(guildId: string) {
		setFocused(guildId);
		const container = document.querySelector<HTMLElement>(
			'#guildcontainer .simplebar-content-wrapper'
		);
		const guildElement = document.getElementById(`guild-${guildId}`);
		if (!container || !guildElement) return;
		scrollChildIntoView(container, guildElement, 'nearest');
	}

	function onClickEvent(e: MouseEvent, guildId: string) {
		if (currentGuildId === guildId) {
			e.preventDefault();
		}
		reset();
	}

	$effect(() => {
		if (filteredGuilds.length > 0 && focused === '') {
			focused = filteredGuilds[0].id;
		}
		if (value && !filteredGuilds.some((guild: WebGuild) => guild.id === focused)) {
			focused = filteredGuilds[0]?.id || '';
		}
		if (open && searchInput) {
			searchInput.focus();
		}
	});

	onMount(() => {
		document.addEventListener('keydown', (event) => {
			if (!open) return;
			if (event.key === 'ArrowDown') {
				const currentIndex = filteredGuilds.findIndex((guild: WebGuild) => guild.id === focused);
				if (currentIndex < filteredGuilds.length - 1) {
					arrowFocusChange(filteredGuilds[currentIndex + 1].id);
				}
			} else if (event.key === 'ArrowUp') {
				const currentIndex = filteredGuilds.findIndex((guild: WebGuild) => guild.id === focused);
				if (currentIndex > 0) {
					arrowFocusChange(filteredGuilds[currentIndex - 1].id);
				}
			} else if (event.key === 'Enter' && focused) {
				value = '';
				open = false;
				if (focused === currentGuildId) return;
				goto(`/guild/${focused}`);
				focused = '';
			} else if (event.key === 'Escape') {
				reset();
			}
		});
	})
</script>

{#if open}
	<div role="button" tabindex="-1" transition:fade={{duration: 200}} class="fixed inset-0 w-screen h-screen flex items-center justify-center bg-black/60 backdrop-blur-md z-40" onclick={reset} onkeydown={reset}></div>
	<div transition:scale={{duration: 200, start: 0.95}} class="fixed top-1/2 left-1/2 transform -translate-1/2 flex flex-col gap-4 items-center justify-center background-300 rounded-lg z-50 p-4 w-[calc(100%-4rem)] max-w-[680px] h-full max-h-96">
		<div class="relative w-full">
			<div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
				<SearchOutline class="text-500 w-5 h-5" />
			</div>
			<input
				id="selectorsearch"
				bind:this={searchInput}
				bind:value
				type="text"
				placeholder="Search servers..."
				class="input-class text-xl rounded-lg h-16" />
		</div>
		<div id="guildcontainer" data-simplebar class="flex flex-col gap-2 overflow-y-scroll no-scrollbar w-full h-full">
			{#if filteredGuilds.length === 0}
				<div class="flex flex-col items-center justify-center h-full text-900 text-xl font-semibold mt-2">
					No servers found :(
					{#if currentGuildId}
						<span class="text-sm font-normal text-800">
							Try looking in the
							<a href="/dashboard" class="text-600 hover:text-400">dashboard</a>
							instead?
						</span>
					{/if}
				</div>
			{:else}
				{#each filteredGuilds as guild (guild.id)}
					<a id="guild-{guild.id}" href={`/guild/${guild.id}`} class="flex flex-row items-center gap-3 p-3 rounded-lg{guild.id === focused ? ' background-200' : ''} transition-colors" onmouseover={() => setFocused(guild.id)} onfocus={() => setFocused(guild.id)} onclick={(e) => onClickEvent(e, guild.id)}>
						<div class="h-6 aspect-square shrink-0 rounded-full overflow-hidden{guild.icon ? '' : ' background-700'} flex items-center justify-center transition-colors text-center">
							{#if guild.icon}
								{#key guild.icon}
									<img src="" use:lazy={getGuildIconURL(guild)} alt="Guild Icon" class="pointer-events-none h-full w-full opacity-0 transition-opacity rounded-full object-cover" />
								{/key}
							{:else}
								<span class="font-semibold text-100 text-center text-xs w-full">{getInitials(guild.name)}</span>
							{/if}
						</div>
						<span class="text-lg font-semibold text-900">{guild.name}</span>
					</a>
				{/each}
			{/if}
		</div>
	</div>
{/if}