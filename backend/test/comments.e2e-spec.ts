import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { signTestToken } from "./utils/auth.helper";
import { CommentStatus } from "@prisma/client";
import { createTestApp } from "./utils/setup";

describe("Comments Module (E2E) - Moderasyon ve İzolasyon Kalkanı", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerUser: any;
  let intruderUser: any;
  let adminUser: any;
  let testCategory: any;
  let testPost: any;

  let ownerToken: string;
  let intruderToken: string;
  let adminToken: string;

  let testComment: any;

  beforeAll(async () => {
    // 🚨 1. Setup fonksiyonunu çağırıp App, Prisma ve Şifreyi alıyoruz
    const setupResult = await createTestApp();
    app = setupResult.app;
    prisma = setupResult.prisma;
    const hashedPassword = setupResult.hashedPassword;

    // 2. Kullanıcıları oluştur
    ownerUser = await prisma.user.create({
      data: {
        email: "owner@test.com",
        name: "Owner",
        username: "owner_c",
        password: hashedPassword,
        role: "USER",
      },
    });
    intruderUser = await prisma.user.create({
      data: {
        email: "intruder@test.com",
        name: "Intruder",
        username: "intruder_c",
        password: hashedPassword,
        role: "USER",
      },
    });
    adminUser = await prisma.user.create({
      data: {
        email: "admin@test.com",
        name: "Admin",
        username: "admin_c",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    // 3. Tokenları üret
    ownerToken = signTestToken({
      sub: ownerUser.id,
      email: ownerUser.email,
      role: ownerUser.role,
    });
    intruderToken = signTestToken({
      sub: intruderUser.id,
      email: intruderUser.email,
      role: intruderUser.role,
    });
    adminToken = signTestToken({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    // 4. Yorum atılacak test yazısını ve kategorisini oluştur
    testCategory = await prisma.category.create({
      data: { name: "Genel", slug: "genel" },
    });
    testPost = await prisma.post.create({
      data: {
        title: "Test Yazısı",
        slug: "test-yazisi",
        content: "İçerik",
        authorId: ownerUser.id,
        categoryId: testCategory.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  // --- OLUŞTURMA (CREATE) TESTLERİ ---
  it("1. 🚨 Oturum açmamış anonim kullanıcı (Tokensız) yorum YAPAMAMALI (401 Unauthorized)", async () => {
    const response = await request(app.getHttpServer()).post("/comments").send({
      content: "Anonim Yorum",
      postId: testPost.id,
      userId: ownerUser.id,
    });
    expect(response.status).toBe(401);
  });

  it("2. 🔒 Oturum açmış kullanıcı (Owner) başarıyla yorum yapabilmeli (Varsayılan durum: PENDING)", async () => {
    const response = await request(app.getHttpServer())
      .post("/comments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        content: 'Harika bir yazı! <script>alert("xss")</script>',
        postId: testPost.id,
        userId: ownerUser.id,
      });
    expect(response.status).toBe(201);
    expect(response.body.content).not.toContain("<script>");
    expect(response.body.status).toBe(CommentStatus.PENDING);
    testComment = response.body;
  });

  // --- OKUMA VE LİSTELEME (READ) TESTLERİ ---
  it('3. 🔓 Public "find by post" rotası SADECE ONAYLANMIŞ (APPROVED) yorumları getirmeli', async () => {
    const response = await request(app.getHttpServer()).get(
      `/comments/post/${testPost.id}`
    );
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(0);
    expect(response.body.comments.length).toBe(0);
  });

  // --- MODERASYON TESTLERİ ---
  it("4. 🚨 Normal kullanıcı (Intruder veya Owner) moderasyon (Onay/Ret) YAPAMAMALI (403 Forbidden)", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/comments/${testComment.id}/moderate`)
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ status: CommentStatus.APPROVED });
    expect(response.status).toBe(403);
  });

  it("5. 🔒 Admin kullanıcısı (Admin) yorumu başarıyla ONAYLAYABİLMELİ (APPROVED)", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/comments/${testComment.id}/moderate`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: CommentStatus.APPROVED });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(CommentStatus.APPROVED);

    const publicCheck = await request(app.getHttpServer()).get(
      `/comments/post/${testPost.id}`
    );
    expect(publicCheck.body.total).toBe(1);
    expect(publicCheck.body.comments[0].id).toBe(testComment.id);
  });

  // --- GÜNCELLEME (UPDATE) TESTLERİ ---
  it("6. 🚨 İzinsiz kullanıcı (Intruder) başkasının yorumunu GÜNCELLEYEMEMELİ (401 Unauthorized)", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/comments/${testComment.id}`)
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ content: "Hacked Comment" });
    expect(response.status).toBe(403); // Güvenlik katmanımız nedeniyle 403 DÖNECEK
  });

  it("7. 🔒 Yorumun Sahibi (Owner) kendi yorumunu başarıyla GÜNCELLEYEBİLMELİ", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/comments/${testComment.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ content: "Fikrimi değiştirdim, kötü yazı." });
    expect(response.status).toBe(200);
    expect(response.body.content).toBe("Fikrimi değiştirdim, kötü yazı.");
  });

  // --- SİLME (DELETE) TESTLERİ ---
  it("8. 🚨 İzinsiz kullanıcı (Intruder) başkasının yorumunu SİLEMEMELİ (401 Unauthorized)", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/comments/${testComment.id}`)
      .set("Authorization", `Bearer ${intruderToken}`);
    expect(response.status).toBe(403); // Güvenlik katmanımız nedeniyle 403 DÖNECEK
  });

  it("9. 🔒 Sahibi (Owner) kendi yorumunu SİLEBİLMELİ (204 No Content)", async () => {
    const tempComment = await request(app.getHttpServer())
      .post("/comments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        content: "Bunu sileceğim",
        postId: testPost.id,
        userId: ownerUser.id,
      });
    const response = await request(app.getHttpServer())
      .delete(`/comments/${tempComment.body.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(response.status).toBe(204);
  });

  it("10. 🔒 Admin kullanıcısı başkasının yorumunu SİLEBİLMELİ (Override / 204 No Content)", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/comments/${testComment.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(204);
    const checkDb = await prisma.comment.findUnique({
      where: { id: testComment.id },
    });
    expect(checkDb).toBeNull();
  });
});
