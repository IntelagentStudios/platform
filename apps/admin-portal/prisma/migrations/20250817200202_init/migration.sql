-- CreateTable
CREATE TABLE "public"."licenses" (
    "license_key" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255),
    "created_at" TIMESTAMP(3),
    "used_at" TIMESTAMP(3),
    "domain" VARCHAR(255),
    "site_key" VARCHAR(255),
    "status" VARCHAR(20),
    "subscription_id" VARCHAR(255),
    "last_payment_date" TIMESTAMP(3),
    "next_billing_date" TIMESTAMP(3),
    "subscription_status" VARCHAR(50),
    "customer_name" VARCHAR(255),
    "last_indexed" TIMESTAMP(3),
    "plan" VARCHAR(50),
    "products" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("license_key")
);

-- CreateTable
CREATE TABLE "public"."chatbot_logs" (
    "id" SERIAL NOT NULL,
    "session_id" VARCHAR(255),
    "customer_message" TEXT,
    "chatbot_response" TEXT,
    "timestamp" TIMESTAMP(6),
    "intent_detected" VARCHAR(255),
    "conversation_id" VARCHAR(255),
    "site_key" VARCHAR(255),
    "domain" VARCHAR(255),
    "user_id" VARCHAR(255),
    "role" VARCHAR(50),
    "content" TEXT,
    "created_at" TIMESTAMP(6),

    CONSTRAINT "chatbot_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shared_items" (
    "id" SERIAL NOT NULL,
    "shared_by" VARCHAR(20) NOT NULL,
    "shared_with" VARCHAR(255) NOT NULL,
    "item_type" VARCHAR(50) NOT NULL,
    "item_config" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."domain_licenses" (
    "domain" VARCHAR(255) NOT NULL,
    "license_key" VARCHAR(20) NOT NULL,
    "product_type" VARCHAR(50) NOT NULL,

    CONSTRAINT "domain_licenses_pkey" PRIMARY KEY ("domain","license_key")
);

-- CreateTable
CREATE TABLE "public"."smart_dashboard_insights" (
    "id" SERIAL NOT NULL,
    "license_key" VARCHAR(20) NOT NULL,
    "insight_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "severity" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "smart_dashboard_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."smart_dashboard_requests" (
    "id" SERIAL NOT NULL,
    "license_key" VARCHAR(20) NOT NULL,
    "request_type" VARCHAR(50) NOT NULL,
    "query" TEXT NOT NULL,
    "response" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "smart_dashboard_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "licenses_site_key_key" ON "public"."licenses"("site_key");

-- AddForeignKey
ALTER TABLE "public"."chatbot_logs" ADD CONSTRAINT "chatbot_logs_site_key_fkey" FOREIGN KEY ("site_key") REFERENCES "public"."licenses"("site_key") ON DELETE SET NULL ON UPDATE CASCADE;
