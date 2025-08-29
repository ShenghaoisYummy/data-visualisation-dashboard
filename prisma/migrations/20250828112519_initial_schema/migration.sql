-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."ImportStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PARTIAL');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "invitationCodeUsed" VARCHAR(50),
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invitation_codes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 10,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "department" VARCHAR(100),
    "description" VARCHAR(255),
    "createdBy" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registration_audit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invitationCode" VARCHAR(50) NOT NULL,
    "userEmail" VARCHAR(255) NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),

    CONSTRAINT "registration_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "productId" VARCHAR(50) NOT NULL,
    "productName" VARCHAR(500) NOT NULL,
    "openingInventory" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."daily_data" (
    "id" TEXT NOT NULL,
    "daySequence" INTEGER NOT NULL,
    "procurementQty" INTEGER,
    "procurementPrice" DECIMAL(12,4),
    "salesQty" INTEGER,
    "salesPrice" DECIMAL(12,4),
    "inventoryLevel" INTEGER,
    "procurementAmount" DECIMAL(15,4),
    "salesAmount" DECIMAL(15,4),
    "importBatchId" VARCHAR(50),
    "sourceRow" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT NOT NULL,

    CONSTRAINT "daily_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."import_batches" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "validRows" INTEGER NOT NULL,
    "skippedRows" INTEGER NOT NULL,
    "status" "public"."ImportStatus" NOT NULL DEFAULT 'PROCESSING',
    "errorSummary" JSONB,
    "processingTimeMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "public"."users"("status");

-- CreateIndex
CREATE INDEX "users_invitationCodeUsed_idx" ON "public"."users"("invitationCodeUsed");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_codes_code_key" ON "public"."invitation_codes"("code");

-- CreateIndex
CREATE INDEX "invitation_codes_code_isActive_idx" ON "public"."invitation_codes"("code", "isActive");

-- CreateIndex
CREATE INDEX "invitation_codes_expiresAt_isActive_idx" ON "public"."invitation_codes"("expiresAt", "isActive");

-- CreateIndex
CREATE INDEX "invitation_codes_department_idx" ON "public"."invitation_codes"("department");

-- CreateIndex
CREATE INDEX "registration_audit_invitationCode_idx" ON "public"."registration_audit"("invitationCode");

-- CreateIndex
CREATE INDEX "registration_audit_registeredAt_idx" ON "public"."registration_audit"("registeredAt");

-- CreateIndex
CREATE INDEX "products_userId_idx" ON "public"."products"("userId");

-- CreateIndex
CREATE INDEX "products_userId_productId_idx" ON "public"."products"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "products_userId_productId_key" ON "public"."products"("userId", "productId");

-- CreateIndex
CREATE INDEX "daily_data_productId_daySequence_idx" ON "public"."daily_data"("productId", "daySequence");

-- CreateIndex
CREATE INDEX "daily_data_importBatchId_idx" ON "public"."daily_data"("importBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_data_productId_daySequence_key" ON "public"."daily_data"("productId", "daySequence");

-- CreateIndex
CREATE INDEX "import_batches_userId_createdAt_idx" ON "public"."import_batches"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."registration_audit" ADD CONSTRAINT "registration_audit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_data" ADD CONSTRAINT "daily_data_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."import_batches" ADD CONSTRAINT "import_batches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
