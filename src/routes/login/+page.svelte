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
</script>

<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="w-full max-w-md">
		<CardHeader>
			<CardTitle>Welcome Back</CardTitle>
			<CardDescription>Log in to your chores account</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" use:enhance class="space-y-4">
				{#if form?.error}
					<div class="rounded-md bg-red-50 p-3 text-sm text-red-800">
						{form.error}
					</div>
				{/if}

				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input type="email" id="email" name="email" required value={form?.email ?? ''} />
				</div>

				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input type="password" id="password" name="password" required />
				</div>

				<div class="flex items-center justify-between">
					<div class="flex items-center space-x-2">
						<input
							type="checkbox"
							id="rememberMe"
							name="rememberMe"
							class="h-4 w-4 rounded border-gray-300"
						/>
						<Label for="rememberMe" class="text-sm font-normal">Remember me for 90 days</Label>
					</div>
				</div>

				<Button type="submit" class="w-full">Log In</Button>

				<p class="text-center text-sm text-gray-500">
					Forgot password? <span class="text-gray-400">Coming soon</span>
				</p>

				<p class="text-center text-sm text-gray-600">
					Don't have an account?
					<a href="/signup" class="text-blue-600 hover:underline">Sign up</a>
				</p>
			</form>
		</CardContent>
	</Card>
</div>
