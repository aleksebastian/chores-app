<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let shareCodeInput = $derived(data.shareCode || '');
</script>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4"
>
	<div class="w-full max-w-4xl space-y-8">
		<div class="text-center">
			<h1 class="text-4xl font-bold tracking-tight text-slate-900">Chore Tracker</h1>
			<p class="mt-2 text-slate-600">Manage your household chores together</p>
		</div>

		{#if data.homes && data.homes.length > 0}
			<!-- Show home selector -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Your Homes</Card.Title>
					<Card.Description>Select a home to manage</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="space-y-3">
						{#each data.homes as home}
							<a
								href="/home/{home.id}"
								class="block rounded-lg border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
							>
								<div class="flex items-center justify-between">
									<div>
										<h3 class="font-semibold text-slate-900">{home.name}</h3>
										<p class="text-sm text-slate-500">
											{home.role === 'owner' ? 'Owner' : 'Member'} • Code: {home.shareCode}
										</p>
									</div>
									<svg
										class="h-5 w-5 text-slate-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</div>
							</a>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		{/if}

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Create Home -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Create a New Home</Card.Title>
					<Card.Description>Start managing chores for your household</Card.Description>
				</Card.Header>
				<Card.Content>
					<form method="POST" action="?/createHome" use:enhance class="space-y-4">
						<div class="space-y-2">
							<Label for="name">Home Name</Label>
							<Input id="name" name="name" placeholder="Our Home" required />
						</div>
						{#if form?.error}
							<p class="text-sm text-red-600">{form.error}</p>
						{/if}
						<Button type="submit" class="w-full">Create Home</Button>
					</form>
				</Card.Content>
			</Card.Root>

			<!-- Join Home -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Join Existing Home</Card.Title>
					<Card.Description>Enter a share code to join a home</Card.Description>
				</Card.Header>
				<Card.Content>
					<form method="POST" action="?/joinHome" use:enhance class="space-y-4">
						<div class="space-y-2">
							<Label for="shareCode">Share Code</Label>
							<Input
								id="shareCode"
								name="shareCode"
								placeholder="ABC123"
								class="uppercase"
								maxlength={6}
								required
								value={shareCodeInput}
							/>
						</div>
						{#if form?.error}
							<p class="text-sm text-red-600">{form.error}</p>
						{/if}
						<Button type="submit" variant="outline" class="w-full">Join Home</Button>
					</form>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
