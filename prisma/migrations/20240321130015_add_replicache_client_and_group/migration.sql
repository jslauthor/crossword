-- CreateTable
CREATE TABLE "replicache_client_groups" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cvr_version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replicache_client_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replicache_clients" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "last_mutation_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replicache_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "progresses_puzzleId_idx" ON "progresses"("puzzleId");

-- AddForeignKey
ALTER TABLE "replicache_client_groups" ADD CONSTRAINT "replicache_client_groups_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replicache_clients" ADD CONSTRAINT "replicache_clients_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "replicache_client_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
