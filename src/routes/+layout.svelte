<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { state } from '$lib/states.svelte';
	import { fade } from 'svelte/transition';
	import '../app.css';
	import { LogoLoading } from '$components/icons';

	if (page.url.pathname !== '/') state.manualLoading = true;
	beforeNavigate((navigation) => {
		if (navigation.to?.url.pathname !== navigation.from?.url.pathname) {
			state.manualLoading = true;
		}
	});
</script>

{#if navigating.to || state.manualLoading}
	<div out:fade|global={{ duration: 250 }} class="fixed top-0 left-0 right-0 bottom-0 z-[100] w-full h-screen overflow-hidden background-100">
		<div transition:fade|global={{ duration: 250 }} class="fixed top-0 left-0 right-0 bottom-0 z-[100] w-full h-screen overflow-hidden flex flex-col items-center justify-center">
			<div class="w-24">
				<LogoLoading />
			</div>
		</div>
	</div>
{/if}
<slot />
