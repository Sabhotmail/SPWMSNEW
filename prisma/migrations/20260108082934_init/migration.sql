-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "username" VARCHAR(200) NOT NULL,
    "password" TEXT NOT NULL,
    "email" VARCHAR(100),
    "role" INTEGER NOT NULL DEFAULT 1,
    "branch_code" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "password_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "branch_code" VARCHAR(20) NOT NULL,
    "branch_name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "principals" (
    "id" SERIAL NOT NULL,
    "principal_code" VARCHAR(20) NOT NULL,
    "principal_name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "principals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "brand_code" VARCHAR(20) NOT NULL,
    "brand_name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uoms" (
    "id" SERIAL NOT NULL,
    "uom_code" VARCHAR(20) NOT NULL,
    "uom_name" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "product_code" VARCHAR(50) NOT NULL,
    "product_name" VARCHAR(200) NOT NULL,
    "principal_code" VARCHAR(20),
    "brand_code" VARCHAR(20),
    "base_uom_code" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_uoms" (
    "id" SERIAL NOT NULL,
    "product_code" VARCHAR(50) NOT NULL,
    "uom_code" VARCHAR(20) NOT NULL,
    "conversion_rate" DECIMAL(18,4) NOT NULL DEFAULT 1,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_uoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" SERIAL NOT NULL,
    "wh_code" VARCHAR(20) NOT NULL,
    "wh_name" VARCHAR(100) NOT NULL,
    "branch_code" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "wh_code" VARCHAR(20) NOT NULL,
    "loc_code" VARCHAR(20) NOT NULL,
    "loc_name" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" SERIAL NOT NULL,
    "doc_type_code" VARCHAR(20) NOT NULL,
    "doc_type_name" VARCHAR(100) NOT NULL,
    "movement_type" VARCHAR(10) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_numbers" (
    "id" SERIAL NOT NULL,
    "doc_type_code" VARCHAR(20) NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_types" (
    "id" SERIAL NOT NULL,
    "movement_type_code" VARCHAR(20) NOT NULL,
    "movement_type_name" VARCHAR(100) NOT NULL,
    "direction" VARCHAR(10) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movement_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_headers" (
    "id" SERIAL NOT NULL,
    "doc_no" VARCHAR(50) NOT NULL,
    "doc_type_code" VARCHAR(20) NOT NULL,
    "doc_date" TIMESTAMP(3) NOT NULL,
    "post_date" TIMESTAMP(3) NOT NULL,
    "wh_code" VARCHAR(20) NOT NULL,
    "remark" TEXT,
    "doc_status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "doc_state" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    "created_by" VARCHAR(50) NOT NULL,
    "approved_by" VARCHAR(50),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_headers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_details" (
    "id" SERIAL NOT NULL,
    "doc_no" VARCHAR(50) NOT NULL,
    "line_no" INTEGER NOT NULL,
    "product_code" VARCHAR(50) NOT NULL,
    "uom_code" VARCHAR(20) NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL,
    "mfg_date" TIMESTAMP(3),
    "exp_date" TIMESTAMP(3),
    "lot_no" VARCHAR(50),
    "remark" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" SERIAL NOT NULL,
    "product_code" VARCHAR(50) NOT NULL,
    "wh_code" VARCHAR(20) NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_dates" (
    "id" SERIAL NOT NULL,
    "product_code" VARCHAR(50) NOT NULL,
    "wh_code" VARCHAR(20) NOT NULL,
    "mfg_date" TIMESTAMP(3) NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baskets" (
    "id" SERIAL NOT NULL,
    "session_id" VARCHAR(100) NOT NULL,
    "product_code" VARCHAR(50) NOT NULL,
    "uom_code" VARCHAR(20) NOT NULL,
    "qty" DECIMAL(18,4) NOT NULL,
    "mfg_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baskets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_id_key" ON "users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "branches_branch_code_key" ON "branches"("branch_code");

-- CreateIndex
CREATE UNIQUE INDEX "principals_principal_code_key" ON "principals"("principal_code");

-- CreateIndex
CREATE UNIQUE INDEX "brands_brand_code_key" ON "brands"("brand_code");

-- CreateIndex
CREATE UNIQUE INDEX "uoms_uom_code_key" ON "uoms"("uom_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_product_code_key" ON "products"("product_code");

-- CreateIndex
CREATE UNIQUE INDEX "product_uoms_product_code_uom_code_key" ON "product_uoms"("product_code", "uom_code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_wh_code_key" ON "warehouses"("wh_code");

-- CreateIndex
CREATE UNIQUE INDEX "locations_wh_code_loc_code_key" ON "locations"("wh_code", "loc_code");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_doc_type_code_key" ON "document_types"("doc_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "document_numbers_doc_type_code_year_key" ON "document_numbers"("doc_type_code", "year");

-- CreateIndex
CREATE UNIQUE INDEX "movement_types_movement_type_code_key" ON "movement_types"("movement_type_code");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_headers_doc_no_key" ON "transaction_headers"("doc_no");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_details_doc_no_line_no_key" ON "transaction_details"("doc_no", "line_no");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_product_code_wh_code_key" ON "stocks"("product_code", "wh_code");

-- CreateIndex
CREATE UNIQUE INDEX "stock_dates_product_code_wh_code_mfg_date_key" ON "stock_dates"("product_code", "wh_code", "mfg_date");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_principal_code_fkey" FOREIGN KEY ("principal_code") REFERENCES "principals"("principal_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_code_fkey" FOREIGN KEY ("brand_code") REFERENCES "brands"("brand_code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_uoms" ADD CONSTRAINT "product_uoms_product_code_fkey" FOREIGN KEY ("product_code") REFERENCES "products"("product_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_uoms" ADD CONSTRAINT "product_uoms_uom_code_fkey" FOREIGN KEY ("uom_code") REFERENCES "uoms"("uom_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_wh_code_fkey" FOREIGN KEY ("wh_code") REFERENCES "warehouses"("wh_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_numbers" ADD CONSTRAINT "document_numbers_doc_type_code_fkey" FOREIGN KEY ("doc_type_code") REFERENCES "document_types"("doc_type_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_headers" ADD CONSTRAINT "transaction_headers_doc_type_code_fkey" FOREIGN KEY ("doc_type_code") REFERENCES "document_types"("doc_type_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_headers" ADD CONSTRAINT "transaction_headers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_details" ADD CONSTRAINT "transaction_details_doc_no_fkey" FOREIGN KEY ("doc_no") REFERENCES "transaction_headers"("doc_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_details" ADD CONSTRAINT "transaction_details_product_code_fkey" FOREIGN KEY ("product_code") REFERENCES "products"("product_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_product_code_fkey" FOREIGN KEY ("product_code") REFERENCES "products"("product_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_wh_code_fkey" FOREIGN KEY ("wh_code") REFERENCES "warehouses"("wh_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_dates" ADD CONSTRAINT "stock_dates_product_code_fkey" FOREIGN KEY ("product_code") REFERENCES "products"("product_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_dates" ADD CONSTRAINT "stock_dates_wh_code_fkey" FOREIGN KEY ("wh_code") REFERENCES "warehouses"("wh_code") ON DELETE RESTRICT ON UPDATE CASCADE;
