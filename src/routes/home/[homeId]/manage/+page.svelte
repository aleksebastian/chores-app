<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { enhance } from '$app/forms';
	import { Copy, Trash2, ArrowLeft } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let copySuccess = $state(false);
	let inviteUrl = $state('');

	// Confirmation dialogs
	let confirmLeaveHomeOpen = $state(false);
	let confirmDeleteHomeOpen = $state(false);
	let confirmRemoveMemberOpen = $state(false);
	let memberToRemove = $state<{ id: string; name: string } | null>(null);

	function copyShareCode() {
		navigator.clipboard.writeText(data.home.shareCode);
		copySuccess = true;
		setTimeout(() => (copySuccess = false), 2000);
	}

	function copyInviteLink() {
		if (typeof window !== 'undefined') {
			navigator.clipboard.writeText(inviteUrl);
			copySuccess = true;
			setTimeout(() => (copySuccess = false), 2000);
		}
	}

	// Set invite URL on client side only
	$effect(() => {
		if (typeof window !== 'undefined') {
			inviteUrl = `${window.location.origin}/?code=${data.home.shareCode}`;
		}
	});
</script>

<div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-4">
	<div class="mx-auto max-w-4xl space-y-6 py-8">
		<!-- Header with Back Button -->
		<div class="flex items-center gap-4">
			<Button
				variant="outline"
				size="sm"
				onclick={() => (window.location.href = `/home/${data.home.id}`)}
			>
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Home
			</Button>
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-slate-900">Manage Home</h1>
				<p class="mt-1 text-sm text-slate-600">{data.home.name}</p>
			</div>
		</div>

		<!-- Invite Others Section -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Invite Others</Card.Title>
				<Card.Description>Share this code or link to invite people to your home</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex items-center justify-between">
					<div>
						<p class="font-mono text-2xl font-bold tracking-wider text-blue-600">
							{data.home.shareCode}
						</p>
						<p class="mt-1 text-xs text-slate-600">Share code or magic link</p>
					</div>
					<div class="flex gap-2">
						<Button onclick={copyShareCode} variant="outline" size="sm">
							<Copy class="mr-2 h-4 w-4" />
							{copySuccess ? 'Copied!' : 'Copy Code'}
						</Button>
						<Button onclick={copyInviteLink} variant="outline" size="sm">
							<Copy class="mr-2 h-4 w-4" />
							Copy Magic Link
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Members Section -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Members ({data.members.length})</Card.Title>
				<Card.Description>People in this home</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-2">
				{#each data.members as member}
					<div class="flex items-center justify-between rounded-lg border p-3">
						<div>
							<p class="font-medium text-slate-900">{member.name}</p>
							<p class="text-xs text-slate-500">{member.email}</p>
						</div>
						<div class="flex items-center gap-2">
							<span
								class="rounded-full px-2 py-1 text-xs font-medium {member.role === 'owner'
									? 'bg-blue-100 text-blue-700'
									: 'bg-slate-100 text-slate-700'}"
							>
								{member.role === 'owner' ? 'Owner' : 'Member'}
							</span>
							{#if member.id !== data.userId && data.userRole === 'owner'}
								{#if member.role === 'member'}
									<form method="POST" action="?/promoteMember" use:enhance>
										<input type="hidden" name="userId" value={member.id} />
										<Button type="submit" size="sm" variant="outline">Promote to Owner</Button>
									</form>
								{/if}
								<Button
									size="sm"
									variant="ghost"
									onclick={() => {
										memberToRemove = { id: member.id, name: member.name };
										confirmRemoveMemberOpen = true;
									}}
								>
									<Trash2 class="h-4 w-4 text-red-500" />
								</Button>
							{/if}
						</div>
					</div>
				{/each}
			</Card.Content>
		</Card.Root>

		<!-- Home Actions Section -->
		<Card.Root class="border-red-200 bg-red-50">
			<Card.Header>
				<Card.Title class="text-red-900">Home Actions</Card.Title>
				<Card.Description class="text-red-700"
					>Leave this home or delete it permanently (owners only)</Card.Description
				>
			</Card.Header>
			<Card.Content class="flex gap-2">
				<Button variant="outline" onclick={() => (confirmLeaveHomeOpen = true)}>Leave Home</Button>
				{#if data.userRole === 'owner'}
					<Button variant="destructive" onclick={() => (confirmDeleteHomeOpen = true)}>
						Delete Home
					</Button>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Confirm Leave Home Dialog -->
<Dialog.Root bind:open={confirmLeaveHomeOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Leave Home?</Dialog.Title>
			<Dialog.Description
				>Are you sure you want to leave this home? You'll need the share code to rejoin.</Dialog.Description
			>
		</Dialog.Header>
		<div class="flex gap-2">
			<Button variant="outline" class="flex-1" onclick={() => (confirmLeaveHomeOpen = false)}
				>Cancel</Button
			>
			<form method="POST" action="?/leaveHome" use:enhance class="flex-1">
				<Button type="submit" variant="destructive" class="w-full">Leave Home</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Confirm Delete Home Dialog -->
<Dialog.Root bind:open={confirmDeleteHomeOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Home?</Dialog.Title>
			<Dialog.Description
				>Are you sure you want to delete this home? This will permanently delete all rooms, chores,
				and remove all members. This action cannot be undone.</Dialog.Description
			>
		</Dialog.Header>
		<div class="flex gap-2">
			<Button variant="outline" class="flex-1" onclick={() => (confirmDeleteHomeOpen = false)}
				>Cancel</Button
			>
			<form method="POST" action="?/deleteHome" use:enhance class="flex-1">
				<Button type="submit" variant="destructive" class="w-full">Delete Home</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Confirm Remove Member Dialog -->
<Dialog.Root bind:open={confirmRemoveMemberOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Remove Member?</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to remove {memberToRemove?.name} from this home?
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex gap-2">
			<Button variant="outline" class="flex-1" onclick={() => (confirmRemoveMemberOpen = false)}
				>Cancel</Button
			>
			<form
				method="POST"
				action="?/removeMember"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						confirmRemoveMemberOpen = false;
					};
				}}
				class="flex-1"
			>
				<input type="hidden" name="userId" value={memberToRemove?.id} />
				<Button type="submit" variant="destructive" class="w-full">Remove Member</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
