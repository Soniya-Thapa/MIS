-- CreateTable
CREATE TABLE `fee_transaction_category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `amount_paid` DECIMAL(10, 2) NOT NULL,

    INDEX `fee_transaction_category_transaction_id_idx`(`transaction_id`),
    INDEX `fee_transaction_category_category_id_idx`(`category_id`),
    UNIQUE INDEX `fee_transaction_category_transaction_id_category_id_key`(`transaction_id`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `fee_transaction_category` ADD CONSTRAINT `fee_transaction_category_transaction_id_fkey` FOREIGN KEY (`transaction_id`) REFERENCES `fee_transactions`(`transaction_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_transaction_category` ADD CONSTRAINT `fee_transaction_category_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `fee_categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `enrollment` RENAME INDEX `enrollment_fee_structure_id_fkey` TO `enrollment_fee_structure_id_idx`;
