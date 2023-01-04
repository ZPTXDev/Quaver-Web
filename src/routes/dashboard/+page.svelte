<svelte:head>
    <title>Dashboard | Quaver</title> 
</svelte:head>

<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { goto } from '$app/navigation';
	import logo from '$lib/images/logo-square.svg';
	import { manualLoading } from '$lib/loading';
	import { socket } from '$lib/socket';
	import { paginate } from '@zptxdev/zptx-lib';
	import type { APIGuild, APIUser } from 'discord-api-types/v10';
	import { Button, Card, CloseButton, Drawer, Pagination, Search, Tooltip } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { ArrowLongRight, ArrowRight, ChevronLeft, ChevronRight, MagnifyingGlass, MinusCircle, MusicalNote, PauseCircle, PlayCircle, Plus } from 'svelte-heros-v2';
	import { sineIn } from 'svelte/easing';
	import Footer from '../Footer.svelte';
	import Navbar from '../Navbar.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	let guilds = [] as (APIGuild & {
		botInGuild?: boolean;
		idle?: boolean;
		track?: string;
		premium?: boolean;
	})[];
	$: user = {
		id: '',
		username: '',
		discriminator: '',
		avatar: '',
	} as APIUser;
	$: version = '';
	$: paginatedGuilds = paginate(guilds, 9);
	$: pages = paginatedGuilds.map((_, index) => index + 1).filter((pageNumber) => (page <= 2 ? pageNumber >= 1 && pageNumber <= 5 : (page >= paginatedGuilds.length - 2 ? pageNumber >= paginatedGuilds.length - 4 && pageNumber <= paginatedGuilds.length : pageNumber >= page - 2 && pageNumber <= page + 2))).map(name => ({ name, active: page === name }));
	let page = 1;
	let value = '';
	let promoHidden = true;
	let transitionParams = {
		x: -320,
		duration: 200,
		easing: sineIn
	};

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

	onMount(() => {
		if (!$socket.connected) {
			goto('/');
			return;
		}
		$socket.emit(
			'fetchuser',
			[data.token],
			(response: { status: string; user: APIUser; version: string }) => {
				if (response.status !== 'success') {
					goto('/signout');
					return;
				}
				$socket.emit(
					'fetchguilds',
					[data.token],
					(rsp: {
						status: string;
						guilds: { message?: string } & (APIGuild & {
							botInGuild?: boolean;
							idle?: boolean;
							track?: string;
							premium?: boolean;
						})[];
						version: string;
					}) => {
						if (rsp.status !== 'success') {
							goto('/signout');
							return;
						}
						const webGuilds = rsp.guilds ?? [];
						webGuilds.sort((a, b) => {
							if (a.botInGuild && !a.idle && b.botInGuild && b.idle) return -1;
							if (b.botInGuild && !b.idle && a.botInGuild && a.idle) return 1;
							if (a.botInGuild && !b.botInGuild) return -1;
							if (b.botInGuild && !a.botInGuild) return 1;
							if (!a.permissions || !b.permissions) return 0;
							if ((Number(a.permissions) & 0x20) !== 0 && (Number(b.permissions) & 0x20) === 0)
								return -1;
							if ((Number(b.permissions) & 0x20) !== 0 && (Number(a.permissions) & 0x20) === 0)
								return 1;
							return a.name.localeCompare(b.name);
						});
						user = response.user;
						guilds = webGuilds;
						version = rsp.version;
						$manualLoading = false;
					}
				);
			}
		);
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

<Drawer transitionType="fly" {transitionParams} bind:hidden={promoHidden}>
	<div class='flex items-center'>
		<h5
		  id="drawer-label"
		  class="inline-flex items-center mb-4 text-base font-semibold text-amber-400">
		  <MusicalNote class="w-5 h-5 mr-2" variation="solid"></MusicalNote>
		  Quaver Premium
		</h5>
		<CloseButton on:click={() => (promoHidden = true)} class='mb-4 dark:text-white'/>
	</div>
		<p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
			Quaver Premium is a premium subscription that gives you access to exclusive features and benefits.
			Unlock features such as <strong>Smart Queue</strong>, <strong>Auto Lyrics</strong>, <strong>24/7 Mode</strong> and more!
		</p>
		<Button gradient color="purpleToPink" href={env.PUBLIC_PREMIUM_URL} class="w-full">Get Premium <ArrowLongRight class="w-4 h-4 ml-1"></ArrowLongRight></Button>
</Drawer>
<Navbar {user} />
<div class="container mx-auto my-4">
	<Search size="md" bind:value on:input={e => search(value)}></Search>
</div>
<div class="container mx-auto grid xl:grid-cols-3 lg:grid-cols-2 xs:grid-cols-1 gap-4 place-items-center">
	{#if paginatedGuilds.length > 0}
		{#each paginatedGuilds[page - 1] as guild}
			<Card img={guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=1024` : logo} horizontal class="col-span-1 w-full h-full relative truncate-text enforce-logo-size{!guild.icon ? ' grayscale-logo' : ''}">
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
				<Button gradient={!guild.idle} color={guild.idle ? 'blue' : 'purpleToBlue'} class="md:absolute md:bottom-0 md:mb-6" href={!guild.botInGuild && (guild.permissions & 0x20) === 0 ? '' : `/guild/${guild.id}`} on:click={event => {event.preventDefault(); if (!guild.botInGuild && (guild.permissions & 0x20) === 0) goto(`/guild/${guild.id}`);}} disabled={!guild.botInGuild && (guild.permissions & 0x20) === 0}>
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
				<MagnifyingGlass size=40 class="mx-auto mb-3"></MagnifyingGlass>
				<h5 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
					No servers found
				</h5>
				<p class="text-base text-gray-500 sm:text-lg dark:text-gray-400">
					Try narrowing your search criteria.
				</p>
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
