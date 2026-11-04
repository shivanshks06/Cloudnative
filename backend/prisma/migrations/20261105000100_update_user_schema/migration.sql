-- 1. Create the current Role enum and migrate existing values.
CREATE TYPE "Role_new" AS ENUM ('MANAGER', 'DEVELOPER', 'ADMIN');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "User"
ALTER COLUMN "role" TYPE "Role_new"
USING (
    CASE
        WHEN "role"::text = 'MEMBER' THEN 'DEVELOPER'
        ELSE "role"::text
    END
)::"Role_new";

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "User"
ALTER COLUMN "role" SET DEFAULT 'DEVELOPER';

-- 2. Add username and preserve existing users.
ALTER TABLE "User" ADD COLUMN "username" TEXT;

UPDATE "User"
SET "username" =
    COALESCE(
        NULLIF(
            regexp_replace(
                lower(split_part("email", '@', 1)),
                '[^a-z0-9_-]',
                '',
                'g'
            ),
            ''
        ),
        'user'
    ) || '_' || replace("id", '-', '');

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- 3. Create additional enums.
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TYPE "RequestType" AS ENUM (
    'EXTEND_DEADLINE',
    'REASSIGN_TASK',
    'BLOCKED'
);

CREATE TYPE "RequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

-- 4. Add missing Task columns.
ALTER TABLE "Task"
ADD COLUMN "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN "estimatedHours" INTEGER DEFAULT 4,
ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- 5. Create Notification.
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_read_idx"
ON "Notification"("userId", "read");

ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Create TaskRequest.
CREATE TABLE "TaskRequest" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "reason" TEXT NOT NULL,
    "suggestedDate" TIMESTAMP(3),
    "suggestedHours" INTEGER,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TaskRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskRequest_taskId_idx"
ON "TaskRequest"("taskId");

CREATE INDEX "TaskRequest_userId_status_idx"
ON "TaskRequest"("userId", "status");

ALTER TABLE "TaskRequest"
ADD CONSTRAINT "TaskRequest_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "Task"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TaskRequest"
ADD CONSTRAINT "TaskRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

