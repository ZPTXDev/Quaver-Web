<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { navigating, page } from '$app/stores';
	import { loadingHeadline, manualLoading, tips } from '$lib/stores';
	import { Spinner } from 'flowbite-svelte';
	import { toasts } from 'svelte-toasts';
	import { fade } from 'svelte/transition';
	import '../app.postcss';
	
	if ($page.url.pathname !== '/') $manualLoading = true;
	beforeNavigate(() => $manualLoading = true);
	toasts.clearAll();
</script>

{#if $navigating || $manualLoading}
	<div out:fade={{ duration: 250 }} class="fixed top-0 left-0 right-0 bottom-0 z-50 w-full h-screen overflow-hidden bg-gray-200 dark:bg-gray-900">
		<div transition:fade={{ duration: 250 }} class="fixed top-0 left-0 right-0 bottom-0 z-50 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
			<Spinner size="12" class="mb-4" />
			<h5 class="text-2xl font-semibold tracking-tight text-gray-700 dark:text-gray-400 mb-1.5">{$loadingHeadline[Math.floor(Math.random() * $loadingHeadline.length)]}</h5>
			<p class="w-5/6 font-normal text-gray-700 dark:text-gray-400 leading-tight text-center">
				<strong>Did you know?</strong> {$tips[Math.floor(Math.random() * $tips.length)]}
			</p>
		</div>
	</div>
{/if}
<slot />
