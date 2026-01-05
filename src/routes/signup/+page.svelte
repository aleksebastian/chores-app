<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
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

	let { form }: { form: ActionData } = $props();
	let password = $state('');
	let passwordError = $state('');

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
		validatePasswordInput(password);
	});
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Create an Account</CardTitle>
			<CardDescription>Sign up to start managing your chores</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" use:enhance class="space-y-4">
				{#if form?.error}
					<div class="rounded-md bg-red-50 p-3 text-sm text-red-800">
						{form.error}
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="name">Name</Label>
					<Input type="text" id="name" name="name" required value={form?.name ?? ''} />
				</div>

				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input type="email" id="email" name="email" required value={form?.email ?? ''} />
				</div>

				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input type="password" id="password" name="password" required bind:value={password} />
					{#if passwordError}
						<p class="text-sm text-red-600">{passwordError}</p>
					{/if}
					<p class="text-xs text-gray-500">8-52 characters</p>
				</div>

				<div class="flex items-center space-x-2">
					<input
						type="checkbox"
						id="rememberMe"
						name="rememberMe"
						class="h-4 w-4 rounded border-gray-300"
					/>
					<Label for="rememberMe" class="text-sm font-normal">Remember me for 90 days</Label>
				</div>

				<Button type="submit" class="w-full" disabled={!!passwordError}>Sign Up</Button>

				<p class="text-center text-sm text-gray-600">
					Already have an account?
					<a href="/login" class="text-blue-600 hover:underline">Log in</a>
				</p>
			</form>
		</CardContent>
	</Card>
</div>
