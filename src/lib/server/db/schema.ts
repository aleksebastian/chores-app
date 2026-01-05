import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const homes = sqliteTable('homes', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	shareCode: text('share_code').unique().notNull(),
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	lastMemberLeftAt: integer('last_member_left_at', { mode: 'timestamp' })
});

export const rooms = sqliteTable('rooms', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	homeId: text('home_id')
		.notNull()
		.references(() => homes.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	icon: text('icon'),
	order: integer('order').notNull().default(0),
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

export const users = sqliteTable('users', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	email: text('email').unique().notNull(),
	hashedPassword: text('hashed_password').notNull(),
	name: text('name').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at').notNull()
});

export const homeMemberships = sqliteTable('home_memberships', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	homeId: text('home_id')
		.notNull()
		.references(() => homes.id, { onDelete: 'cascade' }),
	role: text('role', { enum: ['owner', 'member'] }).notNull().default('member'),
	joinedAt: integer('joined_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});
