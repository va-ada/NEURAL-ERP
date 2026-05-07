-- CreateEnum
CREATE TYPE "PredictionType" AS ENUM ('DROPOUT_RISK', 'PLACEMENT_PROBABILITY');

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "PredictionType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "factors" JSONB NOT NULL,
    "dataMode" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "predictions_studentId_type_generatedAt_idx" ON "predictions"("studentId", "type", "generatedAt");

-- CreateIndex
CREATE INDEX "predictions_type_generatedAt_idx" ON "predictions"("type", "generatedAt");

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
