<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<div
	class="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 p-4"
>
	<div class="w-full max-w-4xl space-y-8">
		<div class="text-center">
			<h1 class="text-4xl font-bold tracking-tight text-slate-900">Chore Tracker</h1>
			<p class="mt-2 text-slate-600">Manage your household chores together</p>
		</div>

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
