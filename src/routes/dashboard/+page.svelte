<svelte:head>
    <title>Dashboard | Quaver</title>
</svelte:head>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { GuildCard, Navbar } from '$components';
	import { state as states } from '$lib/states.svelte';
	import {
		fetchGuilds,
		fetchUser,
		hasManageServerPermissions,
		signout,
		sortGuilds,
		type WebGuild,
		type WebUser
	} from '$lib/util';
	import { Dropdown, DropdownHeader, DropdownItem, Toggle } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { AdjustmentsHorizontalOutline, CloseOutline, MusicOutline, SearchOutline } from 'flowbite-svelte-icons';
	import type { PageData } from './$types';
	import { dashboardHeadline, initialWebUserState, nowPlayingHeadline } from '$lib/constants';
	import { fade } from 'svelte/transition';

	let { data }: { data: PageData } = $props();
	const DASHBOARD_HEADLINE = dashboardHeadline[Math.floor(Math.random() * dashboardHeadline.length)];
	const NOW_PLAYING_HEADLINE = nowPlayingHeadline[Math.floor(Math.random() * nowPlayingHeadline.length)];
	let guilds: WebGuild[] = $state([]), user: WebUser = $state(initialWebUserState);
	let value = $state(''), showAllServers = $state(false);
	let loading = $state(true);
	let activeGuilds = $derived(
		guilds.filter(
			(guild) =>
				(value ? guild.name.toLowerCase().includes(value.toLowerCase()) : true)
				&& guild.botInGuild
				&& !guild.idle,
		),
	);
	let inactiveGuilds = $derived(
		guilds.filter(
			(guild) =>
				(
					(value ? guild.name.toLowerCase().includes(value.toLowerCase()) : true)
					&& (
						showAllServers
							&& hasManageServerPermissions(guild.permissions) || guild.botInGuild)
				)
				&& guild.idle,
		)
	);

	onMount(async () => {
		if (!states.socket.connected) return goto('/');
		try {
			({ user } = await fetchUser(states.socket, data.token as string));
			states.manualLoading = false;
			let { guilds: webGuilds } = await fetchGuilds(states.socket, data.token as string);
			guilds = (webGuilds ?? []).toSorted(sortGuilds);
			loading = false;
		}
		catch (error) {
			await signout();
			return goto('/');
		}
	});
</script>

{#snippet search(mobile = false)}
	<div class="relative w-full md:w-72 lg:w-96{mobile ? '' : ' max-md:hidden'}">
		<div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
			<SearchOutline class="text-500 w-4.5 h-4.5" />
		</div>
		<input bind:value type="text" placeholder="Search servers..." class="input-class">
		<div class="absolute inset-y-0 end-0 flex items-center pe-3 gap-1.5 h-full">
			<CloseOutline class="text-500 w-4.5 h-full cursor-pointer{value ? '' : ' hidden'}" onclick={() => value = ''} />
			<div class="h-4/7 w-0.5 background-300"></div>
			<AdjustmentsHorizontalOutline id="settings" class="text-500 w-4.5 h-full cursor-pointer" />
		</div>
	</div>
{/snippet}

<Navbar {user} centerSnippet={search} />
<div class="px-4 mt-8 mb-1">
	<h1 class="container mx-auto text-4xl font-bold tracking-tight text-900">
		<span>{DASHBOARD_HEADLINE}</span>
		<span class="background-900 rounded-lg text-100 px-2.5 text-center ml-1">{user.global_name ?? user.username}</span>
	</h1>
</div>
{#if activeGuilds.length > 0}
	<div class="px-4">
		<h1 class="mt-4 container mx-auto flex flex-row gap-2 items-center text-3xl align-middle font-bold tracking-tight text-900">
			{NOW_PLAYING_HEADLINE}
			<MusicOutline class="w-8 h-8 text-text-700 dark:text-text-dark-700" />
		</h1>
	</div>
	<div class="px-1 mt-0.5">
		<div class="w-full max-w-[664px] md:max-w-[792px] lg:max-w-[1048px] xl:max-w-[1304px] 2xl:max-w-[1560px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
			{#each activeGuilds as guild}
				<GuildCard {guild} />
			{/each}
		</div>
	</div>
{/if}
<div class="px-4">
	<h1 class="mt-4 container mx-auto flex flex-row gap-2 items-center text-3xl align-middle font-bold tracking-tight text-900">
		Your servers
	</h1>
</div>
<div class="px-1 mt-0.5{inactiveGuilds.length !== 0 || loading || !value ? ' max-sm:mb-24' : ''}">
	<div class="w-full max-w-[664px] md:max-w-[792px] lg:max-w-[1048px] xl:max-w-[1304px] 2xl:max-w-[1560px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
		{#if loading}
			{#each Array(6) as _}
				<GuildCard loading />
			{/each}
		{:else}
			{#each inactiveGuilds as guild}
				<GuildCard {guild} />
			{/each}
			<GuildCard />
		{/if}
	</div>
</div>
{#if inactiveGuilds.length === 0 && !loading && value}
	<div class="px-4 mt-2 mb-4 max-sm:mb-24">
		<span transition:fade={{duration:100}} class="container mx-auto flex flex-row justify-center gap-1 text-700 text-center">
			{#if showAllServers}
				<span>Still can't find your server? You might not have the required permissions to manage it.</span>
			{:else}
				<span>
					Can't find your server?
					<button class="text-500 hover:text-300 shrink-0" onclick={(e) => {e.preventDefault(); showAllServers = true;}}>Show all servers you manage</button>
				</span>
			{/if}
		</span>
	</div>
{/if}

<div class="md:hidden px-5 w-full fixed bottom-0 left-1/2 transform -translate-x-1/2 mb-8 flex flex-row gap-2">
	{@render search(true)}
</div>

<Dropdown simple offset={10} triggeredBy="#settings" class="!dropdown-override">
	<DropdownHeader class="py-2">
		Settings
	</DropdownHeader>
	<DropdownItem class="!dropdown-item-override">
		<Toggle bind:checked={showAllServers} spanClass="!toggle-span-override" class="!toggle-override">Show all manageable servers</Toggle>
	</DropdownItem>
</Dropdown>