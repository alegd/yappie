-- AlterTable: add nullable first for backfill
ALTER TABLE "tickets" ADD COLUMN "user_id" TEXT;

-- Backfill: copy userId from the parent audio recording
UPDATE "tickets" t
SET "user_id" = ar."user_id"
FROM "audio_recordings" ar
WHERE t."audio_recording_id" = ar."id";

-- Make column required after backfill
ALTER TABLE "tickets" ALTER COLUMN "user_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "tickets_user_id_idx" ON "tickets"("user_id");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
