import { invalidateSession, deleteSessionCookie } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Redirect to home if accessed via GET
	throw redirect(302, '/');
};

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		if (!locals.session) {
			return fail(401);
		}
		
		await invalidateSession(locals.session.id);
		deleteSessionCookie(cookies);
		
		throw redirect(302, '/login');
	}
};
