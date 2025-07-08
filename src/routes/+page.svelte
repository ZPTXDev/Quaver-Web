<svelte:head>
	<title>Quaver</title>
</svelte:head>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { DiscordLogo } from '$images';
	import { state as states } from '$lib/states.svelte';
	import { Button, DarkMode, Spinner } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { Logo } from '$components/icons';

	let { data }: { data: PageData } = $props();
	let code = page.url.searchParams.get('code'), guildId = page.url.searchParams.get('guild_id');
	let authURL = $state(''), connected = $state(false);
	states.manualLoading = false;

	async function connectHandler() {
		if (data.token) {
			if (guildId) {
				return goto(`/guild/${guildId}`);
			}
			if (data.redirect) {
				return goto(`/guild/${data.redirect}`);
			}
			return goto('/dashboard');
		}
		if (code) exchange();
		return true;
	}
	function exchange() {
		states.socket.emit(
			'exchange',
			[code, location.origin],
			async (response: { status: string; encryptedToken: string }) => {
				if (response.status !== 'success') return goto('/');
				const result = await fetch('/authenticate', {
					method: 'POST',
					body: JSON.stringify({ token: response.encryptedToken }),
					headers: { 'content-type': 'application/json' },
				});
				const json = await result.json();
				if (json.success) return(goto('/dashboard'));
				return goto('/');
			}
		);
	}
	onMount(async () => {
		authURL = `https://discord.com/api/oauth2/authorize?client_id=${env.PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${page.url.origin}&response_type=code&scope=identify%20guilds&prompt=none`;
		if (states.socket.connected) {
			connected = true;
			await connectHandler();
		} else {
			states.socket.once('connect', async () => {
				const res = await connectHandler();
				if (!res) return;
				connected = true;
			});
		}
	});
</script>

<div class="h-screen flex flex-col items-center justify-center">
	<div class="relative w-full h-full overflow-hidden">
		<div
			class="absolute inset-0 bg-gradient-to-br from-secondary-300 via-secondary-500 to-secondary-700 animate-gradient bg-[length:400%_400%]"
		></div>
		<div class="relative z-10 flex flex-col items-center justify-center h-full">
			<div
				class="bg-accent-200/80 dark:bg-accent-dark-200/80 p-4 sm:p-8 sm:rounded-xl relative max-sm:w-full max-sm:h-full max-sm:flex max-sm:items-center max-sm:justify-center md:max-w-full sm:shadow-2xl sm:min-w-md">
				<div class="flex flex-col text-900 gap-1 items-center">
					<h1 class="text-3xl text-center font-bold tracking-tight items-center flex flex-col gap-4">
						<span class="inline-block h-12 w-12">
								<Logo />
						</span>
						Welcome back!
					</h1>
					<h2 class="tracking-tight">
						Sign in to continue to Quaver's Dashboard
					</h2>
					<div class="flex flex-row mt-6 justify-center w-full min-w-xs">
						<Button href={code || !connected ? '' : authURL} class="text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center align-middle mx-auto w-full py-3 text-sm text-white !bg-[#5865F2] hover:!bg-[#3b5998] focus:!ring-[#5865F2]/50 dark:focus:!ring-[#5865F2]/55 rounded-lg{code || !connected ? ' cursor-not-allowed opacity-50' : ''}">
							{#if !code && connected}
								<img src={DiscordLogo} class="mr-2 -ml-1 w-4 h-4" alt="Discord Logo" />
								Sign in with Discord
							{:else}
								<Spinner size="4" class="mr-2 -ml-1 !fill-text-900 dark:!fill-text-dark-900 !text-700" />
								{code ? 'Confirming your identity...' : 'Connecting to Quaver...'}
							{/if}
						</Button>
					</div>
				</div>
			</div>
		</div>
		<DarkMode class="absolute hidden" />
	</div>
</div>
