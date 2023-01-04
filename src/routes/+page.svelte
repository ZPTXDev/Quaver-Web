<svelte:head>
    <title>Quaver</title> 
</svelte:head>

<script lang="ts">
	import { page } from '$app/stores';
	import { env } from '$env/dynamic/public';
	import discord from '$lib/images/discord.svg';
	import logo from '$lib/images/logo.svg';
	import { manualLoading } from '$lib/loading';
	import { socket } from '$lib/socket';
	import { Button, Card, Spinner } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
    let code = $page.url.searchParams.get('code');
    export let data: PageData;
    let authURL = '';
    $: connected = false;
    $manualLoading = false;
    function exchange() {
        $socket.emit(
            'exchange',
            [code, location.origin],
            (response: { status: string; encryptedToken: string }) => {
                if (response.status !== 'success') location.replace('/');
                fetch('/authenticate', { method: 'POST', body: JSON.stringify({ token: response.encryptedToken }), headers: { 'content-type': 'application/json' } })
                    .then(res => res.json())
                    .then(json => {
                        if (json.success) {
                            location.replace('/dashboard');
                        }
                        else {
                            location.replace('/');
                        }
                    })
                return;
            }
        );
    }
    onMount(() => {
        connected = $socket.connected;
        authURL = `https://discord.com/api/oauth2/authorize?client_id=${env.PUBLIC_DISCORD_CLIENT_ID}&redirect_uri=${$page.url.origin}&response_type=code&scope=identify%20guilds&prompt=none`;
        if (!$socket.connected) {
            $socket.once('connect', () => {
                // since there's a token cookie, we'll forward user to /dashboard
                if (data.token) location.replace('/dashboard');
                // since there's a way to authenticate, we'll reload
                if (code) exchange();
                // there's nothing else so let's just indicate we connected
                connected = true;
            });
        }
        if (connected) {
            if (data.token) location.replace('/dashboard');
            if (code) exchange();
        }
    });
</script>

<div class="h-screen flex items-center justify-center">
    <Card class="w-full">
        <div class="text-xl text-center font-medium text-gray-900 dark:text-white p-0">
            <img
                src={logo}
                class="inline-block mr-2 h-6 sm:h-9"
                alt="Quaver Logo"
            />
            <span class="inline-block">Quaver</span>
        </div>
        <br>
        <Button href={code || !connected ? '' : authURL} btnClass="text-center font-medium focus:ring-4 focus:outline-none inline-flex items-center justify-center px-5 py-2.5 text-sm text-white bg-[#5865F2] hover:bg-[#3b5998]/90 focus:ring-[#5865F2]/50 dark:focus:ring-[#5865F2]/55 rounded-lg{code || !connected ? ' cursor-not-allowed opacity-50' : ''}">
            {#if !code && connected}
                <img src={discord} class="mr-2 -ml-1 w-4 h-4" alt="Discord Logo" />
                Sign in with Discord
            {:else}
                <Spinner class="mr-2 -ml-1" size="4" color="white" />
                {code ? 'Authenticating...' : 'Connecting...'}
            {/if}
        </Button>
    </Card>
</div>
