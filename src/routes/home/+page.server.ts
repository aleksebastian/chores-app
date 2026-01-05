import { db } from '$lib/server/db';
import { homes, rooms, chores } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq, asc } from 'drizzle-orm';
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

	const homeRooms = await db.select().from(rooms).where(eq(rooms.homeId, homeId)).orderBy(asc(rooms.order));
	
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

		// Get current max order
		const existingRooms = await db.select().from(rooms).where(eq(rooms.homeId, homeId));
		const maxOrder = existingRooms.length > 0 ? Math.max(...existingRooms.map(r => r.order)) : -1;

		await db.insert(rooms).values({
			homeId,
			name: name.trim(),
			icon: icon || 'HomeIcon',
			order: maxOrder + 1
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

	reorderRoom: async ({ request, cookies }) => {
		const homeId = cookies.get('homeId');
		if (!homeId) throw redirect(302, '/');

		const data = await request.formData();
		const roomId = data.get('roomId')?.toString();
		const direction = data.get('direction')?.toString();

		if (!roomId || !direction) {
			return fail(400, { error: 'Room ID and direction are required' });
		}

		// Verify room belongs to user's home
		const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
		if (!room || room.homeId !== homeId) {
			return fail(403, { error: 'Unauthorized' });
		}

		// Get all rooms for this home ordered by order
		const allRooms = await db.select().from(rooms).where(eq(rooms.homeId, homeId)).orderBy(asc(rooms.order));
		const currentIndex = allRooms.findIndex(r => r.id === roomId);

		if (currentIndex === -1) {
			return fail(404, { error: 'Room not found' });
		}

		// Determine swap target
		let swapIndex = -1;
		if (direction === 'up' && currentIndex > 0) {
			swapIndex = currentIndex - 1;
		} else if (direction === 'down' && currentIndex < allRooms.length - 1) {
			swapIndex = currentIndex + 1;
		}

		if (swapIndex === -1) {
			return { success: true }; // Already at edge, no-op
		}

		// Swap orders
		const currentRoom = allRooms[currentIndex];
		const swapRoom = allRooms[swapIndex];

		await db.update(rooms).set({ order: swapRoom.order }).where(eq(rooms.id, currentRoom.id));
		await db.update(rooms).set({ order: currentRoom.order }).where(eq(rooms.id, swapRoom.id));

		return { success: true };
	},

	reorderRooms: async ({ request, cookies }) => {
		const homeId = cookies.get('homeId');
		if (!homeId) throw redirect(302, '/');

		const data = await request.formData();
		const roomIdsJson = data.get('roomIds')?.toString();

		if (!roomIdsJson) {
			return fail(400, { error: 'Room IDs are required' });
		}

		const roomIds = JSON.parse(roomIdsJson) as string[];

		// Verify all rooms belong to user's home
		const allRooms = await db.select().from(rooms).where(eq(rooms.homeId, homeId));
		const roomIdSet = new Set(allRooms.map(r => r.id));
		
		for (const roomId of roomIds) {
			if (!roomIdSet.has(roomId)) {
				return fail(403, { error: 'Unauthorized' });
			}
		}

		// Update order for all rooms
		for (let i = 0; i < roomIds.length; i++) {
			await db.update(rooms).set({ order: i }).where(eq(rooms.id, roomIds[i]));
		}

		return { success: true };
	},

	leaveHome: async ({ cookies }) => {
		cookies.delete('homeId', { path: '/' });
		throw redirect(303, '/');
	}
};
