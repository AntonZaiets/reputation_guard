-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "activeSources" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "brandKeyword" TEXT;
