<script lang="ts">
	import { MagnifyingGlass } from 'svelte-heros-v2';

    export let item: string;
</script>

<MagnifyingGlass size="40" class="mx-auto mb-3"></MagnifyingGlass>
<h5 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
    No {item}s found
</h5>
<p class="text-base text-gray-500 sm:text-lg dark:text-gray-400">
    Try narrowing your search criteria.
</p>
