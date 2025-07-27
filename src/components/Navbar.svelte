<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { getInitials, getUserAvatarURL, preload, signout, type WebUser } from '$lib/util';
    import { Avatar, Button, DarkMode, Dropdown, DropdownDivider, DropdownHeader, DropdownItem, Navbar, NavBrand } from 'flowbite-svelte';
    import { ArrowRightToBracketOutline, UserSolid } from 'flowbite-svelte-icons';
    import { LogoExpanded } from '$components/icons';
    import type { Snippet } from 'svelte';

    let { user, centerSnippet }: { user: WebUser, centerSnippet?: Snippet } = $props();
</script>

<Navbar class="my-2 px-4">
    <NavBrand href={page.url.pathname === '/dashboard' ? '#' : '/dashboard'}>
        <div class="py-1 w-32">
            <LogoExpanded />
        </div>
    </NavBrand>
    {#if centerSnippet}
        <div class="justify-self-center">
            {@render centerSnippet()}
        </div>
    {/if}
    <div class="flex">
        <DarkMode class="mr-2 !text-black dark:!text-white hover:!background-400 hover:cursor-pointer" />

        <Button class="!p-2.5 !bg-transparent !text-black dark:!text-white hover:!background-400 focus:ring-0 hover:cursor-pointer" id="avatar-menu">
            <UserSolid class="w-5 h-5" />
        </Button>
        <Dropdown simple placement="bottom-end" triggeredBy="#avatar-menu" class="!dropdown-override">
            <DropdownHeader class="flex flex-row items-center gap-2">
                {#await preload(user.avatar ? getUserAvatarURL(user) : '') then source}
                    <Avatar src={source} size="xs">{getInitials(user.global_name ?? user.username)}</Avatar>
                {/await}
                <span class="font-semibold tracking-tight">{user.global_name ?? user.username}</span>
                <span class="tracking-tight -ml-1">{user.global_name ? `(${user.username})` : `${user.discriminator !== '0' ? user.discriminator : ''}`}</span>
            </DropdownHeader>
            <DropdownDivider class="!dropdown-divider-override"></DropdownDivider>
            <DropdownItem onclick={async () => {await signout(); await goto('/');}} liClass="mx-2 pt-0.5" class="w-full font-medium !dropdown-item-override flex flex-row gap-1 !mx-0 items-center !cursor-pointer">
                <ArrowRightToBracketOutline class="w-5 h-5" />
                Sign out
            </DropdownItem>
        </Dropdown>
    </div>
</Navbar>
