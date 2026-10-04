import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { signTestToken } from "./utils/auth.helper";
import * as bcrypt from "bcrypt";
import { createTestApp } from "./utils/setup";

describe("Media Module (E2E) - Spoofing Kalkanı ve Sahiplik İzolasyonu", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerUser: any;
  let intruderUser: any;
  let adminUser: any;

  let ownerToken: string;
  let intruderToken: string;
  let adminToken: string;

  let testMedia: any;

  beforeAll(async () => {
    // 🚨 setupResult objesinden app, prisma ve şifreyi dışarı çıkarıyoruz
    const setupResult = await createTestApp();
    app = setupResult.app;
    prisma = setupResult.prisma;
    const hashedPassword = setupResult.hashedPassword;

    ownerUser = await prisma.user.create({
      data: {
        email: "owner@test.com",
        name: "Owner",
        username: "owner_m",
        password: hashedPassword,
        role: "USER",
      },
    });
    intruderUser = await prisma.user.create({
      data: {
        email: "intruder@test.com",
        name: "Intruder",
        username: "intruder_m",
        password: hashedPassword,
        role: "USER",
      },
    });
    adminUser = await prisma.user.create({
      data: {
        email: "admin@test.com",
        name: "Admin",
        username: "admin_m",
        password: hashedPassword,
        role: "ADMIN",
      },
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
    await prisma.$disconnect();
    await app.close();
  });

  it("1. 🚨 Kullanıcı başkasının ID'siyle (Spoofing) medya yüklemeye çalışırsa sistem ezip KENDİSİNE kaydetmeli", async () => {
    const response = await request(app.getHttpServer())
      .post("/media")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        url: "https://test.com/hacker.png",
        fileKey: "hacker.png",
        format: "png",
        size: 1024,
        userId: adminUser.id,
      });
    expect(response.status).toBe(201);
    expect(response.body.url).toBe("https://test.com/hacker.png");
    expect(response.body.userId).toBe(ownerUser.id);
    expect(response.body.userId).not.toBe(adminUser.id);
    testMedia = response.body;
  });

  it("1b. 🚨 fileKey alanına path traversal denemesi reddedilmeli (400)", async () => {
    const response = await request(app.getHttpServer())
      .post("/media")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        url: "https://test.com/evil.png",
        fileKey: "../../etc/passwd",
        format: "png",
        size: 1024,
      });
    expect(response.status).toBe(400);
  });

  it("1c. 🚨 İzin verilmeyen bir dosya formatı reddedilmeli (400)", async () => {
    const response = await request(app.getHttpServer())
      .post("/media")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        url: "https://test.com/evil.exe",
        fileKey: "evil-exe.exe",
        format: "exe",
        size: 1024,
      });
    expect(response.status).toBe(400);
  });

  it("1d. 🚨 5MB üzerindeki dosya boyutu reddedilmeli (400)", async () => {
    const response = await request(app.getHttpServer())
      .post("/media")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        url: "https://test.com/huge.png",
        fileKey: `huge-${Date.now()}.png`,
        format: "png",
        size: 6 * 1024 * 1024,
      });
    expect(response.status).toBe(400);
  });

  it("2. 🔓 Herhangi biri (Tokensız) medyaları görebilmeli ve sayfalama kullanabilmeli", async () => {
    const response = await request(app.getHttpServer())
      .get(`/media?userId=${ownerUser.id}&limit=10`)
      .send();
    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.media[0].url).toBe("https://test.com/hacker.png");
  });

  it("3. 🔓 Herhangi biri tekil medya ID'sine ulaşabilmeli", async () => {
    const response = await request(app.getHttpServer()).get(
      `/media/${testMedia.id}`
    );
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(testMedia.id);
  });

  it("4. 🚨 İzinsiz kullanıcı (Intruder) başkasının medyasını GÜNCELLEYEMEMELİ (403 Unauthorized)", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/media/${testMedia.id}`)
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ url: "https://test.com/hacked-url.png" });
    expect(response.status).toBe(403); // Düzeltildi 403
  });

  it("5. 🔒 Sahibi (Owner) kendi medyasını GÜNCELLEYEBİLMELİ", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/media/${testMedia.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ size: 2048 });
    expect(response.status).toBe(200);
    expect(response.body.size).toBe(2048);
  });

  it("6. 🔒 Admin kullanıcısı başkasının medyasını GÜNCELLEYEBİLMELİ (Override)", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/media/${testMedia.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ url: "https://test.com/admin-fixed.png" });
    expect(response.status).toBe(200);
    expect(response.body.url).toBe("https://test.com/admin-fixed.png");
  });

  it("7. 🚨 İzinsiz kullanıcı (Intruder) başkasının medyasını SİLEMEMELİ (403 Unauthorized)", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/media/${testMedia.id}`)
      .set("Authorization", `Bearer ${intruderToken}`);
    expect(response.status).toBe(403); // Düzeltildi 403
  });

  it("8. 🔒 Sahibi (Owner) kendi medyasını SİLEBİLMELİ (204 No Content)", async () => {
    const tempMedia = await prisma.media.create({
      data: {
        url: "https://test.com/temp2.png",
        fileKey: `temp2-${Date.now()}.png`,
        format: "png",
        size: 100,
        userId: ownerUser.id,
      },
    });
    const response = await request(app.getHttpServer())
      .delete(`/media/${tempMedia.id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(response.status).toBe(204);
  });

  it("9. 🔒 Admin kullanıcısı başkasının medyasını SİLEBİLMELİ (Override / 204 No Content)", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/media/${testMedia.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(response.status).toBe(204);
    const checkDb = await prisma.media.findUnique({
      where: { id: testMedia.id },
    });
    expect(checkDb).toBeNull();
  });
});
