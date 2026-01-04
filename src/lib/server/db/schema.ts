import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const homes = sqliteTable('homes', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	shareCode: text('share_code').unique().notNull(),
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const rooms = sqliteTable('rooms', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	homeId: text('home_id')
		.notNull()
		.references(() => homes.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const chores = sqliteTable('chores', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	roomId: text('room_id')
		.notNull()
		.references(() => rooms.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	frequencyWeeks: integer('frequency_weeks').notNull().default(1),
	lastCompletedAt: integer('last_completed_at', { mode: 'timestamp' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});
