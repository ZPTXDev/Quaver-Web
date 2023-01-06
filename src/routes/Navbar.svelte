<script lang="ts">
    import { goto } from '$app/navigation';
    import logo from '$lib/images/logo.svg';
    import { managerMode } from '$lib/stores';
    import type { APIUser } from 'discord-api-types/v10';
    import { Avatar, DarkMode, Dropdown, DropdownDivider, DropdownHeader, DropdownItem, Navbar, NavBrand, Toggle } from 'flowbite-svelte';
    export let user: APIUser & { manager?: boolean };
    function preload(src: string): Promise<string> {
        if (src === '') return Promise.resolve('');
        return new Promise(function (resolve) {
            let img = new Image();
            img.onload = () => resolve(src);
            img.src = src;
        })
    }
</script>

<Navbar>
    <NavBrand href="/dashboard" on:click={event => {event.preventDefault(); goto('/dashboard');}}>
        <img
            src={logo}
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
            <Avatar id="avatar-menu" class="cursor-pointer" src={source}> {user.username.split(' ').map((word) => word[0]).join('')} </Avatar>        
            <Dropdown placement="bottom" triggeredBy="#avatar-menu">
                <DropdownHeader>
                    <span class="block text-sm"> {user.username}#{user.discriminator} </span>
                </DropdownHeader>
                {#if user.manager}
                    <DropdownItem class="cursor-default">
                        <Toggle bind:checked={$managerMode}>Manager Mode</Toggle>
                    </DropdownItem>
                    <DropdownDivider></DropdownDivider>
                {/if}
                <DropdownItem href="/signout">Sign out</DropdownItem>
            </Dropdown>
        {/await}
    </div>
</Navbar>
