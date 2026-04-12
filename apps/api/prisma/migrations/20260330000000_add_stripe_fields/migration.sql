-- AlterTable
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" TEXT,
ADD COLUMN "stripe_price_id" TEXT,
ADD COLUMN "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");
