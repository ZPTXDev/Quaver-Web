<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { state } from '$lib/states.svelte';
	import { tips, loadingHeadline } from '$lib/constants';
	import { Spinner } from 'flowbite-svelte';
	import { toasts } from 'svelte-toasts';
	import { fade } from 'svelte/transition';
	import '../app.css';

	if (page.url.pathname !== '/') state.manualLoading = true;
	beforeNavigate(() => {
		toasts.clearAll();
		state.manualLoading = true;
	});
	toasts.clearAll();
</script>

{#if navigating.to || state.manualLoading}
	<div out:fade|global={{ duration: 250 }} class="fixed top-0 left-0 right-0 bottom-0 z-50 w-full h-screen overflow-hidden background-100">
		<div transition:fade|global={{ duration: 250 }} class="fixed top-0 left-0 right-0 bottom-0 z-50 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
			<div class="flex items-center mb-1.5 gap-2.5">
				<Spinner size="6" class="!fill-text-900 dark:!fill-text-dark-900 !text-400" />
				<h5 class="text-2xl font-semibold tracking-tight text-800">
					{loadingHeadline[Math.floor(Math.random() * loadingHeadline.length)]}
				</h5>
			</div>
			<p class="w-5/6 font-normal text-700 leading-tight text-center">
				<strong>Did you know?</strong> {tips[Math.floor(Math.random() * tips.length)]}
			</p>
		</div>
	</div>
{/if}
<slot />
