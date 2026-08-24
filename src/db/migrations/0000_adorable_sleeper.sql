CREATE TABLE `internal_user_roles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`role_id` text NOT NULL,
	`assigned_by_user_id` text,
	`assigned_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `internal_user_roles_role_idx` ON `internal_user_roles` (`role_id`);--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_resource_action_unique` ON `permissions` (`resource`,`action`);--> statement-breakpoint
CREATE INDEX `permissions_resource_idx` ON `permissions` (`resource`);--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` text NOT NULL,
	`permission_id` text NOT NULL,
	`granted_by_user_id` text,
	`created_at` text NOT NULL,
	PRIMARY KEY(`role_id`, `permission_id`),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`granted_by_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `role_permissions_permission_idx` ON `role_permissions` (`permission_id`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`audience` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "roles_audience_check" CHECK("roles"."audience" in ('internal', 'client'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_key_unique` ON `roles` (`key`);--> statement-breakpoint
CREATE INDEX `roles_audience_idx` ON `roles` (`audience`);--> statement-breakpoint
CREATE TABLE `user_permission_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text,
	`permission_id` text NOT NULL,
	`effect` text NOT NULL,
	`reason` text,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	`expires_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "user_permission_overrides_effect_check" CHECK("user_permission_overrides"."effect" in ('grant', 'restriction'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_permission_overrides_global_unique` ON `user_permission_overrides` (`user_id`,`permission_id`) WHERE "user_permission_overrides"."client_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX `user_permission_overrides_client_unique` ON `user_permission_overrides` (`user_id`,`client_id`,`permission_id`) WHERE "user_permission_overrides"."client_id" is not null;--> statement-breakpoint
CREATE INDEX `user_permission_overrides_lookup_idx` ON `user_permission_overrides` (`user_id`,`client_id`,`permission_id`,`effect`);--> statement-breakpoint
CREATE INDEX `user_permission_overrides_client_idx` ON `user_permission_overrides` (`client_id`);--> statement-breakpoint
CREATE TABLE `client_memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`role_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`assigned_by_user_id` text,
	`joined_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "client_memberships_status_check" CHECK("client_memberships"."status" in ('active', 'inactive'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `client_memberships_user_unique` ON `client_memberships` (`user_id`);--> statement-breakpoint
CREATE INDEX `client_memberships_client_status_idx` ON `client_memberships` (`client_id`,`status`);--> statement-breakpoint
CREATE INDEX `client_memberships_role_idx` ON `client_memberships` (`role_id`);--> statement-breakpoint
CREATE TABLE `employee_client_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`role_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`assigned_by_user_id` text,
	`assigned_at` text NOT NULL,
	`ended_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE cascade ON DELETE restrict,
	FOREIGN KEY (`assigned_by_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "employee_client_assignments_status_check" CHECK("employee_client_assignments"."status" in ('active', 'inactive'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employee_client_assignments_user_client_unique` ON `employee_client_assignments` (`user_id`,`client_id`);--> statement-breakpoint
CREATE INDEX `employee_client_assignments_client_status_idx` ON `employee_client_assignments` (`client_id`,`status`);--> statement-breakpoint
CREATE INDEX `employee_client_assignments_role_idx` ON `employee_client_assignments` (`role_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_user_id` text,
	`client_id` text,
	`event_type` text NOT NULL,
	`resource` text,
	`action` text,
	`target_type` text,
	`target_id` text,
	`outcome` text NOT NULL,
	`reason` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE cascade ON DELETE set null,
	CONSTRAINT "audit_logs_outcome_check" CHECK("audit_logs"."outcome" in ('success', 'failure', 'denied'))
);
--> statement-breakpoint
CREATE INDEX `audit_logs_actor_created_at_idx` ON `audit_logs` (`actor_user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_client_created_at_idx` ON `audit_logs` (`client_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_outcome_created_at_idx` ON `audit_logs` (`outcome`,`created_at`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`client_code` text NOT NULL,
	`name` text NOT NULL,
	`country_code` text NOT NULL,
	`client_type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "clients_country_code_check" CHECK(length("clients"."country_code") = 2),
	CONSTRAINT "clients_status_check" CHECK("clients"."status" in ('active', 'inactive'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_client_code_unique` ON `clients` (`client_code`);--> statement-breakpoint
CREATE INDEX `clients_name_idx` ON `clients` (`name`);--> statement-breakpoint
CREATE INDEX `clients_status_idx` ON `clients` (`status`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`last_seen_at` text NOT NULL,
	`invalidated_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`account_type` text NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`password_hash` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "users_email_normalized_check" CHECK("users"."email" = lower("users"."email")),
	CONSTRAINT "users_username_normalized_check" CHECK("users"."username" is null or "users"."username" = lower("users"."username")),
	CONSTRAINT "users_account_type_check" CHECK("users"."account_type" in ('internal', 'client')),
	CONSTRAINT "users_status_check" CHECK("users"."status" in ('invited', 'active', 'disabled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`) WHERE "users"."username" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_account_type_status_idx` ON `users` (`account_type`,`status`);