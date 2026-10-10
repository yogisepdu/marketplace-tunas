-- AlterTable
ALTER TABLE `payments` ADD COLUMN `redirectUrl` VARCHAR(1000) NULL,
    ADD COLUMN `snapToken` VARCHAR(255) NULL;
