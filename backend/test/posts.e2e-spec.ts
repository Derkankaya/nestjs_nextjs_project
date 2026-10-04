import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { signTestToken } from "./utils/auth.helper";
import * as bcrypt from "bcrypt";
import { createTestApp } from "./utils/setup";

describe("Posts Module (E2E) - Ownership & Security", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerUser: any;
  let intruderUser: any;
  let adminUser: any;
  let testCategory: any;

  let ownerToken: string;
  let intruderToken: string;
  let adminToken: string;

  beforeAll(async () => {
    // 🚨 setupResult objesinden app, prisma ve şifreyi dışarı çıkarıyoruz
    const setupResult = await createTestApp();
    app = setupResult.app;
    prisma = setupResult.prisma;
    const hashedPassword = setupResult.hashedPassword;

    ownerUser = await prisma.user.create({
      data: {
        email: "owner@test.com",
        name: "Owner User",
        username: "owneruser",
        password: hashedPassword,
        role: "USER",
      },
    });
    intruderUser = await prisma.user.create({
      data: {
        email: "intruder@test.com",
        name: "Intruder User",
        username: "intruderuser",
        password: hashedPassword,
        role: "USER",
      },
    });
    adminUser = await prisma.user.create({
      data: {
        email: "admin@test.com",
        name: "Admin User",
        username: "adminuser",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    testCategory = await prisma.category.create({
      data: { name: "Tech", slug: "tech" },
    });

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
  });

  afterAll(async () => {
    // Kapanışta posta özel ek temizlik istersen tutabilirsin
    await prisma.post.deleteMany();
    await app.close();
    await prisma.$disconnect();
  });

  const createPost = (
    slug: string,
    status: "DRAFT" | "PUBLISHED" = "PUBLISHED"
  ) =>
    prisma.post.create({
      data: {
        title: slug,
        slug,
        content: "Content",
        status,
        authorId: ownerUser.id,
        categoryId: testCategory.id,
      },
    });

  it("1. Sahip (Owner) kendi postunu güncelleyebilmeli", async () => {
    const post = await createPost("owner-post");
    const response = await request(app.getHttpServer())
      .patch(`/posts/${post.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ title: "Updated Title by Owner" });
    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated Title by Owner");
  });

  it("2. İzinsiz kullanıcı (Intruder) başkasının postunu güncelleyememeli (403 Forbidden)", async () => {
    const post = await createPost("protected-post");
    const response = await request(app.getHttpServer())
      .patch(`/posts/${post.id}`)
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ title: "Hacked Title" });
    expect(response.status).toBe(403);
  });

  it("3. Admin kullanıcısı başkasının postunu override edip güncelleyebilmeli", async () => {
    const post = await createPost("admin-test-post");
    const response = await request(app.getHttpServer())
      .patch(`/posts/${post.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Updated by Admin" });
    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated by Admin");
  });

  it("4. Geçersiz bir status değeri gönderilirse 400 dönmeli, 500 değil", async () => {
    const post = await createPost("status-test");
    const response = await request(app.getHttpServer())
      .patch(`/posts/${post.id}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "HACKED" });
    expect(response.status).toBe(400);
  });

  it("5. Geçerli status ile sahip durumu DRAFT yapabilmeli", async () => {
    const post = await createPost("status-ok");
    const response = await request(app.getHttpServer())
      .patch(`/posts/${post.id}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "DRAFT" });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("DRAFT");
  });

  it("6. Intruder başkasının post statüsünü değiştirememeli (403)", async () => {
    const post = await createPost("status-intruder");
    const response = await request(app.getHttpServer())
      .patch(`/posts/${post.id}/status`)
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ status: "DRAFT" });
    expect(response.status).toBe(403);
  });

  it("7. Anonim liste taslakları göstermemeli", async () => {
    await createPost("listed-pub", "PUBLISHED");
    await createPost("listed-draft", "DRAFT");
    const res = await request(app.getHttpServer()).get("/posts");
    const slugs = res.body.posts.map((p: any) => p.slug);
    expect(slugs).toContain("listed-pub");
    expect(slugs).not.toContain("listed-draft");
  });

  it("8. Taslak slug ile açılınca 404 dönmeli", async () => {
    await createPost("slug-draft", "DRAFT");
    const res = await request(app.getHttpServer()).get(
      "/posts/slug/slug-draft"
    );
    expect(res.status).toBe(404);
  });

  it("9. Anonim ?status=DRAFT ile taslak listeleyememeli", async () => {
    await createPost("filter-draft", "DRAFT");
    const res = await request(app.getHttpServer()).get("/posts?status=DRAFT");
    const slugs = res.body.posts.map((p: any) => p.slug);
    expect(slugs).not.toContain("filter-draft");
  });

  it("10. Sahibi my-posts ile kendi taslağını görmeli", async () => {
    await createPost("my-own-draft", "DRAFT");
    const res = await request(app.getHttpServer())
      .get("/posts/my-posts")
      .set("Authorization", `Bearer ${ownerToken}`);
    const slugs = res.body.posts.map((p: any) => p.slug);
    expect(slugs).toContain("my-own-draft");
  });

  it("11. my-posts başkasının taslağını göstermemeli", async () => {
    await createPost("owner-secret-draft", "DRAFT");
    const res = await request(app.getHttpServer())
      .get("/posts/my-posts")
      .set("Authorization", `Bearer ${intruderToken}`);
    const slugs = res.body.posts.map((p: any) => p.slug);
    expect(slugs).not.toContain("owner-secret-draft");
  });

  it("12. Post içeriğindeki script ve olay yöneticileri temizlenmeli", async () => {
    const res = await request(app.getHttpServer())
      .post("/posts")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        title: "XSS Test",
        content:
          "<p>Merhaba</p><script>alert(1)</script><img src=x onerror=alert(1)>",
        categoryId: testCategory.id,
      });
    expect(res.status).toBe(201);
    expect(res.body.content).toContain("Merhaba");
    expect(res.body.content).not.toContain("<script");
    expect(res.body.content).not.toContain("onerror");
  });

  it("13. create: body'deki authorId yok sayılmalı", async () => {
    const res = await request(app.getHttpServer())
      .post("/posts")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        title: "Spoof",
        content: "x",
        categoryId: testCategory.id,
        authorId: intruderUser.id,
      });
    expect(res.status).toBe(201);
    expect(res.body.authorId).toBe(ownerUser.id);
  });

  it("14. like: iki kez çağrılınca beğeni geri alınmalı", async () => {
    const post = await createPost("like-me");
    const url = `/posts/${post.id}/like`;
    const r1 = await request(app.getHttpServer())
      .post(url)
      .set("Authorization", `Bearer ${intruderToken}`);
    const r2 = await request(app.getHttpServer())
      .post(url)
      .set("Authorization", `Bearer ${intruderToken}`);
    expect([200, 201]).toContain(r1.status);
    expect([200, 201]).toContain(r2.status);
    const count = await prisma.like.count({ where: { postId: post.id } });
    expect(count).toBe(0);
  });

  it("15. create: body'deki authorId yok sayılmalı", async () => {
    const res = await request(app.getHttpServer())
      .post("/posts")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        title: "Spoof Author Test",
        slug: "spoof-author-test",
        content: "x",
        categoryId: testCategory.id,
        authorId: intruderUser.id,
      });
    expect(res.status).toBe(201);
    expect(res.body.authorId).toBe(ownerUser.id);
  });

  it("16. Aynı slug ile ikinci yazı 409 dönmeli", async () => {
    await createPost("dup-slug");
    const res = await request(app.getHttpServer())
      .post("/posts")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        title: "Dup",
        slug: "dup-slug",
        content: "x",
        categoryId: testCategory.id,
      });
    expect(res.status).toBe(409);
  });
});
