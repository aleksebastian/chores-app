<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Progress } from '$lib/components/ui/progress';
	import { enhance } from '$app/forms';
	import { Plus, Check, Trash2, Copy, Home as HomeIcon } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let addRoomDialogOpen = $state(false);
	let addChoreDialogOpen = $state(false);
	let selectedRoomId = $state<string>('');
	let selectedRoomName = $state<string>('');
	let copySuccess = $state(false);

	function calculateProgress(chore: any): number {
		if (!chore.lastCompletedAt) return 100; // Never completed, show as urgent

		const now = Date.now();
		const lastCompleted = new Date(chore.lastCompletedAt).getTime();
		const daysSince = (now - lastCompleted) / (1000 * 60 * 60 * 24);
		const totalDays = chore.frequencyWeeks * 7;
		const progress = (daysSince / totalDays) * 100;

		return Math.min(100, Math.max(0, progress));
	}

	function getProgressColor(progress: number): string {
		if (progress < 50) return 'bg-green-500';
		if (progress < 80) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	function copyShareCode() {
		navigator.clipboard.writeText(data.home.shareCode);
		copySuccess = true;
		setTimeout(() => copySuccess = false, 2000);
	}

	function getDaysUntilDue(chore: any): string {
		if (!chore.lastCompletedAt) return 'Never completed';

		const now = Date.now();
		const lastCompleted = new Date(chore.lastCompletedAt).getTime();
		const daysSince = (now - lastCompleted) / (1000 * 60 * 60 * 24);
		const totalDays = chore.frequencyWeeks * 7;
		const daysUntilDue = Math.ceil(totalDays - daysSince);

		if (daysUntilDue <= 0) return 'Overdue!';
		if (daysUntilDue === 1) return 'Due tomorrow';
		return `Due in ${daysUntilDue} days`;
	}

	function openAddChoreDialog(roomId: string, roomName: string) {
		selectedRoomId = roomId;
		selectedRoomName = roomName;
		addChoreDialogOpen = true;
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
	<div class="mx-auto max-w-6xl space-y-6 py-8">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-slate-900">{data.home.name}</h1>
				<p class="mt-1 text-sm text-slate-600">Manage your household chores</p>
			</div>
			
			<form method="POST" action="?/leaveHome" use:enhance>
				<Button variant="outline" type="submit">Leave Home</Button>
			</form>
		</div>

		<!-- Share Code Card -->
		<Card.Root class="border-blue-200 bg-blue-50">
			<Card.Content class="flex items-center justify-between pt-6">
				<div>
					<p class="text-sm font-medium text-slate-900">Share Code</p>
					<p class="mt-1 font-mono text-2xl font-bold tracking-wider text-blue-600">
						{data.home.shareCode}
					</p>
					<p class="mt-1 text-xs text-slate-600">Share this code with others to give them access</p>
				</div>
				<Button onclick={copyShareCode} variant="outline" size="sm">
					<Copy class="mr-2 h-4 w-4" />
					{copySuccess ? 'Copied!' : 'Copy'}
				</Button>
			</Card.Content>
		</Card.Root>

		<!-- Add Room Button -->
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold text-slate-900">Rooms</h2>
			<Button size="sm" onclick={() => addRoomDialogOpen = true}>
				<Plus class="mr-2 h-4 w-4" />
				Add Room
			</Button>
		</div>

		<!-- Rooms Grid -->
		{#if data.rooms.length === 0}
			<Card.Root class="border-dashed">
				<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
					<HomeIcon class="mb-4 h-12 w-12 text-slate-400" />
					<p class="text-lg font-medium text-slate-900">No rooms yet</p>
					<p class="mt-1 text-sm text-slate-600">Get started by adding your first room</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each data.rooms as room}
					<Card.Root>
						<Card.Header>
							<div class="flex items-start justify-between">
								<div>
									<Card.Title>{room.name}</Card.Title>
									<Card.Description>{room.chores.length} chore{room.chores.length !== 1 ? 's' : ''}</Card.Description>
								</div>
								<div class="flex gap-1">
									<Button
										size="sm"
										variant="ghost"
										onclick={() => openAddChoreDialog(room.id, room.name)}
									>
										<Plus class="h-4 w-4" />
									</Button>
									<form method="POST" action="?/deleteRoom" use:enhance>
										<input type="hidden" name="roomId" value={room.id} />
										<Button size="sm" variant="ghost" type="submit">
											<Trash2 class="h-4 w-4 text-red-500" />
										</Button>
									</form>
								</div>
							</div>
						</Card.Header>
						<Card.Content class="space-y-3">
							{#if room.chores.length === 0}
								<p class="text-center text-sm text-slate-500">No chores yet</p>
							{:else}
								{#each room.chores as chore}
									{@const progress = calculateProgress(chore)}
									<div class="space-y-2 rounded-lg border p-3">
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<p class="font-medium text-slate-900">{chore.title}</p>
												<p class="text-xs text-slate-600">{getDaysUntilDue(chore)}</p>
											</div>
											<div class="flex gap-1">
												<form method="POST" action="?/completeChore" use:enhance>
													<input type="hidden" name="choreId" value={chore.id} />
													<Button size="sm" variant="ghost" type="submit">
														<Check class="h-4 w-4 text-green-600" />
													</Button>
												</form>
												<form method="POST" action="?/deleteChore" use:enhance>
													<input type="hidden" name="choreId" value={chore.id} />
													<Button size="sm" variant="ghost" type="submit">
														<Trash2 class="h-4 w-4 text-red-500" />
													</Button>
												</form>
											</div>
										</div>
										<div class="space-y-1">
											<Progress value={progress} class={getProgressColor(progress)} />
											<p class="text-xs text-slate-500">
												Every {chore.frequencyWeeks} week{chore.frequencyWeeks !== 1 ? 's' : ''}
											</p>
										</div>
									</div>
								{/each}
							{/if}
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Add Room Dialog -->
<Dialog.Root bind:open={addRoomDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add a New Room</Dialog.Title>
			<Dialog.Description>Create a room to organize your chores</Dialog.Description>
		</Dialog.Header>
		<form 
			method="POST" 
			action="?/createRoom" 
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					addRoomDialogOpen = false;
				};
			}}
			class="space-y-4"
		>
			<div class="space-y-2">
				<Label for="room-name">Room Name</Label>
				<Input
					id="room-name"
					name="name"
					placeholder="Kitchen"
					required
				/>
			</div>
			<Button type="submit" class="w-full">Add Room</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Add Chore Dialog -->
<Dialog.Root bind:open={addChoreDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add a Chore</Dialog.Title>
			<Dialog.Description>Add a new chore to {selectedRoomName}</Dialog.Description>
		</Dialog.Header>
		<form 
			method="POST" 
			action="?/createChore" 
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					addChoreDialogOpen = false;
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="roomId" value={selectedRoomId} />
			<div class="space-y-2">
				<Label for="chore-title">Chore Name</Label>
				<Input
					id="chore-title"
					name="title"
					placeholder="Vacuum floor"
					required
				/>
			</div>
			<div class="space-y-2">
				<Label for="frequency">Frequency (weeks)</Label>
				<Input
					id="frequency"
					name="frequencyWeeks"
					type="number"
					min="1"
					max="52"
					value="1"
					required
				/>
			</div>
			<Button type="submit" class="w-full">Add Chore</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
