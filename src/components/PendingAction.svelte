<script lang="ts">
    export let icon: any, title: string, subtitle: string;
</script>

<svelte:component this={icon} size="40" class="mx-auto mb-3"></svelte:component>
<h5 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
    {title}
</h5>
<p class="text-base text-gray-500 sm:text-lg dark:text-gray-400">
    {subtitle}
</p>
