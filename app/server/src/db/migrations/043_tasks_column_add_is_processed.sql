ALTER TABLE `tasks` ADD `is_processed` BOOLEAN NOT NULL DEFAULT FALSE AFTER `created_at`;