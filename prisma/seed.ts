import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create Admin User (ADMIN)
    const adminPassword = await bcrypt.hash("12345678", 10);
    await prisma.user.upsert({
        where: { userId: "ADMIN" },
        update: {},
        create: {
            userId: "ADMIN",
            username: "Admin",
            password: adminPassword,
            email: "admin@spwms.com",
            role: 9,
            branchCode: "HQ",
            status: "ACTIVE",
        },
    });
    console.log("✅ Created admin user (ADMIN)");

    // Create Administrator User (ADMINISTRATOR)
    const administratorPassword = await bcrypt.hash("12345678", 10);
    await prisma.user.upsert({
        where: { userId: "ADMINISTRATOR" },
        update: {},
        create: {
            userId: "ADMINISTRATOR",
            username: "Administrator",
            password: administratorPassword,
            email: "administrator@spwms.com",
            role: 9,
            branchCode: "HQ",
            status: "ACTIVE",
        },
    });
    console.log("✅ Created administrator user (ADMINISTRATOR)");

    // Create Normal User
    const userPassword = await bcrypt.hash("12345678", 10);
    await prisma.user.upsert({
        where: { userId: "USER01" },
        update: {},
        create: {
            userId: "USER01",
            username: "Test User",
            password: userPassword,
            email: "user@spwms.com",
            role: 1,
            branchCode: "HQ",
            status: "ACTIVE",
        },
    });
    console.log("✅ Created test user");

    // Create Branch
    await prisma.branch.upsert({
        where: { branchCode: "HQ" },
        update: {},
        create: {
            branchCode: "HQ",
            branchName: "สำนักงานใหญ่",
            status: "ACTIVE",
        },
    });
    console.log("✅ Created branch");

    // Create Warehouse
    await prisma.warehouse.upsert({
        where: { whCode: "WH01" },
        update: {},
        create: {
            whCode: "WH01",
            whName: "คลังสินค้าหลัก",
            branchCode: "HQ",
            status: "ACTIVE",
        },
    });
    console.log("✅ Created warehouse");

    // Create Location
    await prisma.location.upsert({
        where: { whCode_locCode: { whCode: "WH01", locCode: "A01" } },
        update: {},
        create: {
            whCode: "WH01",
            locCode: "A01",
            locName: "โซน A ชั้น 1",
            status: "ACTIVE",
        },
    });
    console.log("✅ Created location");

    // Create UOM
    const uoms = [
        { uomCode: "PCS", uomName: "ชิ้น" },
        { uomCode: "BOX", uomName: "กล่อง" },
        { uomCode: "CTN", uomName: "ลัง" },
        { uomCode: "KG", uomName: "กิโลกรัม" },
    ];
    for (const uom of uoms) {
        await prisma.uOM.upsert({
            where: { uomCode: uom.uomCode },
            update: {},
            create: { ...uom, status: "ACTIVE" },
        });
    }
    console.log("✅ Created UOMs");

    // Create Principal
    await prisma.principal.upsert({
        where: { principalCode: "PRIN01" },
        update: {},
        create: {
            principalCode: "PRIN01",
            principalName: "ซัพพลายเออร์หลัก",
            status: "ACTIVE",
        },
    });
    console.log("✅ Created principal");

    // Create Brand
    await prisma.brand.upsert({
        where: { brandCode: "BRAND01" },
        update: {},
        create: {
            brandCode: "BRAND01",
            brandName: "แบรนด์หลัก",
            status: "ACTIVE",
        },
    });
    console.log("✅ Created brand");

    // Create Document Types
    const docTypes = [
        { docTypeCode: "GR", docTypeName: "ใบรับสินค้า", movementType: "IN" },
        { docTypeCode: "GI", docTypeName: "ใบเบิกสินค้า", movementType: "OUT" },
        { docTypeCode: "TF", docTypeName: "ใบโอนสินค้า", movementType: "OUT" },
    ];
    for (const docType of docTypes) {
        await prisma.documentType.upsert({
            where: { docTypeCode: docType.docTypeCode },
            update: {},
            create: { ...docType, status: "ACTIVE" },
        });
    }
    console.log("✅ Created document types");

    // Create Sample Products
    const products = [
        { productCode: "PROD001", productName: "สินค้าทดสอบ 1", principalCode: "PRIN01", brandCode: "BRAND01", baseUomCode: "PCS" },
        { productCode: "PROD002", productName: "สินค้าทดสอบ 2", principalCode: "PRIN01", brandCode: "BRAND01", baseUomCode: "BOX" },
        { productCode: "PROD003", productName: "สินค้าทดสอบ 3", principalCode: "PRIN01", brandCode: "BRAND01", baseUomCode: "CTN" },
    ];
    for (const product of products) {
        await prisma.product.upsert({
            where: { productCode: product.productCode },
            update: {},
            create: { ...product, status: "ACTIVE" },
        });
    }
    console.log("✅ Created sample products");

    console.log("🎉 Seeding completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
