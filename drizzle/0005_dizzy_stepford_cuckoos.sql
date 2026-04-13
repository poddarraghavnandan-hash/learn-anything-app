CREATE TABLE `knowledge_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`topicId` int NOT NULL,
	`topicName` varchar(255) NOT NULL,
	`assessmentType` varchar(50) NOT NULL,
	`assessmentMethod` varchar(50),
	`score` int,
	`timeSpent` int,
	`questionsAttempted` int,
	`questionsCorrect` int,
	`conceptsMastered` json,
	`conceptsPartiallyMastered` json,
	`conceptsNotMastered` json,
	`misconceptions` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_behavior_patterns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`patternType` varchar(50) NOT NULL,
	`patternName` varchar(255) NOT NULL,
	`description` text,
	`patternData` json,
	`confidence` int,
	`occurrenceCount` int,
	`lastObservedAt` timestamp,
	`effectivenessScore` int,
	`predictiveValue` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_behavior_patterns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_behavior_signals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`topicId` int NOT NULL,
	`approachId` int NOT NULL,
	`timeSpentSeconds` int NOT NULL,
	`attentionDropoffs` int DEFAULT 0,
	`revisitCount` int DEFAULT 0,
	`completionPercentage` int,
	`scrollDepth` int,
	`interactionCount` int,
	`pauseResumePattern` json,
	`assessmentScore` int,
	`mistakesCount` int,
	`hintUsageCount` int,
	`clarificationQuestionsCount` int,
	`averageReadingSpeed` float,
	`averageClickSpeed` float,
	`pauseBetweenActivities` int,
	`rushingIndicators` int,
	`selfReportedConfidence` int,
	`inferredConfidence` int,
	`hesitationCount` int,
	`correctionAttempts` int,
	`engagementType` varchar(50),
	`engagementScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_behavior_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_context` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`age` int,
	`educationLevel` varchar(50),
	`generalKnowledgeLevel` int,
	`technicalKnowledgeLevel` int,
	`languageProficiency` varchar(50),
	`primaryGoal` varchar(255),
	`secondaryGoals` json,
	`timeAvailable` int,
	`targetCompletionDate` timestamp,
	`naturalStrengths` json,
	`naturalWeaknesses` json,
	`preferredSubjects` json,
	`avoidedSubjects` json,
	`previousLearningExperiences` text,
	`successfulLearningStrategies` json,
	`failedLearningStrategies` json,
	`currentMood` varchar(50),
	`currentStressLevel` int,
	`currentFocusLevel` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_context_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_context_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `learning_style_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`visualLearning` float,
	`kinestheticLearning` float,
	`auditoryLearning` float,
	`readingWritingLearning` float,
	`socialEngagement` float,
	`competitiveEngagement` float,
	`creativeEngagement` float,
	`discoveryEngagement` float,
	`preferredPace` varchar(50),
	`preferredSessionLength` int,
	`preferredBreakFrequency` int,
	`preferredComplexity` varchar(50),
	`preferredStructure` varchar(50),
	`preferredFeedback` varchar(50),
	`primaryMotivator` varchar(50),
	`secondaryMotivator` varchar(50),
	`baselineConfidence` int,
	`confidenceGrowthRate` float,
	`confidenceDecayRate` float,
	`averageAttentionSpan` int,
	`attentionDecayRate` float,
	`recoveryTime` int,
	`conceptRetentionRate` float,
	`transferabilityScore` float,
	`errorRecoverySpeed` float,
	`profileStrength` int,
	`lastUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_style_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learning_style_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `user_approach_effectiveness` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`approachId` int NOT NULL,
	`totalExperiences` int DEFAULT 0,
	`averageEngagement` float,
	`averageComprehension` float,
	`averageRetention` float,
	`averageConfidence` float,
	`overallEffectiveness` float,
	`improvementTrend` float,
	`consistencyScore` float,
	`predictabilityScore` float,
	`bestForTopicTypes` json,
	`bestForDifficultyLevels` json,
	`bestForTimeOfDay` json,
	`bestForSessionLength` json,
	`userPreference` int,
	`userNotes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_approach_effectiveness_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approach_combinations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`approachIds` json NOT NULL,
	`weights` json NOT NULL,
	`effectiveness` float,
	`experimentCount` int DEFAULT 0,
	`discoveredAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp,
	CONSTRAINT `approach_combinations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approach_effectiveness_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`approachId` int NOT NULL,
	`totalExperiments` int DEFAULT 0,
	`averageEngagement` float,
	`averageComprehension` float,
	`averageRetention` float,
	`averageApplication` float,
	`averageConfidence` float,
	`overallScore` float,
	`scoreImprovement` float,
	`consistencyScore` float,
	`userPreference` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approach_effectiveness_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approach_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`topicId` int NOT NULL,
	`recommendedApproachId` int NOT NULL,
	`recommendationReason` text NOT NULL,
	`confidence` int,
	`basedOnMetrics` json,
	`status` varchar(50) DEFAULT 'pending',
	`acceptedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approach_recommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_approach_experiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`topicId` int NOT NULL,
	`topicName` varchar(255) NOT NULL,
	`approachId` int NOT NULL,
	`experimentSequence` int NOT NULL,
	`isRandomized` boolean DEFAULT true,
	`engagementScore` int,
	`comprehensionScore` int,
	`retentionScore` int,
	`applicationScore` int,
	`confidenceScore` int,
	`overallEffectiveness` int,
	`timeSpentSeconds` int,
	`attentionDropoffs` int,
	`completionPercentage` int,
	`revisitCount` int,
	`userRating` int,
	`userNotes` text,
	`status` varchar(50) DEFAULT 'in_progress',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `learning_approach_experiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_approaches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`displayName` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(50) NOT NULL,
	`icon` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_approaches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`relatedApproachId` int,
	`relatedTopicId` int,
	`metricValue` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stagnation_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`stagnationType` varchar(50) NOT NULL,
	`stagnationScore` int,
	`detectedAt` timestamp NOT NULL DEFAULT (now()),
	`innovationApproach` varchar(50),
	`innovationDescription` text,
	`resolutionScore` int,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stagnation_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_learning_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`preferredApproaches` json NOT NULL DEFAULT ('[]'),
	`learningStyle` varchar(50),
	`pacePreference` varchar(50),
	`engagementLevel` int,
	`confidenceLevel` int,
	`lastApproachChangeAt` timestamp,
	`lastInnovationAt` timestamp,
	`stagnationScore` int DEFAULT 0,
	`totalLessonsCompleted` int DEFAULT 0,
	`totalHoursLearned` float DEFAULT 0,
	`approachExperimentsCompleted` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_learning_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_learning_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `adaptationMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`adaptationId` int NOT NULL,
	`contentRelevanceScore` float,
	`difficultyCalibration` float,
	`learningOutcome` float,
	`userEngagement` float,
	`totalTimeSpentSeconds` int DEFAULT 0,
	`estimatedTimeSeconds` int DEFAULT 0,
	`timeAccuracy` float,
	`lessonsCompleted` int DEFAULT 0,
	`lessonsSkipped` int DEFAULT 0,
	`completionRate` float,
	`continuationSelected` boolean DEFAULT false,
	`continuationCompleted` boolean DEFAULT false,
	`userRating` int,
	`userFeedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adaptationMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentGenerationCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(255) NOT NULL,
	`contentLevel` int NOT NULL,
	`sophisticationScore` float NOT NULL,
	`title` varchar(255) NOT NULL,
	`introduction` text NOT NULL,
	`mainContent` text NOT NULL,
	`keyPoints` json NOT NULL,
	`examples` json NOT NULL,
	`checkYourUnderstanding` json,
	`nextSteps` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`usageCount` int DEFAULT 0,
	`lastUsedAt` timestamp,
	CONSTRAINT `contentGenerationCache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `continuationHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`adaptationId` int NOT NULL,
	`lessonProgressId` int,
	`continuationType` enum('go_deeper','related_concepts','teach_it','apply_it','review') NOT NULL,
	`targetTopic` varchar(255),
	`targetLevel` int,
	`targetConcept` varchar(255),
	`selectedAt` timestamp NOT NULL DEFAULT (now()),
	`engagedAt` timestamp,
	`completedAt` timestamp,
	`timeSpentSeconds` int DEFAULT 0,
	`satisfaction` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `continuationHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessonProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`adaptationId` int NOT NULL,
	`lessonOrder` int NOT NULL,
	`lessonTitle` varchar(255) NOT NULL,
	`lessonDescription` text,
	`lessonLevel` int NOT NULL,
	`status` enum('not_started','in_progress','completed','skipped') DEFAULT 'not_started',
	`timeSpentSeconds` int DEFAULT 0,
	`quizAccuracy` float,
	`quizAttempts` int DEFAULT 0,
	`contentViewed` boolean DEFAULT false,
	`videoWatched` boolean DEFAULT false,
	`quizTaken` boolean DEFAULT false,
	`difficultyAdjusted` boolean DEFAULT false,
	`adjustmentReason` varchar(255),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessonProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prerequisiteFulfillment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`adaptationId` int NOT NULL,
	`prerequisiteTopic` varchar(255) NOT NULL,
	`mainTopic` varchar(255) NOT NULL,
	`status` enum('not_required','required_not_met','required_met','micro_lesson_offered','micro_lesson_completed') DEFAULT 'required_not_met',
	`microLessonGenerated` boolean DEFAULT false,
	`microLessonAccepted` boolean DEFAULT false,
	`microLessonCompletedAt` timestamp,
	`prerequisiteQuizScore` float,
	`timeSpentSeconds` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prerequisiteFulfillment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAdaptations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userQuery` text NOT NULL,
	`topic` varchar(255) NOT NULL,
	`detectedIntent` enum('foundational','comprehensive','deep_dive','expert','practical') NOT NULL,
	`sophisticationLevel` enum('beginner','intermediate','advanced','expert') NOT NULL,
	`sophisticationScore` float NOT NULL,
	`detectedPrerequisites` json DEFAULT ('[]'),
	`userKnowledgeLevel` int NOT NULL,
	`readinessScore` float NOT NULL,
	`knowledgeGaps` json DEFAULT ('[]'),
	`recommendedContentLevel` int NOT NULL,
	`contentGeneratedAt` timestamp,
	`sequenceGenerated` boolean DEFAULT false,
	`lessonCount` int DEFAULT 0,
	`continuationOptionsGenerated` boolean DEFAULT false,
	`videoLessonGenerated` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `userAdaptations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoLessonPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adaptationId` int NOT NULL,
	`topic` varchar(255) NOT NULL,
	`contentLevel` int NOT NULL,
	`videoStyle` enum('educational','entertaining','professional') DEFAULT 'educational',
	`videoScript` text NOT NULL,
	`sceneCount` int NOT NULL,
	`estimatedDurationSeconds` int NOT NULL,
	`scenes` json NOT NULL,
	`keyFrames` json,
	`animations` json,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`videoGeneratedAt` timestamp,
	`videoUrl` text,
	`viewCount` int DEFAULT 0,
	`completionRate` float,
	`userSatisfaction` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoLessonPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_assessment_user` ON `knowledge_assessments` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_assessment_topic` ON `knowledge_assessments` (`topicId`);--> statement-breakpoint
CREATE INDEX `idx_pattern_user` ON `learning_behavior_patterns` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_behavior_user` ON `learning_behavior_signals` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_behavior_topic` ON `learning_behavior_signals` (`topicId`);--> statement-breakpoint
CREATE INDEX `idx_behavior_approach` ON `learning_behavior_signals` (`approachId`);--> statement-breakpoint
CREATE INDEX `idx_user_approach_eff` ON `user_approach_effectiveness` (`userId`,`approachId`);--> statement-breakpoint
CREATE INDEX `idx_user_combinations` ON `approach_combinations` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_user_approach` ON `approach_effectiveness_scores` (`userId`,`approachId`);--> statement-breakpoint
CREATE INDEX `idx_rec_user` ON `approach_recommendations` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_rec_topic` ON `approach_recommendations` (`topicId`);--> statement-breakpoint
CREATE INDEX `idx_user_experiments` ON `learning_approach_experiments` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_topic_experiments` ON `learning_approach_experiments` (`topicId`);--> statement-breakpoint
CREATE INDEX `idx_approach_experiments` ON `learning_approach_experiments` (`approachId`);--> statement-breakpoint
CREATE INDEX `idx_milestone_user` ON `learning_milestones` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_stagnation_user` ON `stagnation_events` (`userId`);