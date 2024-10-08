<svelte:head>
    <title>Manage {guild?.name ?? 'Server'} | Quaver</title>
</svelte:head>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { Footer, Navbar, PendingAction, PromoDrawer } from '$components';
	import { env } from '$env/dynamic/public';
	import { featureMap, managerMode, manualLoading, socket } from '$lib/stores';
	import { fetchGuilds, fetchUser, getInitials, join, request, signout, type WebGuild, type WebUser } from '$lib/util';
	import { msToTime, msToTimeString, paginate } from '@zptxdev/zptx-lib';
	import { Avatar, Badge, Breadcrumb, BreadcrumbItem, Button, ButtonGroup, Card, CardPlaceholder, ChevronLeft, ChevronRight, Heading, InformationCircle, Input, Li, List, Listgroup, ListgroupItem, Pagination, Range, Search, Select, Spinner, Toast, Toggle, Tooltip } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { ArrowPathRoundedSquare, ArrowTopRightOnSquare, ArrowsRightLeft, CheckCircle, ChevronDoubleRight, Clock, EllipsisHorizontalCircle, ExclamationTriangle, Forward, Hashtag, MagnifyingGlass, Pause, Play, Plus, Signal, SpeakerWave, SpeakerXMark, User, XMark } from 'svelte-heros-v2';
	import { ToastContainer, toasts } from 'svelte-toasts';
	import type { PageData } from './$types';

	export let data: PageData;
	let player: any = {
		connected: false,
		playing: {
			nothingPlaying: true,
		},
		loop: 0,
	};
	let user: WebUser = {
		id: '',
		username: '',
		discriminator: '',
		avatar: '',
		manager: false,
	};
	let guild: WebGuild = {} as WebGuild;
	let settings: any = {};
	let queue: any[] = [];
	let page = 1;
	let value = '';
	let identifier = '';
	let promoHidden = true;
	let updatePosition = true;
	let updateVolume = true;
	let perPage = 5;
	let addingTrack = false;

	$: player;
	$: user;
	$: version = '';
	$: guild;
	$: settings;
	$: paginatedQueue = paginate(queue, perPage);
	$: pages = paginatedQueue.map((_, index) => index + 1).filter((pageNumber) => (page <= 2 ? pageNumber >= 1 && pageNumber <= 5 : (page >= paginatedQueue.length - 2 ? pageNumber >= paginatedQueue.length - 4 && pageNumber <= paginatedQueue.length : pageNumber >= page - 2 && pageNumber <= page + 2))).map(name => ({ name, active: page === name }));
	$: position = 0;
	$: volume = 100;

	const previous = () => {
		if (page > 1) page -= 1;
	};
	const next = () => {
		if (page < paginatedQueue.length) page += 1;
	};
	const click = (event: Event) => {
		if (!event.target || !(event.target instanceof HTMLButtonElement)) return;
		page = parseInt(event.target.innerText);
	};
	const search = (query: string) => {
		let tempQueue = [];
		if (query.length > 0) {
			tempQueue = queue.filter((track: { info: { title: string } }) => track.info.title?.toLowerCase().includes(query.toLowerCase()));
		} else {
			tempQueue = queue;
		}
		paginatedQueue = paginate(tempQueue, perPage);
		page = 1;
	};

	function preload(src: string): Promise<string> {
		if (src === '') return Promise.resolve('');
		src = `https://img.youtube.com/vi/${src}/maxresdefault.jpg`;
		return new Promise(resolve => {
			let img = new Image();
			img.onload = () => {
				if (img.naturalWidth === 120) {
					resolve(src.replace('maxresdefault', 'hqdefault'));
					return;
				}
				else {
					resolve(src);
				}
			};
			img.src = src;
		});
	}
	function getQueueDuration(queue: any[]) {
		return msToTimeString(msToTime(queue.filter(track => !track.info.isStream).map(track => track.info.length).reduce((acc, a) => acc + a, 0)), true);
	}
	function settingsToggled(event: Event) {
		if (!event.target || !(event.target instanceof HTMLInputElement)) return;
		const enabled = event.target.checked;
		const id = event.target.id;
		if (enabled && !settings[id].whitelisted) {
			promoHidden = false;
			event.target.checked = false;
			return;
		}
		$socket.emit('update', [
			guild.id,
			{
				type: `${$featureMap[id].id}Feature`,
				value: enabled
			}
		], (r: { status: string }) => {
			if (r.status !== 'success' && event.target instanceof HTMLInputElement) {
				event.target.checked = !enabled;
				switch (r.status) {
					case 'error-auth':
						toasts.error('You do not have permission to perform that action.');
						return;
					case 'error-generic':
						toasts.error('Something went wrong.');
						return;
					case 'error-channel-mismatch':
						toasts.error('You are not in the same channel as Quaver.');
						return;
					case 'error-inactive-session':
						toasts.error('There is no active session.');
						return;
					case 'error-feature-disabled':
						toasts.error('This feature is currently disabled.');
						return;
					case 'error-feature-not-whitelisted':
						toasts.error('You do not have permission to use this feature.');
						return;
				}
				return;
			}
			toasts.success('Successfully updated settings.');
		});
	}
	function updatePositionFromInput(event: Event) {
		if (!event.target || !(event.target instanceof HTMLInputElement)) return;
		position = parseInt(event.target.value);
	}
	function updateVolumeFromInput(event: Event) {
		if (!event.target || !(event.target instanceof HTMLInputElement)) return;
		volume = parseInt(event.target.value);
	}
	function updatePerPage(event: Event) {
		if (!event.target || !(event.target instanceof HTMLSelectElement)) return;
		perPage = parseInt(event.target.value);
		paginatedQueue = paginate(queue, perPage);
		page = 1;
	}
	function update(type: string, value?: any) {
		$socket.emit('update', [guild.id, { type, value }], (r: { status: string }) => {
			switch (r.status) {
				case 'error-auth':
					toasts.error('You do not have permission to perform that action.');
					return;
				case 'error-generic':
					toasts.error('Something went wrong.');
					return;
				case 'error-channel-mismatch':
					toasts.error('You are not in the same channel as Quaver.');
					return;
				case 'error-inactive-session':
					toasts.error('There is no active session.');
					return;
				case 'error-feature-disabled':
					toasts.error('This feature is currently disabled.');
					return;
				case 'error-feature-not-whitelisted':
					toasts.error('You do not have permission to use this feature.');
					return;
			}
			switch (type) {
				case 'bassboost':
				case 'nightcore':
					toasts.info('Filters may take a few seconds to apply.');
					break;
				case 'remove':
					toasts.success('Successfully removed track.');
					break;
			}
		});
	}
	function addTrack(value: string, target: any) {
		if (addingTrack || !value) return;
		addingTrack = true;
		$socket.emit('update', [guild.id, { type: 'add', value }], (r: { status: string }) => {
			switch (r.status) {
				case 'error-generic':
					toasts.error('Something went wrong.');
					break;
				case 'error-auth':
					toasts.error('You do not have permission to perform that action.');
					break;
				case 'error-bot-permission':
					toasts.error('Quaver does not have permission to connect to or speak in your voice channel.');
					break;
				case 'error-bot-timed-out':
					toasts.error('Quaver is timed out in your server.');
					break;
				case 'error-feature-disabled':
					toasts.error('Adding songs from Spotify is currently disabled.');
					break;
				case 'error-no-results':
					toasts.error('No results found.');
					break;
				case 'error-spotify-too-many-tracks':
					toasts.error('You can only add up to 500 tracks at a time from Spotify.');
					break;
				case 'error-user-not-in-channel':
					if (player?.connected) {
						toasts.error('You need to be in my voice channel.');
					}
					else {
						toasts.error('You need to be in a voice channel.');
					}
					break;
				case 'success':
					toasts.success('Successfully added track(s).');
					target.value = '';
					break;
				default:
					toasts.error('Something went wrong.');
					break;
			}
			addingTrack = false;
		});
	}

	onMount(async () => {
		if (!$socket.connected) {
			goto('/');
			return;
		}
		try {
			({ user, version } = await fetchUser($socket, data.token as string));
			let { guilds } = await fetchGuilds($socket, data.token as string);
			if (!guilds) guilds = [];
			if (!guilds.some((g) => g.id === data.guildId)) {
				goto('/dashboard');
				return;
			};
			guild = guilds.find((g) => g.id === data.guildId) as WebGuild;
			if (!guild.botInGuild) {
				if ((Number(guild.permissions) & 0x20) !== 0) {
					goto(
						`https://discord.com/api/oauth2/authorize?client_id=${env.PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${location.origin}&response_type=code&scope=applications.commands%20bot&permissions=3459072&guild_id=${data.guildId}`
					);
					return;
				}
				goto('/dashboard');
				return;
			}
			await join($socket, guild.id);
			const p = await request($socket, guild.id, 'player');
			if (p.response !== null) player = p.response;
			identifier = !player.playing?.nothingPlaying && player.playing.track?.info.sourceName === 'youtube' && player.playing.track.info.identifier ? player.playing.track.info.identifier : '';
			position = player.playing.nothingPlaying ? 0 : player.playing.elapsed / 1000;
			volume = player.volume;
			queue = player.queue ?? [];
			const s = await request($socket, guild.id, 'settings');
			if (s.response) settings = s.response;
			$manualLoading = false;
		}
		catch (error) {
			await signout();
			goto('/');
		}
		finally {
			$socket.on('intervalTrackUpdate', playing => {
				player.playing = playing;
				identifier = !player.playing?.nothingPlaying && player.playing.track?.info.sourceName === 'youtube' && player.playing.track.info.identifier ? player.playing.track.info.identifier : '';
				player.connected = true;
				if (updatePosition) position = player.playing.nothingPlaying ? 0 : player.playing.elapsed / 1000;
				if (updateVolume) volume = player.volume;
			});
			$socket.on('queueUpdate', q => {
				player.queue = q;
				queue = player.queue;
			});
			$socket.on('filterUpdate', filters => {
				player.filters = filters;
			});
			$socket.on('loopUpdate', loop => {
				player.loop = loop;
			});
			$socket.on('pauseUpdate', paused => {
				player.paused = paused;
			});
			$socket.on('volumeUpdate', vol => {
				player.volume = vol;
				if (updateVolume) volume = player.volume;
			});
			$socket.on('channelUpdate', channel => {
				player.channel = channel;
			});
			$socket.on('textChannelUpdate', textChannel => {
				player.textChannel = textChannel;
			});
			$socket.on('timeoutUpdate', timeout => {
				if (player.timeout && !timeout) toasts.info('Resuming your session.');
				player.timeout = timeout;
			});
			$socket.on('pauseTimeoutUpdate', pauseTimeout => {
				if (player.pauseTimeout && !pauseTimeout) toasts.info('Resuming your session.');
				player.pauseTimeout = pauseTimeout;
			});
			$socket.on('playerDisconnect', () => {
				player.queue = [];
				player.volume = 100;
				player.loop = 0;
				player.filters = { bassboost: false, nightcore: false };
				player.paused = false;
				player.playing = { track: {}, elapsed: 0, duration: 0, skip: {}, nothingPlaying: true };
				player.timeout = false;
				player.pauseTimeout = false;
				player.connected = false;
				player.channel = undefined;
				player.textChannel = undefined;
				identifier = '';
				position = player.playing.nothingPlaying ? 0 : player.playing.elapsed / 1000;
				volume = player.volume;
			});
			$socket.on('stayFeatureUpdate', state => {
				settings.stay.enabled = state.enabled;
			});
			$socket.on('autoLyricsFeatureUpdate', state => {
				settings.autolyrics.enabled = state.enabled;
			});
			$socket.on('smartQueueFeatureUpdate', state => {
				settings.smartqueue.enabled = state.enabled;
			});
		}
	});
</script>

<ToastContainer placement="bottom-left" let:data={data}>
	<Toast simple color={data.type === 'success' ? 'green' : data.type === 'warning' ? 'yellow' : data.type === 'error' ? 'red' : 'blue'}>
		<svelte:fragment slot="icon">
			{#if data.type === 'error' || data.type === 'warning'}
				<ExclamationTriangle class="w-6 h-6"></ExclamationTriangle>
			{:else if data.type === 'success'}
				<CheckCircle class="w-6 h-6"></CheckCircle>
			{:else}
				<InformationCircle class="w-6 h-6"></InformationCircle>
			{/if}
		</svelte:fragment>
		{data.description}
	</Toast>
</ToastContainer>
<PromoDrawer bind:hidden={promoHidden} />
<Navbar {user} />
<div class="container mx-auto my-4">
	<Breadcrumb>
		<BreadcrumbItem href="/dashboard" on:click={event => {event.preventDefault(); goto('/dashboard');}} home>Home</BreadcrumbItem>
		<BreadcrumbItem>{guild.name}</BreadcrumbItem>
	</Breadcrumb>
</div>
<div class="container mx-auto flex flex-row flex-wrap lg:flex-nowrap gap-4">
	<div class="w-full lg:w-1/4 space-y-4">
		{#await preload(identifier)}
			<CardPlaceholder />
		{:then source}
			<Card img={source} class="lg:max-w-sm !max-w-full">
				<h5 id="track" class="{!player?.playing?.nothingPlaying ? 'mb-2 ' : ''}text-2xl font-bold tracking-tight text-gray-900 dark:text-white truncate">{player?.playing?.nothingPlaying ? player.connected ? 'Nothing playing' : 'Not in a voice channel' : player.playing.track.info.title}</h5>
				{#if !player?.playing?.nothingPlaying}
					<Tooltip triggeredBy="#track">{player.playing.track.info.title}</Tooltip>
					<p class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
						{player.playing.track.info.author}
					</p>
					<div class="flex flex-row items-center space-x-4">
						<Avatar src={player.playing.track.requesterAvatar ? `https://cdn.discordapp.com/avatars/${player.playing.track.requesterId}/${player.playing.track.requesterAvatar}.png` : ''}>{getInitials(player.playing.track.requesterTag)}</Avatar>
						<div class="grow space-y-1 font-medium dark:text-white truncate">
							<div class="truncate">{player.playing.track.requesterTag}</div>
						</div>
						<Button color="blue" href={player.playing.track.info.uri} target="_blank">
							<ArrowTopRightOnSquare class="w-5 h-5 mr-2"></ArrowTopRightOnSquare>
							Link
						</Button>
					</div>
				{/if}
				{#if player.textChannel && player.channel && !player.playing.nothingPlaying}
					<div class="flex flex-col mt-4">
						<div class="inline-flex items-center">
							{#if !player.playing.track?.info.isStream || player.playing.nothingPlaying}
								{msToTimeString(msToTime(position * 1000), true)}
							{:else}
								<Badge color="red">
									<Signal class="mr-1 w-3 h-3" variation="solid"></Signal>
									Live
								</Badge>
							{/if}
							<Range on:pointerdown={() => updatePosition = false} on:pointerup={() => {update('seek', position * 1000); updatePosition = true;}} on:input={updatePositionFromInput} class={player.playing.track?.info.isStream && !player.playing.nothingPlaying ? 'ml-2' : 'mx-2'} min={0} max={player.playing.nothingPlaying ? 0 : player.playing.track?.info.isStream ? 100 : player.playing.duration / 1000} value={player.playing.track?.info.isStream ? 100 : position} disabled={(player.playing.track?.requesterId !== user.id && (Number(guild?.permissions ?? 0) & 0x20) === 0 && !$managerMode) || player.playing.duration === 0 || player.playing.nothingPlaying || player.playing.track?.info.isStream || player.pauseTimeout || player.paused} />
							{#if !player.playing.track?.info.isStream || player.playing.nothingPlaying}
								{msToTimeString(msToTime(player.playing.nothingPlaying ? 0 : player.playing.duration), true)}
							{/if}
						</div>
						<ButtonGroup class="mt-4 justify-center mx-auto">
							<Button disabled={!player.connected || player.pauseTimeout || player.playing.nothingPlaying} on:click={() => update('paused', !player.paused)}>
								{#if player.paused}
									<Play variation="solid" class="mr-2 -ml-1 w-5 h-5"></Play>
									Play
								{:else}
									<Pause variation="solid" class="mr-2 -ml-1 w-5 h-5"></Pause>
									Pause
								{/if}
							</Button>
							<Button color={!player.playing.nothingPlaying && player.playing.skip?.users?.includes(user.id) ? 'green' : 'alternative'} on:click={() => update('skip')} disabled={!player.connected || player.pauseTimeout || player.playing.nothingPlaying || player.playing.skip?.users?.includes(user.id)}><Forward variation="solid" class="mr-2 -ml-1 w-5 h-5"></Forward>Skip{!player.playing.nothingPlaying && player.playing.skip?.users?.includes(user.id) ? `ping` : ''}{!player.playing.nothingPlaying && player.playing.skip ? ` (${player.playing.skip?.users.length}/${player.playing.skip?.required})` : ''}</Button>
						</ButtonGroup>
						<ButtonGroup class="mt-2 justify-center mx-auto">
							<Button on:click={() => update('loop', player.loop - 1 < 0 ? 2 : player.loop - 1)} disabled={!player.connected || player.pauseTimeout} color={player.loop !== 0 ? 'green' : 'alternative'}>
								<ArrowPathRoundedSquare variation="solid" class="mr-2 -ml-1 w-5 h-5"></ArrowPathRoundedSquare>
								Loop{player.loop === 2 ? ' Track' : player.loop === 1 ? ' Queue' : ''}
							</Button>
							<Button on:click={() => update('shuffle')} disabled={!player.connected || player.pauseTimeout || player.queue.length < 2}>
								<ArrowsRightLeft variation="solid" class="mr-2 -ml-1 w-5 h-5"></ArrowsRightLeft>
								Shuffle
							</Button>
						</ButtonGroup>
						<div class="inline-flex items-center justify-center mt-4">
							{#if volume !== 0}
								<SpeakerWave></SpeakerWave>
							{:else}
								<SpeakerXMark></SpeakerXMark>
							{/if}
							<Range on:pointerdown={() => updateVolume = false} on:pointerup={() => {update('volume', volume); updateVolume = true;}} on:input={updateVolumeFromInput} min={0} max={200} value={volume} class="mx-2 !w-2/5"></Range>
						</div>
					</div>
				{/if}
			</Card>
		{/await}
		<Card class="lg:max-w-sm !max-w-full">
			{#if player.textChannel && player.channel}
				<Heading tag="h2" customSize="text-lg font-semibold" class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Session</Heading>
				<List tag="ul" class="mb-2 space-y-1" list="none">
					<Li icon>
						<Hashtag class="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0"></Hashtag>
						{player.textChannel}
					</Li>
					<Li icon>
						<SpeakerWave class="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0"></SpeakerWave>
						{player.channel}
					</Li>
					{#if !settings?.stay?.enabled && (player.timeout || player.pauseTimeout)}
						<Li icon>
							<Clock class="w-4 h-4 mr-1.5 text-gray-400 flex-shrink-0"></Clock>
							Leaving in {msToTimeString(msToTime((player.timeout || player.pauseTimeout) - Date.now()))}
						</Li>
					{/if}
				</List>
				<Heading tag="h2" customSize="text-lg font-semibold" class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Filters</Heading>
				<Toggle class="cursor-pointer" checked={player.filters?.bassboost} on:change={() => update('bassboost', !player.filters?.bassboost)}>Bass Boost</Toggle>
				<Toggle class="my-2 cursor-pointer" checked={player.filters?.nightcore} on:change={() => update('nightcore', !player.filters?.nightcore)}>Nightcore</Toggle>
			{/if}
			<Heading tag="h2" customSize="text-lg font-semibold" class="mb-2 text-lg font-semibold text-gray-900 dark:text-white">Settings</Heading>
			{#each Object.keys(settings) as key, i}
				<Toggle class={`${i !== 0 ? 'mt-2 ' : ''}${['autolyrics', 'smartqueue'].includes(key) && (Number(guild?.permissions ?? 0) & 0x20) === 0 ? 'cursor-not-allowed' : 'cursor-pointer'}`} checked={settings[key].enabled} id={key} on:change={settingsToggled} disabled={['autolyrics', 'smartqueue'].includes(key) && (Number(guild?.permissions ?? 0) & 0x20) === 0}>{$featureMap[key].name}</Toggle>
			{/each}
		</Card>
	</div>
	<div class="w-full lg:w-3/4 h-min space-y-4">
		<Card size="xl" padding="xl">
			<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white mb-4">
				{#if !player?.connected}
					Start a Session
				{:else}
					Add to Queue
				{/if}
			</h5>
			<form class="flex gap-1" action="#" on:submit={event => {event.preventDefault(); addTrack(event.target[0].value, event.target[0]);}}>
				<Input type="text" size="md" placeholder="YouTube search query or a link from Spotify or YouTube" disabled={addingTrack}></Input>
				<Button type="submit" class="!p-2.5" disabled={addingTrack}>
					{#if addingTrack}
						<Spinner size="4" class="w-5 h-5" color="white"></Spinner>
					{:else if !player?.connected}
						<ChevronDoubleRight class="w-5 h-5"></ChevronDoubleRight>
					{:else}
						<Plus class="w-5 h-5"></Plus>
					{/if}
				</Button>
			</form>
		</Card>
		<Card class={queue.length === 0 ? 'text-center items-center justify-center' : ''} size="xl" padding="xl">
			{#if queue.length === 0}
				<div class="py-24">
					<PendingAction icon={EllipsisHorizontalCircle} title="Queue is empty" subtitle="Add some songs to get started!" />
				</div>
			{:else}
				<div class="flex justify-between items-center mb-4">
					<h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">Queue</h5>
					{player?.queue?.length ?? '0'} track{player?.queue?.length === 1 ? '' : 's'} • {getQueueDuration(player?.queue ?? [])}
				</div>
				<div class="container inline-flex mx-auto mb-2">
					<Search size="md" bind:value on:input={e => search(value)}></Search>
					<Select on:change={updatePerPage} class="ml-1 !w-1/12" placeholder="per page" value={perPage} items={[5, 10, 15, 20, 25].map(n => ({ value: n, name: n.toString() }))}></Select>
				</div>
				<Listgroup class="dark:!bg-transparent w-full">
					{#if paginatedQueue.length === 0}
						<div class="col-span-full text-center w-full p-8">
							<PendingAction icon={MagnifyingGlass} title="No tracks found" subtitle="Try narrowing your search criteria." />
						</div>
					{:else}
						{#each paginatedQueue[page - 1] as track}
							<ListgroupItem>
								<div class="flex items-center space-x-4">
									<Avatar src={track.requesterAvatar ? `https://cdn.discordapp.com/avatars/${track.requesterId}/${track.requesterAvatar}.png` : ''} class="flex-shrink-0">{getInitials(track.requesterTag)}</Avatar>
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium text-gray-900 truncate dark:text-white">
											{track.info.title}
										</p>
										<p class="text-sm text-gray-500 truncate dark:text-gray-400">
											{track.info.author}
										</p>
										<Badge color="dark" class="mt-1 mr-1">
											<Hashtag class="mr-1 w-3 h-3" variation="solid"></Hashtag>
											{player.queue.indexOf(track) + 1}
										</Badge>
										<Badge color="dark" class="mt-1 mr-1">
											<User class="mr-1 w-3 h-3" variation="solid"></User>
											{track.requesterTag}
										</Badge>
										{#if track.info.isStream}
											<Badge color="red">
												<Signal class="mr-1 w-3 h-3" variation="solid"></Signal>
												Live
											</Badge>
										{:else}
											<Badge color="dark">
												<Clock class="mr-1 w-3 h-3" variation="solid"></Clock>
												{msToTimeString(msToTime(track.info.length), true)}
											</Badge>
										{/if}
									</div>
									<div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
										<ButtonGroup>
											{#if track.requesterId === user.id || (Number(guild?.permissions ?? 0) & 0x20) !== 0 || $managerMode}
												<Button color="red" on:click={() => update('remove', player.queue.indexOf(track))}>
													<XMark class="w-5 h-5 mr-2"></XMark>
													Remove{track.requesterId !== user.id ? ' forcefully' : ''}
												</Button>
											{/if}
											<Button color="blue" href={track.info.uri} target="_blank">
												<ArrowTopRightOnSquare class="w-5 h-5 mr-2"></ArrowTopRightOnSquare>
												Link
											</Button>
										</ButtonGroup>
									</div>
								</div>
							</ListgroupItem>
						{/each}
					{/if}
				</Listgroup>
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
			{/if}
		</Card>
	</div>
</div>
<br>
<div class="container mx-auto">
	<Footer {version} />
</div>
<br>
