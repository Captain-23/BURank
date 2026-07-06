-- CreateTable
CREATE TABLE "UserStat" (
    "username" TEXT NOT NULL,
    "realName" TEXT,
    "avatar" TEXT,
    "ranking" INTEGER,
    "totalSolved" INTEGER NOT NULL DEFAULT 0,
    "easySolved" INTEGER NOT NULL DEFAULT 0,
    "mediumSolved" INTEGER NOT NULL DEFAULT 0,
    "hardSolved" INTEGER NOT NULL DEFAULT 0,
    "contestRating" INTEGER NOT NULL DEFAULT 0,
    "contestGlobalRanking" INTEGER NOT NULL DEFAULT 0,
    "attendedContestsCount" INTEGER NOT NULL DEFAULT 0,
    "topPercentage" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "email" TEXT,
    "enrollmentNo" TEXT,
    "yearStudying" TEXT,
    "addedAt" TEXT,
    "fetchError" BOOLEAN NOT NULL DEFAULT false,
    "lastFetchedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStat_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "UserStat_totalSolved_idx" ON "UserStat"("totalSolved");
