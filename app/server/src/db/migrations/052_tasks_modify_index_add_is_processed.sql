ALTER TABLE `picili`.`tasks` DROP INDEX `prevent_dup_type_file`, ADD UNIQUE `prevent_dup_type_file` (`task_type`, `related_picili_file_id`, `is_processed`) USING BTREE;