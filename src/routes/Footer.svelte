<script lang="ts">
	import { env } from '$env/dynamic/public';
	import { Footer, FooterLink, FooterLinkGroup } from 'flowbite-svelte';
    export let version: string;
</script>

<Footer>
    <p class="text-sm text-gray-500 dark:text-gray-400">Quaver • <code>{version}</code></p>
    <FooterLinkGroup ulClass="flex flex-wrap items-center mt-3 text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
        <FooterLink href={env.PUBLIC_PREMIUM_URL}>Get Premium</FooterLink>
        <FooterLink href={env.PUBLIC_SUPPORT_SERVER}>Support Server</FooterLink>
        <FooterLink href="https://go.zptx.dev/Quaver">GitHub</FooterLink>
    </FooterLinkGroup>
</Footer>
