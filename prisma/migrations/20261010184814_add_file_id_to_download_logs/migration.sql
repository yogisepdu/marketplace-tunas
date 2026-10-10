/*
  Warnings:

  - Added the required column `fileId` to the `download_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `download_logs` ADD COLUMN `fileId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `download_logs_fileId_idx` ON `download_logs`(`fileId`);

-- AddForeignKey
ALTER TABLE `download_logs` ADD CONSTRAINT `download_logs_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `product_files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
