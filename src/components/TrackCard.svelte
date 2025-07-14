<script lang="ts">
	import { ArrowUpRightFromSquareOutline, CloseOutline, DotsHorizontalOutline } from 'flowbite-svelte-icons';
	import { AudioLines } from '$components/icons';
	import { Avatar, Dropdown, DropdownDivider, DropdownHeader, DropdownItem } from 'flowbite-svelte';
	import { getInitials } from '$lib/util';
	import { state as states } from '$lib/states.svelte';

	let { track, position, guildId, userId, hasManageServerPermissions } = $props();
	let isOpen = $state(false);

	function remove() {
		if (!hasManageServerPermissions && track.requesterId !== userId) return;
		states.socket.emit('update', [guildId, { type: 'remove', value: position - 1 }], () => {
			isOpen = false;
		});
	}
</script>

{#snippet trackDropdown(mobile = false)}
	<Dropdown {isOpen} simple offset={mobile ? 0 : 10} class="!dropdown-override {mobile ? 'md:hidden' : 'max-md:hidden'}" triggeredBy={`#track-${position}`} placement={mobile ? "bottom" : "right-start"}>
		<DropdownHeader class="flex flex-col gap-1">
			<span class="text-xs">Requested by</span>
			<div class="flex flex-row items-center gap-2">
				<Avatar src="https://cdn.discordapp.com/avatars/{track.requesterId}/{track.requesterAvatar}.png" size="xs">{getInitials(track.requesterTag)}</Avatar>
				<span class="font-semibold tracking-tight">{track.requesterTag}</span>
				{#if track.requesterId === userId}
					<span class="tracking-tight opacity-50 -ml-1"> (you)</span>
				{/if}
			</div>
		</DropdownHeader>
		<DropdownDivider class="!dropdown-divider-override"></DropdownDivider>
		{#if position !== 0}
			<DropdownItem disabled={!hasManageServerPermissions && track.requesterId !== userId} onclick={remove} liClass="mx-2 pt-0.5" class="w-full font-medium !dropdown-item-override !cursor-pointer flex flex-row gap-1 !mx-0 items-center{!hasManageServerPermissions && track.requesterId !== userId ? ' !cursor-not-allowed hover:background-200 !text-700 hover:!text-700' : ''}">
				<CloseOutline class="w-5 h-5" />
				Remove
				{#if hasManageServerPermissions && track.requesterId !== userId}
					<span class="tracking-tight opacity-50"> (forcefully)</span>
				{/if}
			</DropdownItem>
		{/if}
		<DropdownItem liClass="mx-2 pt-0.5" class="w-full font-medium !dropdown-item-override flex flex-row gap-1 !mx-0 items-center !cursor-pointer" onclick={() => {window.open(track.info.uri); isOpen = false;}}>
			<ArrowUpRightFromSquareOutline class="w-5 h-5" />
			Track source
		</DropdownItem>
	</Dropdown>
{/snippet}

<div id="track-{position}" class="group transition-colors flex flex-row items-center gap-3 px-2 py-2 {position === 0 ? '' : 'mt-2 '}hover:background-300 rounded-lg cursor-pointer">
	{#if position === 0}
		<AudioLines class="text-600" />
	{:else}
		<span class="text-sm min-w-6 text-400 text-end">{position}</span>
	{/if}
	<img crossorigin="anonymous" src={track.info.artworkUrl} alt="Album Artwork" class="w-16 h-16 rounded-lg object-cover shrink-0" />
	<div class="flex flex-col justify-center truncate">
		<span class="text-900 font-semibold text-lg truncate">{track.info.title}</span>
		<span class="text-700 text-sm truncate">{track.info.author}</span>
	</div>
	<DotsHorizontalOutline class="transition-opacity text-500 w-6 h-6 ms-auto opacity-0 group-hover:opacity-100" />
</div>
{@render trackDropdown()}
{@render trackDropdown(true)}