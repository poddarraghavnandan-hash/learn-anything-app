CREATE TABLE `contentItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`type` enum('video','article') NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`url` text NOT NULL,
	`thumbnailUrl` text,
	`source` varchar(100) NOT NULL,
	`channelOrAuthor` varchar(255),
	`durationSeconds` int,
	`topicSlug` varchar(100),
	`qualityScore` float DEFAULT 0.5,
	`publishedAt` varchar(50),
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `contentItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`name` varchar(100) NOT NULL,
	`emoji` varchar(10) NOT NULL,
	`category` varchar(50) NOT NULL,
	`searchKeywords` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `topics_id` PRIMARY KEY(`id`),
	CONSTRAINT `topics_slug_unique` UNIQUE(`slug`)
);
