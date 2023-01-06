<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { transitionParams } from '$lib/stores';
	import { Button, CloseButton, Drawer } from 'flowbite-svelte';
	import { ArrowLongRight, MusicalNote } from 'svelte-heros-v2';

    export let hidden: boolean;
</script>

<Drawer transitionType="fly" transitionParams={$transitionParams} bind:hidden={hidden}>
	<div class="flex items-center">
		<h5
		  id="drawer-label"
		  class="inline-flex items-center mb-4 text-base font-semibold text-amber-400">
		  <MusicalNote class="w-5 h-5 mr-2" variation="solid"></MusicalNote>
		  Quaver Premium
		</h5>
		<CloseButton on:click={() => (hidden = true)} class="mb-4 dark:text-white"/>
	</div>
		<p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
			Quaver Premium is a premium subscription that gives you access to exclusive features and benefits.
			Unlock features such as <strong>Smart Queue</strong>, <strong>Auto Lyrics</strong>, <strong>24/7 Mode</strong> and more!
		</p>
		<Button gradient color="purpleToPink" href={env.PUBLIC_PREMIUM_URL} class="w-full">Get Premium <ArrowLongRight class="w-4 h-4 ml-1"></ArrowLongRight></Button>
</Drawer>
