import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { signTestToken } from "./utils/auth.helper";
import { createTestApp } from "./utils/setup";

describe("Categories Module (E2E) - Admin RBAC ve Public Rotalar", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let normalUser: any;
  let adminUser: any;
  let normalToken: string;
  let adminToken: string;
  let testCategory: any;

  beforeAll(async () => {
    // 1. Setup fonksiyonunu çağırıp App, Prisma ve standart Şifreyi alıyoruz (DB temizliği otomatik yapılır)
    const setupResult = await createTestApp();
    app = setupResult.app;
    prisma = setupResult.prisma;
    const hashedPassword = setupResult.hashedPassword;

    // 2. Bu teste özel verileri oluşturuyoruz
    normalUser = await prisma.user.create({
      data: {
        email: "normal_categories@test.com",
        name: "Normal",
        username: "normal_cat",
        password: hashedPassword,
        role: "USER",
      },
    });

    adminUser = await prisma.user.create({
      data: {
        email: "admin_categories@test.com",
        name: "Admin",
        username: "admin_cat",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    // 3. Tokenları üretiyoruz
    normalToken = signTestToken({
      sub: normalUser.id,
      email: normalUser.email,
      role: normalUser.role,
    });

    adminToken = signTestToken({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it("1. 🚨 Normal kullanıcı (USER) kategori OLUŞTURAMAMALI", async () => {
    const userRes = await request(app.getHttpServer())
      .post("/categories")
      .set("Authorization", `Bearer ${normalToken}`)
      .send({ name: "Hacker Kategori" });
    expect(userRes.status).toBe(403);
  });

  it("2. 🔒 Admin kullanıcısı kategori OLUŞTURABİLMELİ", async () => {
    const response = await request(app.getHttpServer())
      .post("/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Yapay Zeka" });
    expect(response.status).toBe(201);
    testCategory = response.body;
  });

  it("2b. 🚨 Aynı isimde ikinci kategori oluşturulamamalı (409 Conflict)", async () => {
    const response = await request(app.getHttpServer())
      .post("/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Yapay Zeka" });
    expect(response.status).toBe(409);
  });

  it("3. 🔓 Herkes (Tokensız) kategorileri LİSTELEYEBİLMELİ", async () => {
    const response = await request(app.getHttpServer())
      .get("/categories")
      .send();
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some((c: any) => c.id === testCategory.id)).toBe(true);
  });

  it("4. 🔓 Herkes ID ile tekil kategoriyi GÖREBİLMELİ", async () => {
    const idRes = await request(app.getHttpServer()).get(
      `/categories/${testCategory.id}`
    );
    expect(idRes.status).toBe(200);
  });

  it("4b. 🚨 Var olmayan ID için 404 dönmeli", async () => {
    const response = await request(app.getHttpServer()).get(
      "/categories/00000000-0000-0000-0000-000000000000"
    );
    expect(response.status).toBe(404);
  });

  it("4c. 🚨 Boş isimle kategori oluşturma reddedilmeli (400)", async () => {
    const response = await request(app.getHttpServer())
      .post("/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "" });
    expect(response.status).toBe(400);
  });

  it("5. 🚨 Normal kullanıcı kategori GÜNCELLEYEMEMELİ", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/categories/${testCategory.id}`)
      .set("Authorization", `Bearer ${normalToken}`)
      .send({ name: "Değişti" });
    expect(response.status).toBe(403);
  });

  it("6. 🔒 Admin kullanıcısı kategoriyi GÜNCELLEYEBİLMELİ", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/categories/${testCategory.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Siber" });
    expect(response.status).toBe(200);
  });

  it("7. 🚨 Normal kullanıcı kategori SİLEMEMELİ", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/categories/${testCategory.id}`)
      .set("Authorization", `Bearer ${normalToken}`);
    expect(response.status).toBe(403);
  });

  it("8. 🔒 Admin kullanıcısı kategoriyi SİLEBİLMELİ", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/categories/${testCategory.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(204);
  });
});
