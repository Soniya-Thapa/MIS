-- CreateTable
CREATE TABLE `subjects` (
    `subject_id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_code` VARCHAR(20) NOT NULL,
    `subject_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `semester_id` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `image` VARCHAR(191) NULL,

    UNIQUE INDEX `subjects_subject_code_key`(`subject_code`),
    INDEX `subjects_created_by_fkey`(`created_by`),
    INDEX `subjects_semester_id_fkey`(`semester_id`),
    PRIMARY KEY (`subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chapter` (
    `chapter_id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject_id` INTEGER NOT NULL,
    `chapter_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `chapter_number` INTEGER NOT NULL,

    INDEX `Chapter_created_by_fkey`(`created_by`),
    INDEX `Chapter_subject_id_fkey`(`subject_id`),
    PRIMARY KEY (`chapter_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course` (
    `course_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_code` VARCHAR(20) NOT NULL,
    `course_name` VARCHAR(100) NOT NULL,
    `college_id` INTEGER NULL,
    `description` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `image` VARCHAR(191) NULL,

    UNIQUE INDEX `Course_course_code_key`(`course_code`),
    INDEX `Course_created_by_fkey`(`created_by`),
    INDEX `course_college_id_idx`(`college_id`),
    PRIMARY KEY (`course_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollment` (
    `enrollment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `course_id` INTEGER NOT NULL,
    `batch_id` INTEGER NULL,
    `fee_structure_id` INTEGER NOT NULL,
    `enrollment_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `current_semester` INTEGER NOT NULL,
    `status_id` INTEGER NOT NULL DEFAULT 1,
    `batchBatch_id` INTEGER NULL,

    UNIQUE INDEX `Enrollment_student_id_key`(`student_id`),
    INDEX `Enrollment_course_id_fkey`(`course_id`),
    INDEX `enrollment_batch_id_idx`(`batch_id`),
    INDEX `Enrollment_status_id_fkey`(`status_id`),
    UNIQUE INDEX `Enrollment_student_id_course_id_key`(`student_id`, `course_id`),
    PRIMARY KEY (`enrollment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollmentstatus` (
    `status_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EnrollmentStatus_name_key`(`name`),
    PRIMARY KEY (`status_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `materialtype` (
    `material_type_id` INTEGER NOT NULL AUTO_INCREMENT,
    `type_name` ENUM('Notes', 'Assignment', 'Video', 'Presentation', 'Quiz', 'Other') NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `MaterialType_type_name_key`(`type_name`),
    PRIMARY KEY (`material_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resource` (
    `resource_id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `semester` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `creator_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,

    INDEX `Resource_creator_id_fkey`(`creator_id`),
    INDEX `Resource_subject_id_fkey`(`subject_id`),
    PRIMARY KEY (`resource_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `role_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semester` (
    `semester_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `semester_number` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `semester_name` VARCHAR(50) NOT NULL,
    `user_id` INTEGER NOT NULL,

    INDEX `Semester_course_id_fkey`(`course_id`),
    INDEX `Semester_user_id_fkey`(`user_id`),
    PRIMARY KEY (`semester_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `studymaterial` (
    `material_id` INTEGER NOT NULL AUTO_INCREMENT,
    `topic_id` INTEGER NULL,
    `material_type_id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `chapter_id` INTEGER NULL,
    `file_size` INTEGER NOT NULL,
    `file_type` VARCHAR(191) NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `semester_id` INTEGER NULL,

    INDEX `StudyMaterial_chapter_id_idx`(`chapter_id`),
    INDEX `StudyMaterial_material_type_id_idx`(`material_type_id`),
    INDEX `StudyMaterial_semester_id_idx`(`semester_id`),
    INDEX `StudyMaterial_subject_id_idx`(`subject_id`),
    INDEX `StudyMaterial_topic_id_idx`(`topic_id`),
    INDEX `StudyMaterial_user_id_idx`(`user_id`),
    PRIMARY KEY (`material_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `topic` (
    `topic_id` INTEGER NOT NULL AUTO_INCREMENT,
    `chapter_id` INTEGER NOT NULL,
    `topic_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `topic_number` INTEGER NOT NULL,

    INDEX `Topic_chapter_id_fkey`(`chapter_id`),
    INDEX `Topic_created_by_fkey`(`created_by`),
    PRIMARY KEY (`topic_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NULL,
    `role_id` INTEGER NULL,
    `phone` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `image` TEXT NULL,
    `verification_token` VARCHAR(255) NULL,
    `phone_verified` BOOLEAN NOT NULL DEFAULT false,
    `blocked_until` DATETIME(3) NULL,
    `failed_attempts` INTEGER NOT NULL DEFAULT 0,
    `is_blocked` BOOLEAN NOT NULL DEFAULT false,
    `current_semester` INTEGER NULL,
    `full_name` VARCHAR(50) NOT NULL,
    `isTemporaryPassword` BOOLEAN NOT NULL DEFAULT false,
    `password_reset_token` TEXT NULL,
    `password_reset_expires` DATETIME(3) NULL,
    `date_of_birth` DATETIME(3) NULL,
    `father_name` VARCHAR(100) NULL,
    `gender` ENUM('male', 'female', 'other') NOT NULL,
    `created_by` INTEGER NULL,
    `contact_address` INTEGER NULL,
    `permanent_address` INTEGER NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_role_id_fkey`(`role_id`),
    INDEX `user_created_by_idx`(`created_by`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_subject_assignments` (
    `assignment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacher_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `assigned_by` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `teacher_subject_assignments_teacher_id_idx`(`teacher_id`),
    INDEX `teacher_subject_assignments_subject_id_idx`(`subject_id`),
    INDEX `teacher_subject_assignments_assigned_by_idx`(`assigned_by`),
    UNIQUE INDEX `teacher_subject_assignments_teacher_id_subject_id_key`(`teacher_id`, `subject_id`),
    PRIMARY KEY (`assignment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batches` (
    `batch_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `batch_year` INTEGER NOT NULL,
    `batch_name` VARCHAR(50) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `batches_course_id_idx`(`course_id`),
    INDEX `batches_batch_year_idx`(`batch_year`),
    INDEX `batches_is_active_idx`(`is_active`),
    UNIQUE INDEX `batches_course_id_batch_year_key`(`course_id`, `batch_year`),
    PRIMARY KEY (`batch_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `result_statuses` (
    `status_id` INTEGER NOT NULL AUTO_INCREMENT,
    `status_name` VARCHAR(20) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `result_statuses_status_name_key`(`status_name`),
    PRIMARY KEY (`status_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_results` (
    `result_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `semester_id` INTEGER NOT NULL,
    `batch_id` INTEGER NOT NULL,
    `academic_year` VARCHAR(20) NOT NULL,
    `exam_date` DATETIME(3) NULL,
    `result_status_id` INTEGER NOT NULL,
    `attempt_number` INTEGER NOT NULL DEFAULT 1,
    `is_latest` BOOLEAN NOT NULL DEFAULT true,
    `remarks` TEXT NULL,
    `uploaded_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `exam_results_student_id_idx`(`student_id`),
    INDEX `exam_results_subject_id_idx`(`subject_id`),
    INDEX `exam_results_semester_id_idx`(`semester_id`),
    INDEX `exam_results_batch_id_idx`(`batch_id`),
    INDEX `exam_results_result_status_id_idx`(`result_status_id`),
    INDEX `exam_results_is_latest_idx`(`is_latest`),
    INDEX `exam_results_academic_year_idx`(`academic_year`),
    INDEX `exam_results_uploaded_by_idx`(`uploaded_by`),
    UNIQUE INDEX `exam_results_student_id_subject_id_semester_id_attempt_numbe_key`(`student_id`, `subject_id`, `semester_id`, `attempt_number`),
    PRIMARY KEY (`result_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_structures` (
    `fee_structure_id` INTEGER NOT NULL AUTO_INCREMENT,
    `course_id` INTEGER NOT NULL,
    `batch_year` INTEGER NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `duration_years` INTEGER NOT NULL,
    `total_semesters` INTEGER NOT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `fee_structures_course_id_idx`(`course_id`),
    INDEX `fee_structures_created_by_idx`(`created_by`),
    UNIQUE INDEX `fee_structures_course_id_batch_year_key`(`course_id`, `batch_year`),
    PRIMARY KEY (`fee_structure_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_categories` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `created_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `fee_categories_category_name_key`(`category_name`),
    INDEX `fee_categories_created_by_idx`(`created_by`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_structure_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fee_structure_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `per_semester` BOOLEAN NOT NULL DEFAULT true,

    INDEX `fee_structure_categories_fee_structure_id_idx`(`fee_structure_id`),
    INDEX `fee_structure_categories_category_id_idx`(`category_id`),
    UNIQUE INDEX `fee_structure_categories_fee_structure_id_category_id_key`(`fee_structure_id`, `category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_transactions` (
    `transaction_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `semester_id` INTEGER NOT NULL,
    `amount_paid` DECIMAL(10, 2) NOT NULL,
    `payment_date` DATETIME(3) NOT NULL,
    `payment_method` VARCHAR(50) NULL,
    `reference_number` VARCHAR(100) NULL,
    `remarks` TEXT NULL,
    `recorded_by` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fee_transactions_student_id_idx`(`student_id`),
    INDEX `fee_transactions_semester_id_idx`(`semester_id`),
    INDEX `fee_transactions_recorded_by_idx`(`recorded_by`),
    PRIMARY KEY (`transaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scholarships` (
    `scholarship_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `semester_id` INTEGER NOT NULL,
    `scholarship_type` VARCHAR(100) NOT NULL,
    `percentage` DECIMAL(5, 2) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `reason` TEXT NULL,
    `awarded_by` INTEGER NOT NULL,
    `awarded_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `scholarships_student_id_idx`(`student_id`),
    INDEX `scholarships_semester_id_idx`(`semester_id`),
    INDEX `scholarships_awarded_by_idx`(`awarded_by`),
    PRIMARY KEY (`scholarship_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_ranks` (
    `rank_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `semester_id` INTEGER NOT NULL,
    `rank` INTEGER NOT NULL,
    `total_marks` DECIMAL(6, 2) NULL,
    `percentage` DECIMAL(5, 2) NULL,
    `calculated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `student_ranks_semester_id_idx`(`semester_id`),
    INDEX `student_ranks_rank_idx`(`rank`),
    UNIQUE INDEX `student_ranks_student_id_semester_id_key`(`student_id`, `semester_id`),
    PRIMARY KEY (`rank_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `backlogs` (
    `backlog_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `failed_semester_id` INTEGER NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `cleared_semester_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cleared_at` DATETIME(3) NULL,

    INDEX `backlogs_student_id_idx`(`student_id`),
    INDEX `backlogs_subject_id_idx`(`subject_id`),
    INDEX `backlogs_status_idx`(`status`),
    UNIQUE INDEX `backlogs_student_id_subject_id_failed_semester_id_key`(`student_id`, `subject_id`, `failed_semester_id`),
    PRIMARY KEY (`backlog_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `areas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `city_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `city_id`(`city_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `district_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `district_id`(`district_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `districts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `province_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `province_id`(`province_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provinces` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(10) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `universities` (
    `university_id` INTEGER NOT NULL AUTO_INCREMENT,
    `university_code` VARCHAR(20) NOT NULL,
    `university_name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `established_year` INTEGER NULL,
    `university_type` ENUM('PUBLIC', 'PRIVATE', 'DEEMED', 'CENTRAL', 'STATE', 'AUTONOMOUS') NOT NULL DEFAULT 'PUBLIC',
    `address` INTEGER NULL,
    `website` VARCHAR(255) NULL,
    `contact_email` VARCHAR(100) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `logo_url` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `universities_university_code_key`(`university_code`),
    INDEX `universities_university_type_idx`(`university_type`),
    INDEX `universities_is_active_idx`(`is_active`),
    PRIMARY KEY (`university_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `colleges` (
    `college_id` INTEGER NOT NULL AUTO_INCREMENT,
    `college_code` VARCHAR(20) NOT NULL,
    `college_name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `university_id` INTEGER NULL,
    `established_year` INTEGER NULL,
    `college_type` ENUM('AFFILIATED', 'AUTONOMOUS', 'CONSTITUENT', 'GOVERNMENT', 'PRIVATE', 'AIDED', 'UNAIDED') NOT NULL DEFAULT 'AFFILIATED',
    `address` INTEGER NULL,
    `website` VARCHAR(255) NULL,
    `contact_email` VARCHAR(100) NULL,
    `contact_phone` VARCHAR(20) NULL,
    `logo_url` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `colleges_college_code_key`(`college_code`),
    INDEX `colleges_university_id_idx`(`university_id`),
    INDEX `colleges_college_type_idx`(`college_type`),
    INDEX `colleges_is_active_idx`(`is_active`),
    PRIMARY KEY (`college_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_records` (
    `record_id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `record_type` ENUM('PRIMARY', 'SECONDARY', 'DIPLOMA', 'UNDERGRADUATE', 'POSTGRADUATE', 'DOCTORATE', 'CERTIFICATE', 'OTHER') NOT NULL,
    `qualification_name` VARCHAR(100) NOT NULL,
    `board_name` VARCHAR(100) NULL,
    `school_college_name` VARCHAR(150) NOT NULL,
    `year_of_passing` INTEGER NOT NULL,
    `grade_type` ENUM('MARKS', 'PERCENTAGE', 'CGPA', 'GPA', 'GRADE', 'DIVISION') NOT NULL DEFAULT 'PERCENTAGE',
    `marks_obtained` DECIMAL(8, 2) NULL,
    `total_marks` DECIMAL(8, 2) NULL,
    `percentage` DECIMAL(5, 2) NULL,
    `cgpa` DECIMAL(4, 2) NULL,
    `grade` VARCHAR(10) NULL,
    `subjects_stream` VARCHAR(100) NULL,
    `medium_of_study` VARCHAR(50) NULL,
    `remarks` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `university_id` INTEGER NULL,
    `college_id` INTEGER NULL,

    INDEX `academic_records_student_id_idx`(`student_id`),
    INDEX `academic_records_record_type_idx`(`record_type`),
    INDEX `academic_records_year_of_passing_idx`(`year_of_passing`),
    INDEX `academic_records_university_id_idx`(`university_id`),
    INDEX `academic_records_college_id_idx`(`college_id`),
    PRIMARY KEY (`record_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `academic_documents` (
    `document_id` INTEGER NOT NULL AUTO_INCREMENT,
    `academic_record_id` INTEGER NOT NULL,
    `document_type` ENUM('MARKSHEET', 'CERTIFICATE', 'PROVISIONAL', 'MIGRATION', 'CHARACTER', 'TRANSCRIPT', 'DEGREE', 'DIPLOMA_CERT', 'OTHER') NOT NULL,
    `document_name` VARCHAR(150) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_url` TEXT NOT NULL,
    `file_size` INTEGER NULL,
    `file_type` VARCHAR(50) NOT NULL,
    `is_original` BOOLEAN NOT NULL DEFAULT false,
    `uploaded_by` INTEGER NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `remarks` TEXT NULL,

    INDEX `academic_documents_academic_record_id_idx`(`academic_record_id`),
    INDEX `academic_documents_document_type_idx`(`document_type`),
    INDEX `academic_documents_uploaded_by_idx`(`uploaded_by`),
    PRIMARY KEY (`document_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_usersubjects` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_usersubjects_AB_unique`(`A`, `B`),
    INDEX `_usersubjects_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_userchapters` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_userchapters_AB_unique`(`A`, `B`),
    INDEX `_userchapters_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_resourcetouser` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_resourcetouser_AB_unique`(`A`, `B`),
    INDEX `_resourcetouser_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_usertopics` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_usertopics_AB_unique`(`A`, `B`),
    INDEX `_usertopics_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CollegeUsers` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CollegeUsers_AB_unique`(`A`, `B`),
    INDEX `_CollegeUsers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`semester_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapter` ADD CONSTRAINT `Chapter_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapter` ADD CONSTRAINT `Chapter_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course` ADD CONSTRAINT `Course_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course` ADD CONSTRAINT `course_college_id_fkey` FOREIGN KEY (`college_id`) REFERENCES `colleges`(`college_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment` ADD CONSTRAINT `Enrollment_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `course`(`course_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment` ADD CONSTRAINT `Enrollment_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `enrollmentstatus`(`status_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment` ADD CONSTRAINT `Enrollment_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment` ADD CONSTRAINT `enrollment_batchBatch_id_fkey` FOREIGN KEY (`batchBatch_id`) REFERENCES `batches`(`batch_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollment` ADD CONSTRAINT `enrollment_fee_structure_id_fkey` FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures`(`fee_structure_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resource` ADD CONSTRAINT `Resource_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resource` ADD CONSTRAINT `Resource_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semester` ADD CONSTRAINT `Semester_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `course`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semester` ADD CONSTRAINT `Semester_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studymaterial` ADD CONSTRAINT `StudyMaterial_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapter`(`chapter_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studymaterial` ADD CONSTRAINT `StudyMaterial_material_type_id_fkey` FOREIGN KEY (`material_type_id`) REFERENCES `materialtype`(`material_type_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studymaterial` ADD CONSTRAINT `StudyMaterial_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`semester_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studymaterial` ADD CONSTRAINT `StudyMaterial_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studymaterial` ADD CONSTRAINT `StudyMaterial_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topic`(`topic_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `studymaterial` ADD CONSTRAINT `StudyMaterial_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topic` ADD CONSTRAINT `Topic_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapter`(`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `topic` ADD CONSTRAINT `Topic_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `User_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `role`(`role_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_contact_address_fkey` FOREIGN KEY (`contact_address`) REFERENCES `areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_permanent_address_fkey` FOREIGN KEY (`permanent_address`) REFERENCES `areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_subject_assignments` ADD CONSTRAINT `teacher_subject_assignments_teacher_id_fkey` FOREIGN KEY (`teacher_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_subject_assignments` ADD CONSTRAINT `teacher_subject_assignments_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_subject_assignments` ADD CONSTRAINT `teacher_subject_assignments_assigned_by_fkey` FOREIGN KEY (`assigned_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `batches` ADD CONSTRAINT `batches_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `course`(`course_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`semester_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `batches`(`batch_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_result_status_id_fkey` FOREIGN KEY (`result_status_id`) REFERENCES `result_statuses`(`status_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_results` ADD CONSTRAINT `exam_results_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `course`(`course_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structures` ADD CONSTRAINT `fee_structures_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_categories` ADD CONSTRAINT `fee_categories_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structure_categories` ADD CONSTRAINT `fee_structure_categories_fee_structure_id_fkey` FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures`(`fee_structure_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_structure_categories` ADD CONSTRAINT `fee_structure_categories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `fee_categories`(`category_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_transactions` ADD CONSTRAINT `fee_transactions_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_transactions` ADD CONSTRAINT `fee_transactions_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`semester_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_transactions` ADD CONSTRAINT `fee_transactions_recorded_by_fkey` FOREIGN KEY (`recorded_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scholarships` ADD CONSTRAINT `scholarships_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scholarships` ADD CONSTRAINT `scholarships_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`semester_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scholarships` ADD CONSTRAINT `scholarships_awarded_by_fkey` FOREIGN KEY (`awarded_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_ranks` ADD CONSTRAINT `student_ranks_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_ranks` ADD CONSTRAINT `student_ranks_semester_id_fkey` FOREIGN KEY (`semester_id`) REFERENCES `semester`(`semester_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backlogs` ADD CONSTRAINT `backlogs_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backlogs` ADD CONSTRAINT `backlogs_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`subject_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backlogs` ADD CONSTRAINT `backlogs_failed_semester_id_fkey` FOREIGN KEY (`failed_semester_id`) REFERENCES `semester`(`semester_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `backlogs` ADD CONSTRAINT `backlogs_cleared_semester_id_fkey` FOREIGN KEY (`cleared_semester_id`) REFERENCES `semester`(`semester_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `areas` ADD CONSTRAINT `areas_ibfk_1` FOREIGN KEY (`city_id`) REFERENCES `cities`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cities` ADD CONSTRAINT `cities_ibfk_1` FOREIGN KEY (`district_id`) REFERENCES `districts`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `districts` ADD CONSTRAINT `districts_ibfk_1` FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `universities` ADD CONSTRAINT `universities_area_id_fkey` FOREIGN KEY (`address`) REFERENCES `areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `colleges` ADD CONSTRAINT `College_university_id_fkey` FOREIGN KEY (`university_id`) REFERENCES `universities`(`university_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `colleges` ADD CONSTRAINT `university_area_id_fkey` FOREIGN KEY (`address`) REFERENCES `areas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_records` ADD CONSTRAINT `academic_records_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_documents` ADD CONSTRAINT `academic_documents_academic_record_id_fkey` FOREIGN KEY (`academic_record_id`) REFERENCES `academic_records`(`record_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `academic_documents` ADD CONSTRAINT `academic_documents_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_usersubjects` ADD CONSTRAINT `_usersubjects_A_fkey` FOREIGN KEY (`A`) REFERENCES `subjects`(`subject_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_usersubjects` ADD CONSTRAINT `_usersubjects_B_fkey` FOREIGN KEY (`B`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_userchapters` ADD CONSTRAINT `_userchapters_A_fkey` FOREIGN KEY (`A`) REFERENCES `chapter`(`chapter_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_userchapters` ADD CONSTRAINT `_userchapters_B_fkey` FOREIGN KEY (`B`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_resourcetouser` ADD CONSTRAINT `_resourcetouser_A_fkey` FOREIGN KEY (`A`) REFERENCES `resource`(`resource_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_resourcetouser` ADD CONSTRAINT `_resourcetouser_B_fkey` FOREIGN KEY (`B`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_usertopics` ADD CONSTRAINT `_usertopics_A_fkey` FOREIGN KEY (`A`) REFERENCES `topic`(`topic_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_usertopics` ADD CONSTRAINT `_usertopics_B_fkey` FOREIGN KEY (`B`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CollegeUsers` ADD CONSTRAINT `_CollegeUsers_A_fkey` FOREIGN KEY (`A`) REFERENCES `colleges`(`college_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CollegeUsers` ADD CONSTRAINT `_CollegeUsers_B_fkey` FOREIGN KEY (`B`) REFERENCES `user`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
