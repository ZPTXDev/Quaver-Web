<svelte:head>
	<title>{guild.name ?? "Loading..."} | Quaver</title>
</svelte:head>

<script lang="ts">
	import { onMount } from 'svelte';
	import { state as states } from '$lib/states.svelte';
	import { goto } from '$app/navigation';
	import {
		errorToast,
		fetchGuilds,
		fetchUser,
		friendlyTimeString, getInitials,
		hasManageServerPermissions as hasManageServerPermissionsUtil, infoToast,
		join,
		lazy, preload,
		request,
		signout, successToast,
		type WebGuild,
		type WebUser
	} from '$lib/util';
	import { featureMap, initialWebUserState, toastOptions } from '$lib/constants';
	import type { PageData } from './$types';
	import { env } from '$env/dynamic/public';
	import { Navbar, TrackCard } from '$components';
	import { Pause, Play, Snooze } from '$components/icons';
	import { Avatar, Checkbox, Dropdown, DropdownDivider, DropdownGroup, DropdownHeader, DropdownItem, Toggle, Tooltip } from 'flowbite-svelte';
	import {
		AdjustmentsVerticalOutline,
		AngleRightOutline,
		ArrowsRepeatOutline,
		ArrowsRepeatCountOutline,
		BackwardStepSolid,
		CloseOutline,
		ForwardStepSolid,
		ListMusicOutline,
		MusicOutline,
		ShuffleOutline,
		VolumeDownOutline,
		VolumeMuteOutline,
		VolumeUpOutline, SearchOutline
	} from 'flowbite-svelte-icons';
	import { msToTime, msToTimeString } from '@zptxdev/zptx-lib';
	import RangeSlider from 'svelte-range-slider-pips';
	import { SvelteDate } from 'svelte/reactivity';
	import ColorThief from 'colorthief';
	import chroma from 'chroma-js';
	import 'simplebar';
	import 'simplebar/dist/simplebar.min.css';
	import { SvelteToast } from '@zerodevx/svelte-toast';

	let { data }: { data: PageData } = $props();
	const colorThief = new ColorThief();
	let positionUpdateInterval: any;
	let date = new SvelteDate();
	let guild: WebGuild = $state({} as WebGuild);
	let user: WebUser = $state(initialWebUserState);
	let addTrackLoading = $state(false);
	let addTrackValue = $state('');
	let queueSearchValue = $state('');
	let queueSearchFilterIds = $state([] as string[]);
	let player: any = $state({
		connected: false,
		playing: {
			nothingPlaying: true,
		},
		paused: true,
		loop: 0,
		volume: 100,
	});
	let settings: any = $state({});
	let position = $state({
		current: 0,
		lastKnown: 0,
		dragging: false,
	});
	let currentVolume = $state(-1);
	let lyrics = $state({
		noHits: false,
		loading: false,
		text: [] as { text: string, time: number }[],
		artist: '',
		album: '',
		title: '',
		duration: 0,
		lastScrolledElementId: '',
		color: {
			bg: '',
			text: '',
		},
	});
	let loading = $state(true);

	let inactiveLessTimeouts = $derived(!player.connected || player.playing?.nothingPlaying);
	let hasTimeout = $derived(player.timeout || player.pauseTimeout);
	let inactive = $derived(inactiveLessTimeouts || hasTimeout);
	let inVoiceChannel = $derived(player.connected && player.channel && player.textChannel);
	let leavingInMs = $derived((player.timeout || player.pauseTimeout) - date.getTime());
	let leavingIn = $derived(friendlyTimeString(msToTime(leavingInMs)));
	let hasManageServerPermissions = $derived(hasManageServerPermissionsUtil(guild?.permissions));
	let hasTrackPermissions = $derived(
		player.playing.track?.requesterId === user.id
		|| hasManageServerPermissions
	);
	let hasVoteSkipped = $derived(!inactive && player.playing.skip?.users?.includes(user.id))
	let volume = $derived(player.volume);
	let queue: any[] = $derived(player.queue?.filter((track: any) => (
		!queueSearchValue
		|| track.info.title.toLowerCase().includes(queueSearchValue.toLowerCase()
		|| track.info.author.toLowerCase().includes(queueSearchValue.toLowerCase())))
			&& (queueSearchFilterIds.length === 0 || queueSearchFilterIds.includes(track.requesterId))
	) ?? []);
	let lyricsMetaMatchesTrack = $derived(
		player.playing.track?.info.title === lyrics.title
		&& player.playing.track?.info.author === lyrics.artist
		&& player.playing.track?.pluginInfo?.albumName === lyrics.album
		&& Math.round(player.playing.track?.info.length / 1000) === lyrics.duration,
	);
	let lyricsExistsForTrack = $derived(
		lyrics.text.length > 0
		&& lyricsMetaMatchesTrack,
	);
	let lyricsUnsynced = $derived(
		!lyricsExistsForTrack
		|| !lyrics.text.some((line: { text: string, time: number }) => line.time !== 0)
			? 'full'
			: lyrics.text.some((line: { text: string, time: number }) => line.time !== 0)
			&& lyrics.text.filter((line: { text: string, time: number }) => line.time === 0 && line.text !== '').length > 0
				? 'partial'
				: false,
	);
	let uniqueRequesterTracks = $derived(
		(player.queue ?? []).filter((value, index, self) =>
			self.findIndex(v => v.requesterId === value.requesterId) === index),
	);

	function queueSearchFilterUpdated(event: Event) {
		if (!(event.target instanceof HTMLInputElement)) return;
		const value = event.target.value;
		if (event.target.checked) {
			queueSearchFilterIds.push(value);
		} else {
			const index = queueSearchFilterIds.indexOf(value);
			if (index > -1) {
				queueSearchFilterIds.splice(index, 1);
			}
		}
	}
	async function getLyrics() {
		if (inactiveLessTimeouts || player.playing.track?.info.isStream) return;
		if (lyrics.loading || lyricsExistsForTrack || lyricsMetaMatchesTrack && lyrics.noHits) return;
		lyrics.loading = true;
		lyrics.noHits = false;
		lyrics.artist = player.playing.track?.info.author;
		lyrics.album = player.playing.track?.pluginInfo?.albumName;
		lyrics.title = player.playing.track?.info.title;
		lyrics.duration = Math.round(player.playing.track?.info.length / 1000);
		const LYRICS_URL = `https://lrclib.net/api/get?track_name=${encodeURIComponent(player.playing.track?.info.title)}&artist_name=${encodeURIComponent(player.playing.track?.info.author)}&album_name=${encodeURIComponent(player.playing.track?.pluginInfo?.albumName ?? '')}&duration=${Math.round(player.playing.track?.info?.length / 1000)}`;
		try {
			const response = await fetch(LYRICS_URL);
			if (!response.ok) {
				lyrics.noHits = true;
				lyrics.loading = false;
				return;
			}
			const data = await response.json();
			if (data.code) {
				lyrics.noHits = true;
				if (data.code !== 404) console.error('Error fetching lyrics:', data);
				lyrics.loading = false;
				return;
			}
			if (data?.syncedLyrics || data.plainLyrics) {
				lyrics.lastScrolledElementId = '';
				if (data.syncedLyrics) {
					lyrics.text = data.syncedLyrics.trimEnd().split('\n').map((line: string) => {
						const match = line.trimEnd().match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?]\s*(.*)$/);
						if (match) {
							const minutes = parseInt(match[1], 10);
							const seconds = parseInt(match[2], 10);
							const milliseconds = match[3] ? parseInt(match[3], 10) : 0;
							return {
								text: match[4],
								time: (minutes * 60 + seconds) * 1000 + milliseconds,
							};
						}
						return { text: line, time: 0 };
					});
				} else {
					lyrics.text = data.plainLyrics.trimEnd().split('\n').map((line: string) => ({
						text: line.trimEnd(),
						time: 0,
					}));
				}
			} else {
				lyrics.noHits = true;
			}
		} catch (error) {
			console.error('Error fetching lyrics:', error);
			lyrics.noHits = true;
		} finally {
			lyrics.loading = false;
		}
	}
	function lyricLineColor(line: { text: string, time: number }): string {
		if (!lyrics.text || lyrics.text.length === 0) return 'text-500';
		const nextLine: { text: string, time: number } | undefined = lyrics.text.find((l: { text: string, time: number }) => l.time > line.time);
		if (!nextLine || position.current >= line.time && position.current < nextLine.time) {
			return 'opacity-100';
		} else if (position.current >= line.time) {
			return 'opacity-40';
		}
		return 'opacity-60';
	}
	async function artworkImgLoaded(event: Event) {
		if (!(event.target instanceof HTMLImageElement)) return;
		const img = event.target;
		if (!img.complete) return;
		const color = colorThief.getColor(img);
		const chromaColor = chroma(color);
		const blackContrast = chroma.contrastAPCA('black', chromaColor);
		const whiteContrast = chroma.contrastAPCA('white', chromaColor);
		lyrics.color.bg = `background-color: ${chromaColor.hex()}`;
		if (blackContrast >= 45) {
			lyrics.color.text = 'color: black';
			return;
		}
		if (whiteContrast <= -45) {
			lyrics.color.text = 'color: white';
			return;
		}
		lyrics.color.text = `color: ${blackContrast - 106 > whiteContrast - -108 ? 'black' : 'white'}`;
	}
	function addTrack(event: SubmitEvent) {
		if (!(event.target instanceof HTMLFormElement) || !(event.target[0] instanceof HTMLInputElement)) return;
		const value = event.target[0].value;
		if (addTrackLoading || !value) return;
		addTrackLoading = true;
		states.socket.emit('update', [guild.id, { type: 'add', value }], (response: { status: string }) => {
			if (response.status === 'success') {
				addTrackValue = '';
				successToast('Track added to the queue successfully.');
			}
			else {
				switch (response.status) {
					case 'error-no-results':
						errorToast('No results found for the provided query.');
						break;
					default:
						errorToast('An error occurred while adding the track.');
						break;
				}
			}
			addTrackLoading = false;
		});
	}
	function pausePlayPlayer() {
		if (inactive) return;
		player.paused = !player.paused;
		states.socket.emit('update', [guild.id, { type: 'paused', value: player.paused }], (response: { status: string }) => {
			if (response.status !== 'success') {
				player.paused = !player.paused; // revert the pause state
				errorToast(`Failed to ${player.paused ? 'pause' : 'resume'} the player.`);
				return;
			}
		});
	}
	function shuffle() {
		if (inactive || queue.length <= 1) return;
		states.socket.emit('update', [guild.id, { type: 'shuffle' }], (response: { status: string }) => {
			if (response.status !== 'success') errorToast('Failed to shuffle the queue.');
		});
	}
	function rewind() {
		if ((player.playing.track?.requesterId !== user.id && (Number(guild?.permissions ?? 0) & 0x20) === 0) || player.playing.duration === 0 || player.playing.nothingPlaying || player.playing.track?.info.isStream || player.pauseTimeout) return;
		position.dragging = true;
		position.current = 0;
		if (player.connected && !player.playing?.nothingPlaying) {
			states.socket.emit('update', [guild.id, { type: 'seek', value: 0 }], (response: { status: string }) => {
				if (response.status !== 'success') {
					position.current = position.lastKnown;
					position.dragging = false;
					errorToast('Failed to rewind the track.');
					return;
				}
				position.lastKnown = position.current;
				position.dragging = false;
			});
		}
	}
	function skip() {
		if (hasVoteSkipped) return;
		states.socket.emit('update', [guild.id, { type: 'skip' }], (response: { status: string }) => {
			if (response.status !== 'success') errorToast('Failed to skip the track.');
		});
	}
	function loop() {
		if (inactive) return;
		player.loop = (player.loop + 1) % 3;
		states.socket.emit('update', [guild.id, { type: 'loop', value: player.loop }], (response: { status: string }) => {
			if (response.status !== 'success') {
				player.loop = (player.loop - 1 + 3) % 3; // revert the loop state
				errorToast(`Failed to ${player.loop === 0 ? 'disable looping' : player.loop === 2 ? 'enable single track loop' : 'enable queue loop'}.`);
				return;
			}
		});
	}
	function mute() {
		if (!inVoiceChannel) return;
		currentVolume = player.volume === 0 ? 100 : 0
		states.socket.emit('update', [guild.id, { type: 'volume', value: currentVolume }], (response: { status: string }) => {
			if (response.status !== 'success') {
				errorToast(`Failed to ${currentVolume === 0 ? 'mute' : 'unmute'} the player.`);
				currentVolume = -1;
				return;
			}
			player.volume = currentVolume;
			currentVolume = -1;
		});
	}
	function bassboostToggle() {
		if (inactive) return;
		player.filters.bassboost = !player.filters.bassboost;
		states.socket.emit('update', [guild.id, { type: 'bassboost', value: player.filters.bassboost }], (response: { status: string }) => {
			if (response.status !== 'success') {
				errorToast(`Failed to ${player.filters.bassboost ? 'enable' : 'disable'} Bass Boost.`);
				player.filters.bassboost = !player.filters.bassboost; // revert the bassboost state
				return;
			}
			infoToast(`<div class="flex flex-col gap-1"><span>Bass Boost <strong>${player.filters.bassboost ? 'enabled' : 'disabled'}</strong>.</span><span class="text-xs">Filters may take a few seconds to apply.</span></div>`);
		});
	}
	function nightcoreToggle() {
		if (inactive) return;
		player.filters.nightcore = !player.filters.nightcore;
		states.socket.emit('update', [guild.id, { type: 'nightcore', value: player.filters.nightcore }], (response: { status: string }) => {
			if (response.status !== 'success') {
				errorToast(`Failed to ${player.filters.nightcore ? 'enable' : 'disable'} Nightcore.`);
				player.filters.nightcore = !player.filters.nightcore; // revert the nightcore state
				return;
			}
			infoToast(`<div class="flex flex-col gap-1"><span>Nightcore <strong>${player.filters.nightcore ? 'enabled' : 'disabled'}</strong>.</span><span class="text-xs">Filters may take a few seconds to apply.</span></div>`);
		});
	}
	function settingsToggle(event: Event) {
		if (!event.target || !(event.target instanceof HTMLInputElement)) return;
		const enabled = event.target.checked;
		const id = event.target.id;
		if (enabled && !settings[id].whitelisted) {
			event.target.checked = false;
			errorToast(`You need <strong>Quaver Premium</strong> to enable ${featureMap[id].name}.`);
			return;
		}
		states.socket.emit('update', [guild.id, { type: `${featureMap[id].id}Feature`, value: enabled }], (response: { status: string }) => {
			if (response.status !== 'success' && event.target instanceof HTMLInputElement) {
				event.target.checked = settings[id].enabled;
				errorToast(`Failed to ${enabled ? 'enable' : 'disable'} ${featureMap[id].name}.`);
				return;
			}
			settings[id].enabled = enabled;
		});
	}
	function positionFormatter(value: number): string {
		return msToTimeString(msToTime(value), true);
	}
	function getPosition(playing: any): number {
		return playing.nothingPlaying ? 0 : playing.elapsed;
	}
	function positionUpdateIntervalFn() {
		if (!inactive && !position.dragging) {
			position.current += 1000;
		}
	}
	function positionDragStarted(event: any) {
		position.dragging = true;
		position.current = parseInt(event.detail.value);
	}
	function positionDragChanged(event: any) {
		position.dragging = true;
		position.current = parseInt(event.detail.value);
	}
	function positionDragStopped(event: any) {
		position.dragging = true;
		position.current = parseInt(event.detail.value);
		if (player.connected && !player.playing?.nothingPlaying) {
			states.socket.emit('update', [guild.id, { type: 'seek', value: parseInt(event.detail.value) }], (response: { status: string }) => {
				if (response.status !== 'success') {
					position.current = position.lastKnown;
					position.dragging = false;
					return;
				}
				position.lastKnown = position.current;
				position.dragging = false;
			});
		}
	}
	function volumeFormatter(value: number): string {
		return `${value}%`;
	}
	function volumeDragStarted(event: any) {
		currentVolume = parseInt(event.detail.value);
	}
	function volumeDragChanged(event: any) {
		currentVolume = parseInt(event.detail.value);
	}
	function volumeDragStopped(event: any) {
		currentVolume = parseInt(event.detail.value);
		states.socket.emit('update', [guild.id, { type: 'volume', value: parseInt(event.detail.value) }], (response: { status: string }) => {
			if (response.status !== 'success') {
				player.volume = parseInt(event.detail.startValue);
				currentVolume = -1;
				return;
			}
			player.volume = parseInt(event.detail.value);
			currentVolume = -1;
		});
	}
	function scrollChildIntoView(container: HTMLElement, target: HTMLElement) {
		const containerRect = container.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();

		const containerScrollTop = container.scrollTop;
		const targetOffsetTop = targetRect.top - containerRect.top;

		const offsetToCenter =
			targetOffsetTop - (containerRect.height / 2) + (targetRect.height / 2);

		container.scrollTo({
			top: containerScrollTop + offsetToCenter,
			behavior: 'smooth'
		});
	}

	$effect(() => {
		const interval = setInterval(() => {
			date.setTime(Date.now());
			if (!inactive && !position.dragging && lyricsExistsForTrack) {
				const currentTime = position.current;
				lyrics.text.forEach((line, index) => {
					const nextLine = lyrics.text[index + 1];
					if (index !== 0 && line.time === 0) return;
					if (nextLine && currentTime >= line.time && currentTime < nextLine.time && lyrics.lastScrolledElementId !== `lyricline-${index}`) {
						const lyricsContainer = document.querySelector<HTMLElement>(
							'#lyrics .simplebar-content-wrapper'
						);
						const lyricElement = document.getElementById(`lyricline-${index}`);
						if (lyricsContainer && lyricElement) {
							// lyricElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
							scrollChildIntoView(lyricsContainer, lyricElement);
							lyrics.lastScrolledElementId = `lyricline-${index}`;
						}
					}
				});
			}
		}, 100);

		return () => {
			clearInterval(interval);
		};
	});

	onMount(async () => {
		if (!states.socket.connected) {
			return goto(`/?guild_id=${data.guildId}`);
		}
		try {
			({ user } = await fetchUser(states.socket, data.token as string));
			states.manualLoading = false;
			let { guilds } = await fetchGuilds(states.socket, data.token as string);
			if (!guilds?.some((g) => g.id === data.guildId)) {
				return goto('/dashboard');
			}
			guild = guilds.find((g) => g.id === data.guildId) as WebGuild;
			if (!guild.botInGuild) {
				if ((Number(guild.permissions) & 0x20) !== 0) {
					return goto(
						`https://discord.com/api/oauth2/authorize?client_id=${env.PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${location.origin}&response_type=code&scope=applications.commands%20bot&permissions=3459072&guild_id=${data.guildId}`
					);
				}
				return goto('/dashboard');
			}
			await join(states.socket, data.guildId);
			const p = await request(states.socket, guild.id, 'player');
			if (p.response !== null) player = p.response;
			const s = await request(states.socket, guild.id, 'settings');
			if (s.response) settings = s.response;
			loading = false;
		}
		catch (error) {
			await signout();
			return goto('/');
		}
		finally {
			if (!player.playing?.nothingPlaying) {
				position.current = getPosition(player.playing);
				position.lastKnown = position.current;
				if (!player.paused) {
					clearInterval(positionUpdateInterval);
					positionUpdateInterval = setInterval(positionUpdateIntervalFn, 1000);
				}
				await getLyrics();
			}
			states.socket.on('intervalTrackUpdate', playing => {
				player.playing = playing;
				player.connected = true;
				if (!position.dragging && !player.paused && (position.lastKnown !== getPosition(playing) || position.lastKnown > position.current)) {
					position.current = getPosition(playing);
					position.lastKnown = position.current;
					clearInterval(positionUpdateInterval);
					positionUpdateInterval = setInterval(positionUpdateIntervalFn, 1000);
				} else if (position.dragging) {
					position.lastKnown = getPosition(playing);
				}
				getLyrics();
			});
			states.socket.on('queueUpdate', q => {
				player.queue = q;
				queueSearchFilterIds = queueSearchFilterIds.filter(id => uniqueRequesterTracks.some(track => track.requesterId === id));
			});
			states.socket.on('filterUpdate', filters => {
				player.filters = filters;
			});
			states.socket.on('loopUpdate', loop => {
				player.loop = loop;
			});
			states.socket.on('pauseUpdate', paused => {
				player.paused = paused;
				if (paused) {
					clearInterval(positionUpdateInterval);
				} else {
					position.lastKnown = getPosition(player.playing);
					position.current = position.lastKnown;
					clearInterval(positionUpdateInterval);
					positionUpdateInterval = setInterval(positionUpdateIntervalFn, 1000);
				}
			});
			states.socket.on('volumeUpdate', vol => {
				player.volume = vol;
			});
			states.socket.on('channelUpdate', channel => {
				player.channel = channel;
			});
			states.socket.on('textChannelUpdate', textChannel => {
				player.textChannel = textChannel;
			});
			states.socket.on('timeoutUpdate', timeout => {
				player.timeout = timeout;
			});
			states.socket.on('pauseTimeoutUpdate', pauseTimeout => {
				player.pauseTimeout = pauseTimeout;
			});
			states.socket.on('playerDisconnect', () => {
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
				position.current = 0;
				position.lastKnown = 0;
				clearInterval(positionUpdateInterval);
			});
			states.socket.on('stayFeatureUpdate', state => {
				settings.stay.enabled = state.enabled;
			});
			states.socket.on('autoLyricsFeatureUpdate', state => {
				settings.autolyrics.enabled = state.enabled;
			});
			states.socket.on('smartQueueFeatureUpdate', state => {
				settings.smartqueue.enabled = state.enabled;
			});
		}
	});
</script>

{#snippet trackSearch(mobile = false)}
	<div class="relative w-full md:w-72 lg:w-96 {mobile ? 'md:hidden' : 'max-md:hidden'}">
		<form action="#" onsubmit={(e: SubmitEvent) => {e.preventDefault(); addTrack(e)}}>
			<div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
				<MusicOutline class="z-10 text-500 w-4.5 h-4.5" />
			</div>
			<input bind:value={addTrackValue} type="text" placeholder="Add songs..." class="input-class" disabled={addTrackLoading}>
			<div class="absolute inset-y-0 end-0 flex items-center pe-3 gap-1.5 h-full">
				<button type="reset">
					<CloseOutline class="text-500 w-4.5 h-full cursor-pointer{addTrackValue ? '' : ' hidden'}" onclick={() => addTrackValue = ''} />
				</button>
				<div class="h-4/7 w-0.5 background-300"></div>
				<button type="submit">
					<AngleRightOutline class="text-500 w-4.5 h-full cursor-pointer" />
				</button>
			</div>
		</form>
	</div>
{/snippet}
{#snippet lyricLine(line: { text: string, time: number }, index: number)}
	<span id="lyricline-{index}" class="transition-opacity {lyricLineColor(line)}">{line.text}</span>
{/snippet}
{#snippet volumeSlider(mobile = false)}
	<button id="mute" class="transition {!inVoiceChannel ? 'button-disabled-class' : 'button-hover-class'} w-5 h-5 -mr-0.5" onclick={mute} disabled={!inVoiceChannel}>
		{#if (currentVolume !== -1 ? currentVolume : volume) >= 50}
			<VolumeUpOutline />
		{:else if (currentVolume !== -1 ? currentVolume : volume) > 0}
			<VolumeDownOutline />
		{:else}
			<VolumeMuteOutline />
		{/if}
	</button>
	<RangeSlider class="{mobile ? 'w-full' : 'max-w-24 w-24'} text-[10px] slider" range="min" float formatter={volumeFormatter} min={0} max={100} value={currentVolume !== -1 ? currentVolume : volume} disabled={!inVoiceChannel} on:start={volumeDragStarted} on:change={volumeDragChanged} on:stop={volumeDragStopped} />
{/snippet}
{#snippet queuePanel()}
	<div class="background-200 rounded-xl col-span-1 shadow-lg overflow-y-hidden max-md:aspect-square">
		<div class="flex flex-col gap-4 p-8 pb-4">
				<span class="text-900 font-semibold text-4xl">
					Queue
				</span>
			<div class="relative">
				<div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
					<SearchOutline class="text-500 w-4.5 h-4.5" />
				</div>
				<input bind:value={queueSearchValue} type="text" placeholder="Search queue..." class="input-class rounded-lg bg-[#C7BDCD] dark:bg-[#3A303F]" />
				<div class="absolute inset-y-0 end-0 flex items-center pe-3 gap-1.5 h-full">
					<CloseOutline class="text-500 w-4.5 h-full cursor-pointer{queueSearchValue ? '' : ' hidden'}" onclick={() => queueSearchValue = ''} />
					<div class="h-4/7 w-0.5 background-300"></div>
					<ListMusicOutline id="filter" class="text-500 w-4.5 h-full cursor-pointer outline-0" />
				</div>
			</div>
		</div>
		<div data-simplebar class="flex flex-col overflow-y-scroll pt-0 p-8 h-[calc(100%-150px)] md:h-[calc(100%-142px)] no-scrollbar">
			{#if !player.playing?.nothingPlaying}
				<TrackCard track={player.playing.track} position={0} guildId={guild.id} userId={user.id} {hasManageServerPermissions} />
				<div class="h-[1px] background-400 mx-auto my-4"></div>
				{#each queue as track, i}
					<TrackCard {track} position={i + 1} guildId={guild.id} userId={user.id} {hasManageServerPermissions} />
				{/each}
			{/if}
			{#if player.playing?.nothingPlaying || queue.length === 0}
				<div class="flex flex-col items-center justify-center text-center h-full{player.playing?.nothingPlaying ? ' mt-4' : ''}">
					<span class="text-900 font-semibold text-2xl">
						{player.playing?.nothingPlaying
							? "Nothing's playing right now"
							: queueSearchValue || queueSearchFilterIds.length > 0
								? "No results from your search"
								: "No more tracks in the queue"}
					</span>
					<span class="text-700 text-sm">
						{player.playing?.nothingPlaying
							? "Add some tracks to the queue to get started!"
							: queueSearchValue || queueSearchFilterIds.length > 0
								? "Try refining your search criteria."
								: "Add more tracks to keep it going!"}
					</span>
				</div>
			{/if}
		</div>
	</div>
{/snippet}
{#snippet lyricsPanel()}
	<div data-simplebar id="lyrics" style={player.connected && !hasTimeout && lyrics.color.bg ? lyrics.color.bg : ""} class="relative transition-colors duration-1000 {!player.connected || hasTimeout || !lyrics.color.bg ? 'background-200 ' : '' }rounded-xl col-span-1 lg:col-span-2 overflow-y-scroll shadow-lg max-md:aspect-square no-scrollbar{loading || inactive || lyrics.noHits || lyrics.loading ? ' full-height' : ''}">
		<div style={player.connected && !hasTimeout && lyrics.color.text ? lyrics.color.text : ""} class="transition-colors duration-1000 flex flex-col gap-8 text-4xl font-semibold {!player.connected || hasTimeout || !lyrics.color.text ? 'text-900 ' : ''}p-8 justify-center{loading || inactive || lyrics.noHits || lyrics.loading ? ' h-full text-center' : ''}">
			{#if loading}
				<span class="animate-pulse">
					Grabbing the details...
				</span>
			{:else if inactive}
				<span>
					Lyrics will appear here when a track is playing
				</span>
			{:else if lyrics.noHits}
				<span>
					No lyrics found for this track...
				</span>
				<span>:(</span>
			{:else if lyrics.loading}
				<span class="animate-pulse">
					Get ready to sing...
				</span>
			{:else if lyricsExistsForTrack}
				{#if lyricsUnsynced === 'full'}
					<span class="opacity-50 text-sm">
						Auto-scroll isn't available for these lyrics yet, sorry!
					</span>
				{:else if lyricsUnsynced === 'partial'}
					<span class="opacity-50 text-sm">
						Some part(s) of these lyrics aren't synced - auto-scroll may not work as expected.
					</span>
				{/if}
				{#each lyrics.text as line, i}
					{@render lyricLine(line, i)}
				{/each}
				<span class="opacity-50 text-sm">
					Lyrics provided by <a href="https://lrclib.net" target="_blank" rel="noopener noreferrer" class="opacity-80 hover:underline">LRCLIB</a>
				</span>
			{/if}
		</div>
	</div>
{/snippet}
{#snippet activeTrackCard()}
	<div class="w-full my-auto justify-self-start flex flex-row gap-4 truncate max-md:hidden">
		{#if !loading && !inactiveLessTimeouts && !player.pauseTimeout}
			<img crossorigin="anonymous" src="" use:lazy={player.playing.track?.info.artworkUrl} alt="Album Artwork" class="opacity-0 transition-opacity w-24 h-24 rounded-l-2xl object-cover shrink-0" onload={artworkImgLoaded} />
			<div class="flex flex-col justify-center truncate pe-4">
				<span class="text-900 font-semibold text-lg truncate">{player.playing.track?.info.title}</span>
				<span class="text-700 text-sm">{player.playing.track?.info.author}</span>
			</div>
		{:else if !settings?.stay?.enabled && hasTimeout || !player.connected || loading}
			<div class="flex flex-col justify-center truncate ps-8 pe-4">
						<span class="text-900 font-semibold inline-flex items-center gap-2 text-lg truncate">
							{#if loading || Object.keys(settings).length === 0}
								<div class="h-4 rounded-full background-700 w-32 animate-pulse"></div>
							{:else}
								{!settings?.stay?.enabled && hasTimeout ? "Idle" : "Sleeping"}
								<Snooze class="w-4 h-4 fill-text-900 dark:fill-text-dark-900" />
							{/if}
						</span>
				<span class="text-700 text-sm">
					{#if loading || Object.keys(settings).length === 0}
						<div class="h-3 rounded-full background-700 w-64 animate-pulse mt-2.5"></div>
					{:else if !settings?.stay?.enabled && hasTimeout}
						Quaver is leaving {leavingInMs > 1000 ? "in" : ""}
						<span class="font-semibold">{leavingInMs > 1000 ? leavingIn : "now"}</span>
					{:else if !player.connected}
						Play a song to get the party started!
					{/if}
				</span>
			</div>
		{/if}
	</div>
{/snippet}
{#snippet playerControls()}
	<div class="items-center my-auto flex flex-col gap-1 max-md:px-4 relative">
		<button id="settings" class="transition button-hover-class w-5 h-5 md:hidden absolute text-800 right-6 top-4.5 ">
			<AdjustmentsVerticalOutline />
		</button>
		<div class="flex flex-row items-center gap-3 mt-2 text-800">
			<button id="shuffle" class="transition {loading || inactive || queue.length <= 1 ? 'button-disabled-class' : 'button-hover-class'}" onclick={shuffle} disabled={loading || inactive || queue.length <= 1}>
				<ShuffleOutline class="w-6 h-10" />
			</button>
			<button id="rewind" class="transition {!hasTrackPermissions || inactive || player.playing.duration === 0 || player.playing.track?.info.isStream ? 'button-disabled-class' : 'button-hover-class'}" onclick={rewind} disabled={!hasTrackPermissions || inactive || player.playing.duration === 0 || player.playing.track?.info.isStream}>
				<BackwardStepSolid class="w-7 h-10" />
			</button>
			<button id="pauseplay" class="w-10 h-10 transition {inactive ? 'button-disabled-class' : 'button-hover-class'}" onclick={pausePlayPlayer} disabled={inactive}>
				{#if !player.paused && !hasTimeout}
					<Pause primaryClass="fill-text-200 dark:fill-text-dark-200" secondaryClass="fill-background-700 dark:fill-background-dark-700" />
				{:else}
					<Play primaryClass="fill-text-200 dark:fill-text-dark-200" secondaryClass="fill-background-700 dark:fill-background-dark-700" />
				{/if}
			</button>
			<button id="skip" class="transition {inactive || hasVoteSkipped ? 'button-disabled-class' : 'button-hover-class'}{hasVoteSkipped ? '!opacity-100 text-accent-600 dark:text-accent-dark-600' : ''} relative" onclick={skip} disabled={hasVoteSkipped}>
				<ForwardStepSolid class="w-7 h-10" />
				<span class="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 text-xs animate-pulse">
							{#if hasVoteSkipped}
								•
							{/if}
						</span>
			</button>
			<button id="loop" class="transition {inactive ? 'button-disabled-class' : 'button-hover-class'}{player.loop > 0 ? ' text-accent-600 dark:text-accent-dark-600' : ''} relative" onclick={loop} disabled={inactive}>
				{#if player.loop === 2}
					<ArrowsRepeatCountOutline class="w-6 h-10" />
				{:else}
					<ArrowsRepeatOutline class="w-6 h-10" />
				{/if}
				<span class="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 text-xs">
							{#if player.loop > 0}
								•
							{/if}
						</span>
			</button>
		</div>
		<div class="flex flex-row items-center w-full justify-center text-[13px] text-700">
				<span class="w-1/12 text-end">
					{#if player.playing?.track?.info.isStream}
						LIVE
					{:else}
						{msToTimeString(msToTime(player.playing.nothingPlaying ? 0 : position.current), true)}
					{/if}
				</span>
			<RangeSlider class="w-10/12 text-xs slider" range="min" float formatter={positionFormatter} min={0} max={player.playing.nothingPlaying || player.playing.track?.info.isStream ? 100 : player.playing.duration} value={player.playing.nothingPlaying ? 0 : player.playing.track?.info.isStream ? 100 : position.current} disabled={(player.playing.track?.requesterId !== user.id && (Number(guild?.permissions ?? 0) & 0x20) === 0) || player.playing.duration === 0 || inactive || player.playing.track?.info.isStream} on:start={positionDragStarted} on:change={positionDragChanged} on:stop={positionDragStopped} />
			<span class="w-1/12 text-start">
					{#if player.playing?.track?.info?.isStream}
						-:--
					{:else}
						{msToTimeString(msToTime(!player.playing?.nothingPlaying ? player.playing.duration : 0), true)}
					{/if}
					</span>
		</div>
	</div>
{/snippet}
{#snippet additionalControls()}
	<div class="flex flex-row items-center justify-end ms-auto me-6 max-md:hidden">
		<div class="flex flex-row items-center w-full text-800">
			<button id="settings" class="transition button-hover-class w-5 h-5 mr-2">
				<AdjustmentsVerticalOutline />
			</button>
			{@render volumeSlider()}
		</div>
	</div>
{/snippet}

<SvelteToast options={toastOptions} />

<Navbar {user} centerSnippet={trackSearch} />

<div class="px-4 flex flex-col gap-4 h-full md:h-[calc(100dvh-96px)] max-md:pb-32">
	<div class="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 grow md:h-[calc(100dvh-208px)]">
		<!-- for mobile view -->
		{@render trackSearch(true)}
		{@render queuePanel()}
		{@render lyricsPanel()}
	</div>
	<div class="md:container md:mx-auto max-md:w-full max-md:-ml-4 max-sm:px-8 max-md:px-16 h-24 flex flex-row gap-2 relative max-md:fixed max-md:bottom-4">
		<div class="background-200 w-full rounded-2xl grid grid-cols-1 md:grid-cols-3 justify-center shadow-lg">
			{@render activeTrackCard()}
			{@render playerControls()}
			{@render additionalControls()}
		</div>
	</div>
</div>

<Dropdown simple offset={10} triggeredBy="#filter" class="!dropdown-override">
	<DropdownHeader class="py-2">
		Filter by requester
	</DropdownHeader>
	<DropdownGroup class="!dropdown-group-override">
		{#each uniqueRequesterTracks.toSorted((a, b) => a.requesterTag.localeCompare(b.requesterTag)) as track}
			<DropdownItem class="!dropdown-item-override flex flex-row items-center gap-2">
				<Checkbox checked={queueSearchFilterIds.includes(track.requesterId)} value={track.requesterId} class="!h-full !w-full !checkbox-override focus:ring-0" onchange={queueSearchFilterUpdated} />
				{#if track.requesterAvatar}
					{#await preload(`https://cdn.discordapp.com/avatars/${track.requesterId}/${track.requesterAvatar}.png`) then source}
						<Avatar src={source} size="xs">
							{getInitials(track.requesterTag)}
						</Avatar>
					{/await}
				{/if}
				<span class="font-semibold tracking-tight text-black dark:text-white">{track.requesterTag}</span>
			</DropdownItem>
		{/each}
		{#if uniqueRequesterTracks.length === 0}
			<DropdownItem class="!dropdown-item-override !background-200 hover:!background-200 !text-900 hover:!text-900">
				The queue is empty.
			</DropdownItem>
		{/if}
	</DropdownGroup>
</Dropdown>
<Dropdown offset={15} simple triggeredBy="#settings" class="!dropdown-override">
	<DropdownHeader class="py-2">
		Filters
	</DropdownHeader>
	<DropdownItem class="!dropdown-item-override">
		<Toggle checked={player.filters?.bassboost} spanClass="!toggle-span-override" class="!toggle-override" onchange={bassboostToggle} disabled={inactive}>Bass Boost</Toggle>
	</DropdownItem>
	<DropdownItem class="!dropdown-item-override">
		<Toggle checked={player.filters?.nightcore} spanClass="!toggle-span-override" class="!toggle-override" onchange={nightcoreToggle} disabled={inactive}>Nightcore</Toggle>
	</DropdownItem>
	{#if !loading && Object.keys(settings).length > 0}
		<DropdownHeader class="py-2">
			Settings
		</DropdownHeader>
		{#each Object.keys(settings) as key}
			<DropdownItem class="!dropdown-item-override">
				<Toggle checked={settings[key].enabled} id={key} spanClass="!toggle-span-override" class="!toggle-override" onchange={settingsToggle} disabled={['autolyrics', 'smartqueue'].includes(key) && !hasManageServerPermissions || key === 'stay' && inactive}>{featureMap[key].name}</Toggle>
			</DropdownItem>
		{/each}
	{/if}
	<DropdownDivider class="!dropdown-divider-override md:hidden" />
	<div class="flex flex-row items-center px-4 py-2 md:hidden max-w-42 mx-auto">
		{@render volumeSlider(true)}
	</div>
</Dropdown>
<Tooltip class="!tooltip-override" arrow={false} triggeredBy="#shuffle">
	Shuffle queue
</Tooltip>
<Tooltip class="!tooltip-override" arrow={false} triggeredBy="#rewind">
	Rewind to start
</Tooltip>
<Tooltip class="!tooltip-override" arrow={false} triggeredBy="#pauseplay">
	{#if !player.paused && !hasTimeout}
		Pause
	{:else}
		Resume
	{/if}
</Tooltip>
<Tooltip class="!tooltip-override" arrow={false} triggeredBy="#loop">
	{#if player.loop === 2}
		Looping track
	{:else if player.loop === 1}
		Looping queue
	{:else}
		Loop
	{/if}
</Tooltip>
<Tooltip class="!tooltip-override" arrow={false} triggeredBy="#mute">
	{#if (currentVolume !== -1 ? currentVolume : volume) === 0}
		Unmute
	{:else}
		Mute
	{/if}
</Tooltip>
<Tooltip class="!tooltip-override" arrow={false} triggeredBy="#settings">
	Settings
</Tooltip>
<Tooltip class="!tooltip-override" arrow={false} triggeredBy="#skip">
	{#if hasVoteSkipped}
		Voted to skip
	{:else}
		Skip
	{/if}
</Tooltip>