<svelte:head>
    <title>Dashboard | Quaver</title> 
</svelte:head>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { Footer, Navbar, PendingAction, PromoDrawer } from '$components';
	import { LogoSquare } from '$images';
	import { manualLoading, socket } from '$lib/stores';
	import { fetchGuilds, fetchUser, signout, sortGuilds, type WebGuild, type WebUser } from '$lib/util';
	import { paginate } from '@zptxdev/zptx-lib';
	import type { APIGuild } from 'discord-api-types/v10';
	import { Button, Card, Pagination, Search, Tooltip } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { ArrowRight, ChevronLeft, ChevronRight, MagnifyingGlass, MinusCircle, MusicalNote, PauseCircle, PlayCircle, Plus } from 'svelte-heros-v2';
	import type { PageData } from './$types';

	export let data: PageData;
	let guilds: WebGuild[] = [];
	let user: WebUser = {
		id: '',
		username: '',
		discriminator: '',
		avatar: '',
	};
	let page = 1;
	let value = '';
	let promoHidden = true;
	
	$: user;
	$: version = '';
	$: paginatedGuilds = paginate(guilds, 9);
	$: pages = paginatedGuilds.map((_, index) => index + 1).filter((pageNumber) => (page <= 2 ? pageNumber >= 1 && pageNumber <= 5 : (page >= paginatedGuilds.length - 2 ? pageNumber >= paginatedGuilds.length - 4 && pageNumber <= paginatedGuilds.length : pageNumber >= page - 2 && pageNumber <= page + 2))).map(name => ({ name, active: page === name }));

	const previous = () => {
		if (page > 1) page -= 1;
	}
	const next = () => {
		if (page < paginatedGuilds.length) page += 1;
	}
	const click = (event: Event) => {
		if (!event.target || !(event.target instanceof HTMLButtonElement)) return;
		page = parseInt(event.target.innerText);
	}

	const search = (query: string) => {
		let tempGuilds = [];
		if (query.length > 0) {
			tempGuilds = guilds.filter((guild: APIGuild) => guild.name.toLowerCase().includes(query.toLowerCase()));
		} else {
			tempGuilds = guilds;
		}
		paginatedGuilds = paginate(tempGuilds, 9);
		page = 1;
	}

	onMount(async () => {
		if (!$socket.connected) {
			goto('/');
			return;
		}
		try {
			({ user, version } = await fetchUser($socket, data.token as string));
			({ guilds } = await fetchGuilds($socket, data.token as string));
			const webGuilds = guilds ?? [];
			webGuilds.sort(sortGuilds);
			guilds = webGuilds;
			$manualLoading = false;
		}
		catch (error) {
			await signout();
			goto('/');
		}
	});
</script>

<style global>
	.grayscale-logo img {
		filter: grayscale(1);
	}

	.enforce-logo-size img {
		flex-shrink: 0;
	}

	.truncate-text div {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>

<PromoDrawer bind:hidden={promoHidden} />
<Navbar {user} />
<div class="container mx-auto my-4">
	<Search size="md" bind:value on:input={e => search(value)}></Search>
</div>
<div class="container mx-auto grid xl:grid-cols-3 lg:grid-cols-2 xs:grid-cols-1 gap-4 place-items-center">
	{#if paginatedGuilds.length > 0}
		{#each paginatedGuilds[page - 1] as guild}
			<Card img={guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=1024` : LogoSquare} horizontal class="col-span-1 w-full h-full relative truncate-text enforce-logo-size{!guild.icon ? ' grayscale-logo' : ''}">
				<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white inline-flex items-center w-full">
					<p class="truncate">{guild.name}</p>
					{#if guild.premium}
						<MusicalNote id="premium" variation="solid" class="w-6 h-6 ml-1.5 text-amber-400 flex-shrink-0 cursor-pointer" on:click={() => (promoHidden = false)}></MusicalNote>
						<Tooltip triggeredBy="#premium">Quaver Premium</Tooltip>
					{/if}
				</h5>
				<br>
				<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight inline-flex items-center w-full">
					{#if !guild.botInGuild}
						<MinusCircle variation="solid" class="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0"></MinusCircle>
						Not in server
					{:else if guild.idle}
						<PauseCircle variation="solid" class="w-4 h-4 mr-1.5 text-amber-400 flex-shrink-0"></PauseCircle>
						Not playing anything
					{:else}
						<PlayCircle variation="solid" class="w-4 h-4 mr-1.5 text-green-500 dark:text-green-400 flex-shrink-0"></PlayCircle>
						Playing <strong id="track" class="ml-1 truncate">{guild.track}</strong>
						<Tooltip triggeredBy="#track">{guild.track}</Tooltip>
					{/if}
				</p>
				<br>
				<Button gradient={!guild.idle} color={guild.idle ? 'blue' : 'purpleToBlue'} class="md:absolute md:bottom-0 md:mb-6" href={!guild.botInGuild && (Number(guild.permissions) & 0x20) === 0 ? '' : `/guild/${guild.id}`} on:click={event => {event.preventDefault(); if (guild.botInGuild || (Number(guild.permissions) & 0x20) !== 0) goto(`/guild/${guild.id}`);}} disabled={!guild.botInGuild && (Number(guild.permissions) & 0x20) === 0}>
					{#if guild.botInGuild}
						Manage Server
						<ArrowRight class="w-5 h-5 ml-2"></ArrowRight>
					{:else}
						Add to Server
						<Plus class="w-5 h-5 ml-2"></Plus>
					{/if}
				</Button>
			</Card>
		{/each}
	{:else}
		<Card class="col-span-full text-center w-full" size="xl" padding="xl">
			<div class="py-24">
				<PendingAction icon={MagnifyingGlass} title="No servers found" subtitle="Try narrowing your search criteria." />
			</div>
		</Card>
	{/if}
</div>
<div class="container mt-4 mx-auto justify-center flex space-x-3">
	<Pagination {pages} on:previous={previous} on:next={next} on:click={click} icon>
		<svelte:fragment slot="prev">
			<span class="sr-only">Previous</span>
			<ChevronLeft class="w-5 h-5"/>
		  </svelte:fragment>
		  <svelte:fragment slot="next">
			<span class="sr-only">Next</span>
			<ChevronRight class="w-5 h-5"/>
		</svelte:fragment>
	</Pagination>
</div>
<br>
<div class="container mx-auto">
	<Footer {version} />
</div>
<br>
