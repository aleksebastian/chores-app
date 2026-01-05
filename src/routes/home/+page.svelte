<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Progress } from '$lib/components/ui/progress';
	import { enhance } from '$app/forms';
	import {
		Plus,
		Check,
		Trash2,
		Copy,
		Home as HomeIcon,
		Pencil,
		ChefHat,
		BedDouble,
		Bath,
		Sofa,
		Brush,
		Shirt,
		Warehouse,
		Car,
		Sparkles,
		TreePine,
		FlowerIcon,
		Dumbbell,
		Monitor,
		BookOpen
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let addRoomDialogOpen = $state(false);
	let addChoreDialogOpen = $state(false);
	let editChoreDialogOpen = $state(false);
	let editRoomDialogOpen = $state(false);
	let selectedRoomId = $state<string>('');
	let selectedRoomName = $state<string>('');
	let copySuccess = $state(false);
	let newRoomName = $state('');
	let selectedIcon = $state('HomeIcon');

	// Confirmation dialogs
	let confirmDeleteRoomOpen = $state(false);
	let confirmDeleteChoreOpen = $state(false);
	let confirmLeaveHomeOpen = $state(false);
	let roomToDelete = $state<string>('');
	let choreToDelete = $state<string>('');

	// Edit chore state
	let choreToEdit = $state<any>(null);

	// Edit room state
	let roomToEdit = $state<any>(null);

	// Common household chores
	const commonChores = [
		'Vacuum floors',
		'Mop floors',
		'Clean bathroom',
		'Clean kitchen',
		'Do laundry',
		'Wash dishes',
		'Take out trash',
		'Dust furniture',
		'Clean windows',
		'Change bed sheets',
		'Water plants',
		'Clean mirrors',
		'Organize closet',
		'Sweep porch',
		'Clean refrigerator',
		'Wipe counters',
		'Empty dishwasher',
		'Clean toilet',
		'Scrub shower/tub',
		'Mow lawn',
		'Rake leaves',
		'Clean garage'
	];

	function calculateProgress(chore: any): number {
		if (!chore.lastCompletedAt) return 0; // Never completed, show as 0%

		const now = Date.now();
		const lastCompleted = new Date(chore.lastCompletedAt).getTime();
		const daysSince = (now - lastCompleted) / (1000 * 60 * 60 * 24);
		const totalDays = chore.frequencyWeeks * 7;
		const progress = ((totalDays - daysSince) / totalDays) * 100;

		return Math.min(100, Math.max(0, progress));
	}

	function getProgressColor(progress: number): string {
		if (progress >= 50) return 'bg-green-500';
		if (progress >= 25) return 'bg-yellow-500';
		return 'bg-red-500';
	}

	function copyShareCode() {
		navigator.clipboard.writeText(data.home.shareCode);
		copySuccess = true;
		setTimeout(() => (copySuccess = false), 2000);
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

	function confirmDeleteRoom(roomId: string) {
		roomToDelete = roomId;
		confirmDeleteRoomOpen = true;
	}

	function confirmDeleteChore(choreId: string) {
		choreToDelete = choreId;
		confirmDeleteChoreOpen = true;
	}

	function openEditChoreDialog(chore: any) {
		choreToEdit = chore;
		editChoreDialogOpen = true;
	}

	function openEditRoomDialog(room: any) {
		roomToEdit = room;
		editRoomDialogOpen = true;
	}

	// Room icon mapping
	const roomIcons: Record<string, any> = {
		HomeIcon: HomeIcon,
		ChefHat: ChefHat,
		BedDouble: BedDouble,
		Bath: Bath,
		Sofa: Sofa,
		Brush: Brush,
		Shirt: Shirt,
		Warehouse: Warehouse,
		Car: Car,
		Sparkles: Sparkles,
		TreePine: TreePine,
		FlowerIcon: FlowerIcon,
		Dumbbell: Dumbbell,
		Monitor: Monitor,
		BookOpen: BookOpen
	};

	const iconOptions = [
		{ name: 'HomeIcon', label: 'Home', component: HomeIcon },
		{ name: 'ChefHat', label: 'Kitchen', component: ChefHat },
		{ name: 'BedDouble', label: 'Bedroom', component: BedDouble },
		{ name: 'Bath', label: 'Bathroom', component: Bath },
		{ name: 'Sofa', label: 'Living Room', component: Sofa },
		{ name: 'Brush', label: 'Cleaning', component: Brush },
		{ name: 'Shirt', label: 'Laundry', component: Shirt },
		{ name: 'Warehouse', label: 'Storage', component: Warehouse },
		{ name: 'Car', label: 'Garage', component: Car },
		{ name: 'Sparkles', label: 'Other', component: Sparkles },
		{ name: 'TreePine', label: 'Garden', component: TreePine },
		{ name: 'FlowerIcon', label: 'Patio', component: FlowerIcon },
		{ name: 'Dumbbell', label: 'Gym', component: Dumbbell },
		{ name: 'Monitor', label: 'Office', component: Monitor },
		{ name: 'BookOpen', label: 'Study', component: BookOpen }
	];

	function suggestIcon(name: string): string {
		const lowerName = name.toLowerCase();
		if (lowerName.includes('kitchen')) return 'ChefHat';
		if (lowerName.includes('bedroom') || lowerName.includes('bed')) return 'BedDouble';
		if (lowerName.includes('bathroom') || lowerName.includes('bath')) return 'Bath';
		if (lowerName.includes('living') || lowerName.includes('lounge')) return 'Sofa';
		if (lowerName.includes('laundry')) return 'Shirt';
		if (lowerName.includes('garage')) return 'Car';
		if (lowerName.includes('storage') || lowerName.includes('closet')) return 'Warehouse';
		if (lowerName.includes('garden') || lowerName.includes('yard')) return 'TreePine';
		if (lowerName.includes('patio') || lowerName.includes('balcony')) return 'FlowerIcon';
		if (lowerName.includes('gym') || lowerName.includes('fitness')) return 'Dumbbell';
		if (lowerName.includes('office') || lowerName.includes('workspace')) return 'Monitor';
		if (lowerName.includes('study') || lowerName.includes('library')) return 'BookOpen';
		return 'HomeIcon';
	}

	function handleRoomNameInput(e: Event) {
		const input = e.target as HTMLInputElement;
		newRoomName = input.value;
		selectedIcon = suggestIcon(newRoomName);
	}

	function getRoomIcon(room: any) {
		return roomIcons[room.icon || 'HomeIcon'] || HomeIcon;
	}
</script>

<div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-4">
	<div class="mx-auto max-w-6xl space-y-6 py-8">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-slate-900">{data.home.name}</h1>
				<p class="mt-1 text-sm text-slate-600">Manage your household chores</p>
			</div>

			<Button variant="outline" onclick={() => (confirmLeaveHomeOpen = true)}>Leave Home</Button>
		</div>

		<!-- Share Code Accordion -->
		<Accordion.Root class="rounded-lg border-blue-200 bg-blue-50">
			<Accordion.Item value="share-code">
				<Accordion.Trigger class="px-6 py-4 hover:bg-blue-100/50">
					<span class="text-sm font-medium text-slate-900">Share Code</span>
				</Accordion.Trigger>
				<Accordion.Content class="px-6 pb-4">
					<div class="flex items-center justify-between pt-2">
						<div>
							<p class="font-mono text-2xl font-bold tracking-wider text-blue-600">
								{data.home.shareCode}
							</p>
							<p class="mt-1 text-xs text-slate-600">
								Share this code with others to give them access
							</p>
						</div>
						<Button onclick={copyShareCode} variant="outline" size="sm">
							<Copy class="mr-2 h-4 w-4" />
							{copySuccess ? 'Copied!' : 'Copy'}
						</Button>
					</div>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>

		<!-- Add Room Button -->
		<div class="flex items-center justify-between">
			<h2 class="text-xl font-semibold text-slate-900">Rooms</h2>
			<Button size="sm" onclick={() => (addRoomDialogOpen = true)}>
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
					{@const IconComponent = getRoomIcon(room)}
					<Card.Root>
						<Card.Header>
							<div class="flex items-start justify-between">
								<div class="flex flex-1 items-center gap-3">
									<div class="rounded-lg bg-blue-100 p-2">
										<IconComponent class="h-6 w-6 text-blue-600" />
									</div>
									<div>
										<Card.Title>{room.name}</Card.Title>
										<Card.Description
											>{room.chores.length} chore{room.chores.length !== 1
												? 's'
												: ''}</Card.Description
										>
									</div>
								</div>
								<div class="flex gap-1">
									<Button
										size="sm"
										variant="ghost"
										onclick={() => openAddChoreDialog(room.id, room.name)}
									>
										<Plus class="h-4 w-4" />
									</Button>
									<Button size="sm" variant="ghost" onclick={() => openEditRoomDialog(room)}>
										<Pencil class="h-4 w-4 text-blue-600" />
									</Button>
									<Button size="sm" variant="ghost" onclick={() => confirmDeleteRoom(room.id)}>
										<Trash2 class="h-4 w-4 text-red-500" />
									</Button>
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
												<Button
													size="sm"
													variant="ghost"
													onclick={() => openEditChoreDialog(chore)}
												>
													<Pencil class="h-4 w-4 text-blue-600" />
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onclick={() => confirmDeleteChore(chore.id)}
												>
													<Trash2 class="h-4 w-4 text-red-500" />
												</Button>
											</div>
										</div>
										<div class="space-y-1">
											<Progress value={progress} indicatorClass={getProgressColor(progress)} />
											<p class="text-xs text-slate-500">
												{chore.frequencyWeeks === 1
													? 'Every week'
													: `Every ${chore.frequencyWeeks} weeks`}
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
					newRoomName = '';
					selectedIcon = 'HomeIcon';
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
					bind:value={newRoomName}
					oninput={handleRoomNameInput}
					required
				/>
			</div>
			<input type="hidden" name="icon" value={selectedIcon} />
			<div class="space-y-2">
				<Label>Icon</Label>
				<div class="grid grid-cols-5 gap-2">
					{#each iconOptions as icon}
						{@const IconComp = icon.component}
						<button
							type="button"
							class="flex aspect-square items-center justify-center rounded-lg border-2 p-2 transition-colors {selectedIcon ===
							icon.name
								? 'border-blue-600 bg-blue-50'
								: 'border-slate-200 hover:border-slate-300'}"
							onclick={() => (selectedIcon = icon.name)}
						>
							<IconComp
								class="h-8 w-8 {selectedIcon === icon.name ? 'text-blue-600' : 'text-slate-600'}"
							/>
						</button>
					{/each}
				</div>
			</div>
			<Button type="submit" class="w-full">Add Room</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Edit Room Dialog -->
<Dialog.Root bind:open={editRoomDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit Room</Dialog.Title>
			<Dialog.Description>Update room details</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/editRoom"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					editRoomDialogOpen = false;
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="roomId" value={roomToEdit?.id} />
			<div class="space-y-2">
				<Label for="edit-room-name">Room Name</Label>
				<Input
					id="edit-room-name"
					name="name"
					placeholder="Kitchen"
					value={roomToEdit?.name}
					required
				/>
			</div>
			<div class="space-y-2">
				<Label>Icon</Label>
				<div class="grid grid-cols-5 gap-2">
					{#each iconOptions as icon}
						{@const IconComp = icon.component}
						<button
							type="button"
							class="flex aspect-square items-center justify-center rounded-lg border-2 p-2 transition-colors {(roomToEdit?.icon ||
								'HomeIcon') === icon.name
								? 'border-blue-600 bg-blue-50'
								: 'border-slate-200 hover:border-slate-300'}"
							onclick={() => {
								if (roomToEdit) roomToEdit.icon = icon.name;
							}}
						>
							<IconComp
								class="h-8 w-8 {(roomToEdit?.icon || 'HomeIcon') === icon.name
									? 'text-blue-600'
									: 'text-slate-600'}"
							/>
						</button>
					{/each}
				</div>
			</div>
			<input type="hidden" name="icon" value={roomToEdit?.icon || 'HomeIcon'} />
			<Button type="submit" class="w-full">Save Changes</Button>
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
					list="common-chores"
					placeholder="Vacuum floor"
					required
				/>
				<datalist id="common-chores">
					{#each commonChores as chore}
						<option value={chore}></option>
					{/each}
				</datalist>
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

<!-- Confirm Delete Room Dialog -->
<Dialog.Root bind:open={confirmDeleteRoomOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Room?</Dialog.Title>
			<Dialog.Description
				>Are you sure you want to delete this room? All chores in this room will also be deleted.</Dialog.Description
			>
		</Dialog.Header>
		<div class="flex gap-2">
			<Button variant="outline" class="flex-1" onclick={() => (confirmDeleteRoomOpen = false)}
				>Cancel</Button
			>
			<form
				method="POST"
				action="?/deleteRoom"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						confirmDeleteRoomOpen = false;
					};
				}}
				class="flex-1"
			>
				<input type="hidden" name="roomId" value={roomToDelete} />
				<Button type="submit" variant="destructive" class="w-full">Delete Room</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Confirm Delete Chore Dialog -->
<Dialog.Root bind:open={confirmDeleteChoreOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Chore?</Dialog.Title>
			<Dialog.Description>Are you sure you want to delete this chore?</Dialog.Description>
		</Dialog.Header>
		<div class="flex gap-2">
			<Button variant="outline" class="flex-1" onclick={() => (confirmDeleteChoreOpen = false)}
				>Cancel</Button
			>
			<form
				method="POST"
				action="?/deleteChore"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						confirmDeleteChoreOpen = false;
					};
				}}
				class="flex-1"
			>
				<input type="hidden" name="choreId" value={choreToDelete} />
				<Button type="submit" variant="destructive" class="w-full">Delete Chore</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
<!-- Edit Chore Dialog -->
<Dialog.Root bind:open={editChoreDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Edit Chore</Dialog.Title>
			<Dialog.Description>Update chore details</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/editChore"
			use:enhance={() => {
				return async ({ update }) => {
					await update();
					editChoreDialogOpen = false;
				};
			}}
			class="space-y-4"
		>
			<input type="hidden" name="choreId" value={choreToEdit?.id} />
			<div class="space-y-2">
				<Label for="edit-chore-title">Chore Name</Label>
				<Input
					id="edit-chore-title"
					name="title"
					list="common-chores-edit"
					placeholder="Vacuum floor"
					value={choreToEdit?.title}
					required
				/>
				<datalist id="common-chores-edit">
					{#each commonChores as chore}
						<option value={chore}></option>
					{/each}
				</datalist>
			</div>
			<div class="space-y-2">
				<Label for="edit-frequency">Frequency (weeks)</Label>
				<Input
					id="edit-frequency"
					name="frequencyWeeks"
					type="number"
					min="1"
					max="52"
					value={choreToEdit?.frequencyWeeks}
					required
				/>
			</div>
			<Button type="submit" class="w-full">Save Changes</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
