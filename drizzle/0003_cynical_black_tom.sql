ALTER TABLE `userConceptMetrics` ADD `conceptName` varchar(255);--> statement-breakpoint
ALTER TABLE `userConceptMetrics` ADD `easeFactor` float DEFAULT 2.5 NOT NULL;--> statement-breakpoint
ALTER TABLE `userConceptMetrics` ADD `interval` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `userConceptMetrics` ADD `repetitions` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userConceptMetrics` ADD `nextReviewDate` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `userConceptMetrics` ADD `lastReviewDate` timestamp;--> statement-breakpoint
ALTER TABLE `userConceptMetrics` ADD `reviewCount` int DEFAULT 0 NOT NULL;