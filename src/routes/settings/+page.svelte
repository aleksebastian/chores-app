<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let newPassword = $state('');
	let passwordError = $state('');
	let deleteConfirmOpen = $state(false);

	function validatePasswordInput(value: string) {
		if (value.length < 8) {
			passwordError = 'Password must be at least 8 characters';
		} else if (value.length > 52) {
			passwordError = 'Password must be at most 52 characters';
		} else {
			passwordError = '';
		}
	}

	$effect(() => {
		validatePasswordInput(newPassword);
	});
</script>

<div class="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-4">
	<div class="mx-auto max-w-2xl space-y-6 py-8">
		<!-- Header -->
		<div>
			<h1 class="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
			<p class="mt-1 text-sm text-slate-600">Manage your account settings</p>
		</div>

		<!-- Account Info -->
		<Card>
			<CardHeader>
				<CardTitle>Account Information</CardTitle>
				<CardDescription>Your account details</CardDescription>
			</CardHeader>
			<CardContent class="space-y-2">
				<div>
					<p class="text-sm font-medium text-slate-700">Name</p>
					<p class="text-slate-900">{data.user.name}</p>
				</div>
				<div>
					<p class="text-sm font-medium text-slate-700">Email</p>
					<p class="text-slate-900">{data.user.email}</p>
				</div>
			</CardContent>
		</Card>

		<!-- Change Password -->
		<Card>
			<CardHeader>
				<CardTitle>Change Password</CardTitle>
				<CardDescription>Update your password</CardDescription>
			</CardHeader>
			<CardContent>
				<form method="POST" action="?/changePassword" use:enhance class="space-y-4">
					{#if form?.type === 'password' && form?.error}
						<div class="rounded-md bg-red-50 p-3 text-sm text-red-800">
							{form.error}
						</div>
					{/if}
					{#if form?.type === 'password' && form?.success}
						<div class="rounded-md bg-green-50 p-3 text-sm text-green-800">
							{form.message}
						</div>
					{/if}

					<div class="space-y-2">
						<Label for="currentPassword">Current Password</Label>
						<Input type="password" id="currentPassword" name="currentPassword" required />
					</div>

					<div class="space-y-2">
						<Label for="newPassword">New Password</Label>
						<Input
							type="password"
							id="newPassword"
							name="newPassword"
							required
							bind:value={newPassword}
						/>
						{#if passwordError}
							<p class="text-sm text-red-600">{passwordError}</p>
						{/if}
						<p class="text-xs text-gray-500">8-52 characters</p>
					</div>

					<div class="space-y-2">
						<Label for="confirmPassword">Confirm New Password</Label>
						<Input type="password" id="confirmPassword" name="confirmPassword" required />
					</div>

					<Button type="submit" disabled={!!passwordError}>Change Password</Button>
				</form>
			</CardContent>
		</Card>

		<!-- Delete Account -->
		<Card class="border-red-200 bg-red-50">
			<CardHeader>
				<CardTitle class="text-red-900">Delete Account</CardTitle>
				<CardDescription class="text-red-700">
					Permanently delete your account and all associated data
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if form?.type === 'account' && form?.error}
					<div class="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-900">
						{form.error}
					</div>
				{/if}
				{#if data.hasSoleOwnerHomes}
					<p class="mb-4 text-sm text-red-800">
						You cannot delete your account while you are the sole owner of one or more homes. Please
						transfer ownership or delete those homes first.
					</p>
				{/if}
				<button
					onclick={() => (deleteConfirmOpen = true)}
					class="text-destructive-foreground inline-flex h-10 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium whitespace-nowrap ring-offset-background transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
				>
					Delete My Account
				</button>
			</CardContent>
		</Card>

		<!-- Delete Confirmation Dialog -->
		<Dialog.Root bind:open={deleteConfirmOpen}>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Delete Account?</Dialog.Title>
					<Dialog.Description>
						This will permanently delete your account and remove you from all homes. This action
						cannot be undone.
					</Dialog.Description>
				</Dialog.Header>
				<Dialog.Footer>
					<form method="POST" action="?/deleteAccount" use:enhance>
						<Button type="submit" variant="destructive">Yes, Delete My Account</Button>
					</form>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>

		<!-- Navigation -->
		<div class="flex justify-between">
			<Button variant="outline" onclick={() => (window.location.href = '/')}>Back to Home</Button>
			<form method="POST" action="/logout" use:enhance>
				<Button type="submit" variant="outline">Log Out</Button>
			</form>
		</div>
	</div>
</div>
