CREATE TABLE `conceptContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conceptId` int NOT NULL,
	`layer` enum('foundation','deepDive','expert') NOT NULL,
	`content` text NOT NULL,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`version` int NOT NULL DEFAULT 1,
	CONSTRAINT `conceptContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conceptPrerequisites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conceptId` int NOT NULL,
	`prerequisiteId` int NOT NULL,
	`confidence` float NOT NULL DEFAULT 0.5,
	`relationshipType` varchar(50) NOT NULL DEFAULT 'prerequisite',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`cachedUntil` timestamp NOT NULL,
	CONSTRAINT `conceptPrerequisites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conceptRelationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conceptAId` int NOT NULL,
	`conceptBId` int NOT NULL,
	`relationshipType` varchar(50) NOT NULL,
	`strength` float NOT NULL DEFAULT 0.5,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`cachedUntil` timestamp NOT NULL,
	CONSTRAINT `conceptRelationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `concepts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`topicSlug` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `concepts_id` PRIMARY KEY(`id`),
	CONSTRAINT `concepts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `userConceptMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conceptId` int NOT NULL,
	`quizAccuracy` float NOT NULL DEFAULT 0,
	`timeSpentSeconds` int NOT NULL DEFAULT 0,
	`confidenceInferred` float NOT NULL DEFAULT 0,
	`lastInteractionAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userConceptMetrics_id` PRIMARY KEY(`id`)
);
