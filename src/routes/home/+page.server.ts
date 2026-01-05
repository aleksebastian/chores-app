import { db } from '$lib/server/db';
import { homes, rooms, chores } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	const homeId = cookies.get('homeId');

	if (!homeId) {
		throw redirect(302, '/');
	}

	// Fetch home, rooms, and chores
	const [home] = await db.select().from(homes).where(eq(homes.id, homeId));

	if (!home) {
		// Home doesn't exist, clear cookie and redirect
		cookies.delete('homeId', { path: '/' });
		throw redirect(302, '/');
	}

	const homeRooms = await db.select().from(rooms).where(eq(rooms.homeId, homeId));
	
	const allChores = await db.select().from(chores);
	
	// Organize chores by room
	const roomsWithChores = homeRooms.map(room => ({
		...room,
		chores: allChores.filter(chore => chore.roomId === room.id)
	}));

	return {
		home,
		rooms: roomsWithChores
	};
};

export const actions: Actions = {
	createRoom: async ({ request, cookies }) => {
		const homeId = cookies.get('homeId');
		if (!homeId) throw redirect(302, '/');

		const data = await request.formData();
		const name = data.get('name')?.toString();
		const icon = data.get('icon')?.toString();

		if (!name || name.trim().length === 0) {
			return fail(400, { error: 'Room name is required' });
		}

		await db.insert(rooms).values({
			homeId,
			name: name.trim(),
			icon: icon || 'HomeIcon'
		});

		return { success: true };
	},

	deleteRoom: async ({ request, cookies }) => {
		const homeId = cookies.get('homeId');
		if (!homeId) throw redirect(302, '/');

		const data = await request.formData();
		const roomId = data.get('roomId')?.toString();

		if (!roomId) {
			return fail(400, { error: 'Room ID is required' });
		}

		// Verify room belongs to user's home
		const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
		if (!room || room.homeId !== homeId) {
			return fail(403, { error: 'Unauthorized' });
		}

		await db.delete(rooms).where(eq(rooms.id, roomId));

		return { success: true };
	},

	editRoom: async ({ request, cookies }) => {
		const homeId = cookies.get('homeId');
		if (!homeId) throw redirect(302, '/');

		const data = await request.formData();
		const roomId = data.get('roomId')?.toString();
		const name = data.get('name')?.toString();
		const icon = data.get('icon')?.toString();

		if (!roomId || !name || name.trim().length === 0) {
			return fail(400, { error: 'Room ID and name are required' });
		}

		// Verify room belongs to user's home
		const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
		if (!room || room.homeId !== homeId) {
			return fail(403, { error: 'Unauthorized' });
		}

		await db
			.update(rooms)
			.set({
				name: name.trim(),
				icon: icon || 'HomeIcon'
			})
			.where(eq(rooms.id, roomId));

		return { success: true };
	},

	createChore: async ({ request, cookies }) => {
		const homeId = cookies.get('homeId');
		if (!homeId) throw redirect(302, '/');

		const data = await request.formData();
		const roomId = data.get('roomId')?.toString();
		const title = data.get('title')?.toString();
		const frequencyWeeks = parseInt(data.get('frequencyWeeks')?.toString() || '1');

		if (!roomId || !title || title.trim().length === 0) {
			return fail(400, { error: 'Room and title are required' });
		}

		// Verify room belongs to user's home
		const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
		if (!room || room.homeId !== homeId) {
			return fail(403, { error: 'Unauthorized' });
		}

		await db.insert(chores).values({
			roomId,
			title: title.trim(),
			frequencyWeeks: Math.max(1, Math.min(52, frequencyWeeks))
		});

		return { success: true };
	},

	completeChore: async ({ request, cookies }) => {
		const homeId = cookies.get('homeId');
		if (!homeId) throw redirect(302, '/');

		const data = await request.formData();
		const choreId = data.get('choreId')?.toString();

		if (!choreId) {
			return fail(400, { error: 'Chore ID is required' });
		}

		// Verify chore belongs to user's home
		const [chore] = await db.select().from(chores).where(eq(chores.id, choreId));
		if (!chore) {
			return fail(404, { error: 'Chore not found' });
		}

		const [room] = await db.select().from(rooms).where(eq(rooms.id, chore.roomId));
		if (!room || room.homeId !== homeId) {
			return fail(403, { error: 'Unauthorized' });
		}

		await db
			.update(chores)
			.set({ lastCompletedAt: new Date() })
			.where(eq(chores.id, choreId));

		return { success: true };
	},

	deleteChore: async ({ request, cookies }) => {
		const homeId = cookies.get('homeId');
		if (!homeId) throw redirect(302, '/');

		const data = await request.formData();
		const choreId = data.get('choreId')?.toString();

		if (!choreId) {
			return fail(400, { error: 'Chore ID is required' });
		}

		// Verify chore belongs to user's home
		const [chore] = await db.select().from(chores).where(eq(chores.id, choreId));
		if (!chore) {
			return fail(404, { error: 'Chore not found' });
		}

		const [room] = await db.select().from(rooms).where(eq(rooms.id, chore.roomId));
		if (!room || room.homeId !== homeId) {
			return fail(403, { error: 'Unauthorized' });
		}

		await db.delete(chores).where(eq(chores.id, choreId));

		return { success: true };
	},

	editChore: async ({ request, cookies }) => {
		const homeId = cookies.get('homeId');
		if (!homeId) throw redirect(302, '/');

		const data = await request.formData();
		const choreId = data.get('choreId')?.toString();
		const title = data.get('title')?.toString();
		const frequencyWeeks = parseInt(data.get('frequencyWeeks')?.toString() || '1');

		if (!choreId || !title || title.trim().length === 0) {
			return fail(400, { error: 'Chore ID and title are required' });
		}

		// Verify chore belongs to user's home
		const [chore] = await db.select().from(chores).where(eq(chores.id, choreId));
		if (!chore) {
			return fail(404, { error: 'Chore not found' });
		}

		const [room] = await db.select().from(rooms).where(eq(rooms.id, chore.roomId));
		if (!room || room.homeId !== homeId) {
			return fail(403, { error: 'Unauthorized' });
		}

		await db
			.update(chores)
			.set({
				title: title.trim(),
				frequencyWeeks: Math.max(1, Math.min(52, frequencyWeeks))
			})
			.where(eq(chores.id, choreId));

		return { success: true };
	},

	leaveHome: async ({ cookies }) => {
		cookies.delete('homeId', { path: '/' });
		throw redirect(303, '/');
	}
};
