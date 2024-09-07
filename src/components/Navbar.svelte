<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { Logo } from '$images';
    import { managerMode } from '$lib/stores';
    import { getInitials, preload, signout, type WebUser } from '$lib/util';
    import { Avatar, DarkMode, Dropdown, DropdownDivider, DropdownHeader, DropdownItem, Navbar, NavBrand, Toggle } from 'flowbite-svelte';

    export let user: WebUser;
</script>

<Navbar>
    <NavBrand href={$page.url.pathname === '/dashboard' ? '#' : '/dashboard'}>
        <img
            src={Logo}
            class="mr-3 h-6 sm:h-9"
            alt="Quaver Logo"
        />
        <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
            Quaver
        </span>
    </NavBrand>
    <div class="flex md:order-2">
        <DarkMode class="mr-2" />
        {#await preload(user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : '') then source}
            <Avatar id="avatar-menu" class="cursor-pointer" src={source}> {getInitials(user.username)} </Avatar>
            <Dropdown placement="bottom" triggeredBy="#avatar-menu">
                <DropdownHeader>
                    <span class="block text-sm"> {user.username}{user.discriminator !== '0' ? user.discriminator : ''} </span>
                </DropdownHeader>
                {#if user.manager}
                    <DropdownItem class="cursor-default">
                        <Toggle bind:checked={$managerMode}>Manager Mode</Toggle>
                    </DropdownItem>
                    <DropdownDivider></DropdownDivider>
                {/if}
                <DropdownItem on:click={async () => {await signout(); goto('/');}}>Sign out</DropdownItem>
            </Dropdown>
        {/await}
    </div>
</Navbar>
