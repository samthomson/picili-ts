ALTER TABLE `picili`.`tags` ADD UNIQUE `prevent_dup_tags` (`file_id`, `type`, `subtype`, `value`); 