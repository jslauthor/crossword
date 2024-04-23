-- CreateTable
CREATE TABLE "progresses" (
    "id" TEXT NOT NULL,
    "puzzleId" TEXT NOT NULL,
    "state" BYTEA NOT NULL,
    "userId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "progresses_id_key" ON "progresses"("id");

-- CreateIndex
CREATE INDEX "progresses_userId_idx" ON "progresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "progresses_puzzleId_userId_key" ON "progresses"("puzzleId", "userId");

-- AddForeignKey
ALTER TABLE "progresses" ADD CONSTRAINT "progresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
