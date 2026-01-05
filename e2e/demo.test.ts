import { expect, test } from '@playwright/test';

test('redirects to login when not authenticated', async ({ page }) => {
	await page.goto('/');
	await page.waitForURL('**/login');
	await expect(page.locator('h1')).toContainText('Welcome Back');
});

test('signup page has expected elements', async ({ page }) => {
	await page.goto('/signup');
	await expect(page.locator('h1')).toContainText('Create an Account');
	await expect(page.getByLabel('Name')).toBeVisible();
	await expect(page.getByLabel('Email')).toBeVisible();
	await expect(page.getByLabel('Password')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
});

test('login page has expected elements', async ({ page }) => {
	await page.goto('/login');
	await expect(page.locator('h1')).toContainText('Welcome Back');
	await expect(page.getByLabel('Email')).toBeVisible();
	await expect(page.getByLabel('Password')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
	await expect(page.getByText('Forgot password?')).toBeVisible();
	await expect(page.getByText('Coming soon')).toBeVisible();
});

test('signup page shows password validation', async ({ page }) => {
	await page.goto('/signup');
	
	// Type a short password
	await page.getByLabel('Password').fill('short');
	
	// Should show error
	await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
	
	// Sign up button should be disabled
	await expect(page.getByRole('button', { name: 'Sign Up' })).toBeDisabled();
	
	// Type a valid password
	await page.getByLabel('Password').fill('validPassword123');
	
	// Error should disappear
	await expect(page.getByText('Password must be at least 8 characters')).not.toBeVisible();
	
	// Sign up button should be enabled
	await expect(page.getByRole('button', { name: 'Sign Up' })).toBeEnabled();
});

test('can navigate between login and signup', async ({ page }) => {
	await page.goto('/login');
	await expect(page.locator('h1')).toContainText('Welcome Back');
	
	// Click sign up link
	await page.getByRole('link', { name: 'Sign up' }).click();
	await page.waitForURL('**/signup');
	await expect(page.locator('h1')).toContainText('Create an Account');
	
	// Click log in link
	await page.getByRole('link', { name: 'Log in' }).click();
	await page.waitForURL('**/login');
	await expect(page.locator('h1')).toContainText('Welcome Back');
});
