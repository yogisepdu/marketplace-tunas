-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 12, 2026 at 04:05 PM
-- Server version: 5.7.39
-- PHP Version: 8.3.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `marketplace_tunas`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `passwordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','EDITOR') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EDITOR',
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `lastLoginAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `name`, `email`, `passwordHash`, `role`, `status`, `lastLoginAt`, `createdAt`, `updatedAt`) VALUES
(1, 'Administrator', 'admin@marketplace-tunas.test', '$2b$12$V4kqKvYBtnZtapnqYwJD1OeEBsMwTbQ6uRx.yhchg8JaBS7evRonO', 'ADMIN', 'ACTIVE', NULL, '2026-10-12 13:51:25.937', '2026-10-12 13:51:25.937'),
(2, 'Retno Ang', 'retnoang@gmail.com', '$2b$12$zcGBjw.3npg3/1dCLutjx.59qUxu9OKlpSDLP/5IssZGSKq5qvq0u', 'EDITOR', 'ACTIVE', NULL, '2026-10-12 13:51:25.966', '2026-10-12 13:51:25.966');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `studyProgramId` int(11) NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` int(11) DEFAULT NULL,
  `credits` int(11) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `whatsapp` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `download_logs`
--

CREATE TABLE `download_logs` (
  `id` int(11) NOT NULL,
  `productAccessId` int(11) NOT NULL,
  `ipAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` text COLLATE utf8mb4_unicode_ci,
  `status` enum('SUCCESS','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `fileId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_notifications`
--

CREATE TABLE `email_notifications` (
  `id` int(11) NOT NULL,
  `orderId` int(11) NOT NULL,
  `recipient` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','PROCESSING','SENT','FAILED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `attempts` int(11) NOT NULL DEFAULT '0',
  `sentAt` datetime(3) DEFAULT NULL,
  `lastError` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `orderNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` int(11) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `discountAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `totalAmount` decimal(12,2) NOT NULL,
  `status` enum('PENDING','PAID','EXPIRED','CANCELLED','FAILED','REFUNDED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `paidAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `orderId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `productTitle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unitPrice` decimal(12,2) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT '1',
  `subtotal` decimal(12,2) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `orderId` int(11) NOT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transactionId` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderIdProvider` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paymentType` enum('QRIS','BANK_TRANSFER','VIRTUAL_ACCOUNT','E_WALLET','CREDIT_CARD','OTHER') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transactionStatus` enum('PENDING','SETTLEMENT','CAPTURE','EXPIRE','CANCEL','DENY','FAILURE','REFUND') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `grossAmount` decimal(12,2) NOT NULL,
  `transactionTime` datetime(3) DEFAULT NULL,
  `settlementTime` datetime(3) DEFAULT NULL,
  `fraudStatus` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signatureKeyVerified` tinyint(1) NOT NULL DEFAULT '0',
  `rawResponse` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `redirectUrl` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snapToken` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_notifications`
--

CREATE TABLE `payment_notifications` (
  `id` int(11) NOT NULL,
  `paymentId` int(11) DEFAULT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notificationKey` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transactionId` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderIdProvider` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statusCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transactionStatus` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fraudStatus` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signatureValid` tinyint(1) NOT NULL DEFAULT '0',
  `payload` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `processedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `courseId` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(12,2) NOT NULL,
  `thumbnail` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('DRAFT','ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_accesses`
--

CREATE TABLE `product_accesses` (
  `id` int(11) NOT NULL,
  `orderId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `accessToken` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('ACTIVE','REVOKED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE',
  `expiresAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_files`
--

CREATE TABLE `product_files` (
  `id` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `fileName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filePath` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fileSize` int(11) DEFAULT NULL,
  `mimeType` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `study_programs`
--

CREATE TABLE `study_programs` (
  `id` int(11) NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `admin_users_email_key` (`email`),
  ADD KEY `admin_users_status_idx` (`status`),
  ADD KEY `admin_users_role_idx` (`role`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `courses_studyProgramId_code_key` (`studyProgramId`,`code`),
  ADD KEY `courses_studyProgramId_idx` (`studyProgramId`),
  ADD KEY `courses_isActive_idx` (`isActive`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customers_email_idx` (`email`);

--
-- Indexes for table `download_logs`
--
ALTER TABLE `download_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `download_logs_productAccessId_idx` (`productAccessId`),
  ADD KEY `download_logs_createdAt_idx` (`createdAt`),
  ADD KEY `download_logs_fileId_idx` (`fileId`);

--
-- Indexes for table `email_notifications`
--
ALTER TABLE `email_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email_notifications_orderId_idx` (`orderId`),
  ADD KEY `email_notifications_status_idx` (`status`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `orders_orderNumber_key` (`orderNumber`),
  ADD KEY `orders_customerId_idx` (`customerId`),
  ADD KEY `orders_status_idx` (`status`),
  ADD KEY `orders_createdAt_idx` (`createdAt`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_items_orderId_idx` (`orderId`),
  ADD KEY `order_items_productId_idx` (`productId`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payments_transactionId_key` (`transactionId`),
  ADD KEY `payments_orderId_idx` (`orderId`),
  ADD KEY `payments_transactionStatus_idx` (`transactionStatus`),
  ADD KEY `payments_provider_idx` (`provider`);

--
-- Indexes for table `payment_notifications`
--
ALTER TABLE `payment_notifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_notifications_notificationKey_key` (`notificationKey`),
  ADD KEY `payment_notifications_paymentId_idx` (`paymentId`),
  ADD KEY `payment_notifications_transactionId_idx` (`transactionId`),
  ADD KEY `payment_notifications_createdAt_idx` (`createdAt`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `products_slug_key` (`slug`),
  ADD KEY `products_courseId_idx` (`courseId`),
  ADD KEY `products_status_idx` (`status`);

--
-- Indexes for table `product_accesses`
--
ALTER TABLE `product_accesses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_accesses_accessToken_key` (`accessToken`),
  ADD UNIQUE KEY `product_accesses_orderId_productId_key` (`orderId`,`productId`),
  ADD KEY `product_accesses_productId_idx` (`productId`),
  ADD KEY `product_accesses_status_idx` (`status`),
  ADD KEY `product_accesses_expiresAt_idx` (`expiresAt`);

--
-- Indexes for table `product_files`
--
ALTER TABLE `product_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_files_productId_idx` (`productId`);

--
-- Indexes for table `study_programs`
--
ALTER TABLE `study_programs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `study_programs_code_key` (`code`),
  ADD KEY `study_programs_isActive_idx` (`isActive`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `download_logs`
--
ALTER TABLE `download_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `email_notifications`
--
ALTER TABLE `email_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_notifications`
--
ALTER TABLE `payment_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_accesses`
--
ALTER TABLE `product_accesses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_files`
--
ALTER TABLE `product_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `study_programs`
--
ALTER TABLE `study_programs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `courses`
--
ALTER TABLE `courses`
  ADD CONSTRAINT `courses_studyProgramId_fkey` FOREIGN KEY (`studyProgramId`) REFERENCES `study_programs` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `download_logs`
--
ALTER TABLE `download_logs`
  ADD CONSTRAINT `download_logs_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `product_files` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `download_logs_productAccessId_fkey` FOREIGN KEY (`productAccessId`) REFERENCES `product_accesses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `email_notifications`
--
ALTER TABLE `email_notifications`
  ADD CONSTRAINT `email_notifications_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `payment_notifications`
--
ALTER TABLE `payment_notifications`
  ADD CONSTRAINT `payment_notifications_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `product_accesses`
--
ALTER TABLE `product_accesses`
  ADD CONSTRAINT `product_accesses_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `product_accesses_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `product_files`
--
ALTER TABLE `product_files`
  ADD CONSTRAINT `product_files_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
