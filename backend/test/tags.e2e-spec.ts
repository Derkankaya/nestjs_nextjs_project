import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { signTestToken } from "./utils/auth.helper";
import * as bcrypt from "bcrypt";
import { createTestApp } from "./utils/setup";

describe("Tags Module (E2E) - RBAC ve Admin İzolasyonu", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let normalUser: any;
  let adminUser: any;
  let normalToken: string;
  let adminToken: string;
  let initialTag: any;

  beforeAll(async () => {
    // 🚨 setupResult objesinden app, prisma ve şifreyi dışarı çıkarıyoruz
    const setupResult = await createTestApp();
    app = setupResult.app;
    prisma = setupResult.prisma;
    const hashedPassword = setupResult.hashedPassword;

    normalUser = await prisma.user.create({
      data: {
        email: "normal_tags@test.com",
        name: "Normal",
        username: "normal_tags",
        password: hashedPassword,
        role: "USER",
      },
    });
    adminUser = await prisma.user.create({
      data: {
        email: "admin_tags@test.com",
        name: "Admin",
        username: "admin_tags",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

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

    initialTag = await prisma.tag.create({
      data: { name: "Teknoloji", slug: "teknoloji" },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("1. 🚨 Anonim kullanıcı etiket OLUŞTURAMAMALI (401)", async () => {
    const res = await request(app.getHttpServer())
      .post("/tags")
      .send({ name: "Hacker" });
    expect(res.status).toBe(401);
  });

  it("2. 🚨 Normal kullanıcı etiket OLUŞTURAMAMALI (403)", async () => {
    const res = await request(app.getHttpServer())
      .post("/tags")
      .set("Authorization", `Bearer ${normalToken}`)
      .send({ name: "Hacker" });
    expect(res.status).toBe(403);
  });

  it("3. 🔒 Admin kullanıcısı başarıyla etiket oluşturabilmeli", async () => {
    const res = await request(app.getHttpServer())
      .post("/tags")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Yazılım" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Yazılım");
  });

  it("4. 🚨 Aynı slug ile ikinci etiket 409 dönmeli", async () => {
    const res = await request(app.getHttpServer())
      .post("/tags")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Teknoloji" });
    expect(res.status).toBe(409);
  });

  it("5. 🚨 Boş name gönderilirse 400 dönmeli", async () => {
    const res = await request(app.getHttpServer())
      .post("/tags")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("6. 🔓 Herhangi biri etiketleri listeleyebilmeli", async () => {
    const res = await request(app.getHttpServer()).get("/tags?search=tekno");
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.tags[0].slug).toBe("teknoloji");
  });

  it("7. 🔓 Herhangi biri slug ile etiket görebilmeli", async () => {
    const res = await request(app.getHttpServer()).get(
      `/tags/slug/${initialTag.slug}`
    );
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(initialTag.id);
  });

  it("8. 🔓 Olmayan etiket 404, geçersiz UUID 400 dönmeli", async () => {
    const notFound = await request(app.getHttpServer()).get(
      "/tags/00000000-0000-4000-8000-000000000000"
    );
    expect(notFound.status).toBe(404);

    const badUuid = await request(app.getHttpServer()).get("/tags/not-a-uuid");
    expect(badUuid.status).toBe(400);
  });

  it("9. 🚨 Normal kullanıcı etiket güncelleyememeli (403)", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/tags/${initialTag.id}`)
      .set("Authorization", `Bearer ${normalToken}`)
      .send({ name: "Değişti" });
    expect(res.status).toBe(403);
  });

  it("10. 🔒 Admin kullanıcısı etiketi güncelleyebilmeli", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/tags/${initialTag.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Güncel Tekno" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Güncel Tekno");
  });

  it("11. 🚨 Normal kullanıcı etiket silememeli (403)", async () => {
    const res = await request(app.getHttpServer())
      .delete(`/tags/${initialTag.id}`)
      .set("Authorization", `Bearer ${normalToken}`);
    expect(res.status).toBe(403);
  });

  it("12. 🔒 Admin kullanıcısı etiketi silebilmeli (204)", async () => {
    const res = await request(app.getHttpServer())
      .delete(`/tags/${initialTag.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });
});
