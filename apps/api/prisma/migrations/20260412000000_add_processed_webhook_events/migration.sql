-- CreateTable
CREATE TABLE "processed_webhook_events" (
    "stripe_event_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("stripe_event_id")
);
