CREATE TABLE `conceptCulturalHooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conceptId` int NOT NULL,
	`culturalContext` varchar(255) NOT NULL,
	`hook` text NOT NULL,
	`example` text,
	`sensitivityNotes` text,
	`confidence` float DEFAULT 0.7,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`cachedUntil` timestamp NOT NULL,
	CONSTRAINT `conceptCulturalHooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `googleSignInData` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`googleId` varchar(255) NOT NULL,
	`email` varchar(320),
	`name` varchar(255),
	`picture` text,
	`locale` varchar(10),
	`language` varchar(10),
	`region` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `googleSignInData_id` PRIMARY KEY(`id`),
	CONSTRAINT `googleSignInData_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `learnerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cognitiveStyle` varchar(50),
	`primaryProblemFrame` text,
	`culturalContext` varchar(255),
	`culturalContextConfidence` float DEFAULT 0.5,
	`culturalContextSource` varchar(50),
	`meaningMakingPattern` varchar(50),
	`integrationStyle` varchar(50),
	`learningPace` varchar(50),
	`engagementLevel` varchar(50) DEFAULT 'medium',
	`stuckPointMedian` int DEFAULT 0,
	`stuckPointStdDev` int DEFAULT 0,
	`completeness` float DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `learnerSignals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conceptId` int,
	`signalType` enum('question','connection','application','teaching','stuck','breakthrough','feedback') NOT NULL,
	`contentHash` varchar(64),
	`contentSummary` varchar(500),
	`contentLength` int,
	`metadata` json,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learnerSignals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stuckPointBaselines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conceptId` int NOT NULL,
	`timeSpentMedian` int,
	`timeSpentStdDev` int,
	`videoRepeatsMedian` int,
	`questionRepeatsMedian` int,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stuckPointBaselines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `understandingProgression` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`conceptId` int NOT NULL,
	`stage` enum('discovery','exploration','application','mastery','teaching') DEFAULT 'discovery',
	`confidence` float DEFAULT 0,
	`lastStuckAt` timestamp,
	`stuckDuration` int,
	`stuckEvidence` text,
	`butterflyEffects` json,
	`teachingMoments` json,
	`misconceptions` json,
	`questionsAsked` int DEFAULT 0,
	`questionsAvgQuality` float DEFAULT 0,
	`timeSpentSeconds` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `understandingProgression_id` PRIMARY KEY(`id`)
);
