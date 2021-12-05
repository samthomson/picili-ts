CREATE TABLE `tags` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `file_id` int(10) UNSIGNED NOT NULL,
  `type` varchar(16) COLLATE utf8_unicode_ci NOT NULL,
  `subtype` varchar(16) NOT NULL,
  `value` varchar(128) NOT NULL,
  `confidence` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=3;