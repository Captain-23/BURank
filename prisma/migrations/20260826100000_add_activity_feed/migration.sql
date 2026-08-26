-- CreateTable
CREATE TABLE "Problem" (
    "titleSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "frontendId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("titleSlug")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "realName" TEXT NOT NULL,
    "avatar" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "titleSlug" TEXT NOT NULL,
    "frontendId" TEXT NOT NULL DEFAULT '',
    "difficulty" TEXT NOT NULL,
    "solvedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityEvent_solvedAt_idx" ON "ActivityEvent"("solvedAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_username_idx" ON "ActivityEvent"("username");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityEvent_username_titleSlug_solvedAt_key" ON "ActivityEvent"("username", "titleSlug", "solvedAt");
