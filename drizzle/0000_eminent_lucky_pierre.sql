CREATE TABLE `chores` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`title` text NOT NULL,
	`frequency_weeks` integer DEFAULT 1 NOT NULL,
	`last_completed_at` integer,
	`created_at` integer,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `homes` (
	`id` text PRIMARY KEY NOT NULL,
	`share_code` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `homes_share_code_unique` ON `homes` (`share_code`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`home_id` text NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`created_at` integer,
	FOREIGN KEY (`home_id`) REFERENCES `homes`(`id`) ON UPDATE no action ON DELETE cascade
);
