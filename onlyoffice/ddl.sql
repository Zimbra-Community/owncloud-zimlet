CREATE TABLE `files` (
  `filekey` varchar(50) COLLATE utf8mb4_bin NOT NULL,
  `path` varchar(2100) COLLATE utf8mb4_bin NOT NULL,
  `owncloud_zimlet_server_path` varchar(300) COLLATE utf8mb4_bin NOT NULL,
  `owncloud_zimlet_password` varchar(100) COLLATE utf8mb4_bin NOT NULL,
  `owncloud_zimlet_username` varchar(100) COLLATE utf8mb4_bin NOT NULL,
  `owncloud_zimlet_server_name` varchar(300) COLLATE utf8mb4_bin NOT NULL,
  `owncloud_zimlet_server_port` int(11) NOT NULL,
  `owncloud_zimlet_oc_folder` varchar(100) COLLATE utf8mb4_bin NOT NULL,
  `created` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;

ALTER TABLE `files`
  ADD PRIMARY KEY (`filekey`,`owncloud_zimlet_username`);
