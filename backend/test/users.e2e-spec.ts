import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { signTestToken } from "./utils/auth.helper";
import * as bcrypt from "bcrypt";
import { createTestApp } from "./utils/setup";

describe("Users Module (E2E) - Profil Güvenliği ve Spoofing Kalkanı", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let normalUser: any;
  let otherUser: any;
  let adminUser: any;
  let normalToken: string;
  let adminToken: string;
  let category: any;

  beforeAll(async () => {
    // 🚨 setupResult objesinden app, prisma ve şifreyi dışarı çıkarıyoruz
    const setupResult = await createTestApp();
    app = setupResult.app;
    prisma = setupResult.prisma;
    const hashedPassword = setupResult.hashedPassword;

    normalUser = await prisma.user.create({
      data: {
        email: "normal@test.com",
        name: "Normal User",
        username: "normaluser",
        password: hashedPassword,
        role: "USER",
      },
    });
    otherUser = await prisma.user.create({
      data: {
        email: "other@test.com",
        name: "Other User",
        username: "otheruser",
        password: hashedPassword,
        role: "USER",
      },
    });
    adminUser = await prisma.user.create({
      data: {
        email: "admin_users@test.com",
        name: "Admin",
        username: "admin_users",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    category = await prisma.category.create({
      data: { name: "Tech", slug: "tech" },
    });

    await prisma.post.create({
      data: {
        title: "Public",
        slug: "public-post",
        content: "x",
        status: "PUBLISHED",
        authorId: normalUser.id,
        categoryId: category.id,
      },
    });
    await prisma.post.create({
      data: {
        title: "Secret Draft",
        slug: "secret-draft",
        content: "x",
        status: "DRAFT",
        authorId: normalUser.id,
        categoryId: category.id,
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
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("1. 🔓 Public GET /users/:id çalışmalı ama e-posta/şifre sızdırmamalı", async () => {
    const res = await request(app.getHttpServer()).get(
      `/users/${normalUser.id}`
    );
    expect(res.status).toBe(200);
    expect(res.body.username).toBe("normaluser");
    expect(res.body.email).toBeUndefined();
    expect(res.body.password).toBeUndefined();
  });

  it("2. 🔓 Public profilde DRAFT yazılar görünmemeli", async () => {
    const res = await request(app.getHttpServer()).get(
      `/users/${normalUser.id}`
    );
    const slugs = res.body.posts.map((p: any) => p.slug);
    expect(slugs).toContain("public-post");
    expect(slugs).not.toContain("secret-draft");
  });

  it("3. Geçersiz UUID 400, olmayan kullanıcı 404 dönmeli", async () => {
    const bad = await request(app.getHttpServer()).get("/users/not-a-uuid");
    expect(bad.status).toBe(400);

    const missing = await request(app.getHttpServer()).get(
      "/users/00000000-0000-4000-8000-000000000000"
    );
    expect(missing.status).toBe(404);
  });

  it("4. 🚨 Tokensız PATCH /users/me → 401", async () => {
    const res = await request(app.getHttpServer())
      .patch("/users/me")
      .send({ name: "Hacker Name" });
    expect(res.status).toBe(401);
  });

  it("5. 🔒 Spoofing: body'deki id yok sayılmalı, sadece kendi profili güncellenmeli", async () => {
    const res = await request(app.getHttpServer())
      .patch("/users/me")
      .set("Authorization", `Bearer ${normalToken}`)
      .send({ name: "Güvenli İsim", id: otherUser.id });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Güvenli İsim");
    expect(res.body.id).toBe(normalUser.id);
    expect(res.body.password).toBeUndefined();

    const untouched = await prisma.user.findUnique({
      where: { id: otherUser.id },
    });
    expect(untouched?.name).toBe("Other User");
  });

  it("6. 🚨 Privilege escalation: role gönderilse bile USER kalmalı", async () => {
    await request(app.getHttpServer())
      .patch("/users/me")
      .set("Authorization", `Bearer ${normalToken}`)
      .send({ role: "ADMIN" });
    const fresh = await prisma.user.findUnique({
      where: { id: normalUser.id },
    });
    expect(fresh?.role).toBe("USER");
  });

  it("7. 🚨 Başkasının kullanıcı adını almaya çalışınca 409 dönmeli", async () => {
    const res = await request(app.getHttpServer())
      .patch("/users/me")
      .set("Authorization", `Bearer ${normalToken}`)
      .send({ username: "otheruser" });
    expect(res.status).toBe(409);
  });

  it("8. 🚨 Normal kullanıcı admin rotalarına erişememeli (403), anonim 401", async () => {
    const anon = await request(app.getHttpServer()).get("/admin/users");
    expect(anon.status).toBe(401);

    const normal = await request(app.getHttpServer())
      .get("/admin/users")
      .set("Authorization", `Bearer ${normalToken}`);
    expect(normal.status).toBe(403);
  });

  it("9. 🔒 Admin kullanıcı listesini görebilmeli ve şifre dönmemeli", async () => {
    const res = await request(app.getHttpServer())
      .get("/admin/users?limit=10")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.users[0].password).toBeUndefined();
  });

  it("10. 🔒 Admin kullanıcıyı banlayınca bildirim oluşmalı", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admin/users/${otherUser.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "BANNED", banReason: "Spam" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("BANNED");

    const notifs = await prisma.notification.findMany({
      where: { userId: otherUser.id },
    });
    expect(notifs).toHaveLength(1);
  });

  it("11. SUSPENDED + banDuration yoksa 400 dönmeli", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admin/users/${normalUser.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "SUSPENDED" });
    expect(res.status).toBe(400);
  });

  it("12. Admin kendi hesabını banlayamamalı (403)", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/admin/users/${adminUser.id}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "BANNED", banReason: "x" });
    expect(res.status).toBe(403);
  });

  it("13. Admin geçersiz limit ile 400 almalı", async () => {
    const res = await request(app.getHttpServer())
      .get("/admin/users?limit=abc")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it("14. Admin yazısı olan kullanıcıyı silmeye çalışırsa 409 (cascade yoksa)", async () => {
    const res = await request(app.getHttpServer())
      .delete(`/admin/users/${normalUser.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect([204, 409]).toContain(res.status);
  });
});
