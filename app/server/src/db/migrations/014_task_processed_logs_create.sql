CREATE TABLE `task_processed_logs` (
 `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
 `task_type` enum('DROPBOX_SYNC','DROPBOX_FILE_IMPORT','PHYSICAL_FILE','REMOVE_FILE','ADDRESS_LOOKUP','ELEVATION_LOOKUP','PLANT_LOOKUP','OCR_GENERIC','OCR_NUMBERPLATE','SUBJECT_DETECTION') COLLATE utf8_unicode_ci NOT NULL,
 `processing_time` mediumint(10) unsigned NOT NULL,
 `success` tinyint(1) NOT NULL,
 `created_at` datetime NOT NULL,
 PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci