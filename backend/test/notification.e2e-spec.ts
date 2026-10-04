import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { signTestToken } from "./utils/auth.helper";
import * as bcrypt from "bcrypt";
import { createTestApp } from "./utils/setup";

describe("Notifications Module (E2E) - Yetki, Sahiplik ve Toplu İşlemler", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let normalUser: any;
  let targetUser: any;
  let adminUser: any;

  let normalToken: string;
  let targetToken: string;
  let adminToken: string;

  let targetNotification: any; // targetUser'a ait test bildirimi

  beforeAll(async () => {
    // 🚨 setupResult objesinden app, prisma ve şifreyi dışarı çıkarıyoruz
    const setupResult = await createTestApp();
    app = setupResult.app;
    prisma = setupResult.prisma;
    const hashedPassword = setupResult.hashedPassword;

    normalUser = await prisma.user.create({
      data: {
        email: "normal@test.com",
        name: "Normal",
        username: "normal_n",
        password: hashedPassword,
        role: "USER",
      },
    });
    targetUser = await prisma.user.create({
      data: {
        email: "target@test.com",
        name: "Target",
        username: "target_n",
        password: hashedPassword,
        role: "USER",
      },
    });
    adminUser = await prisma.user.create({
      data: {
        email: "admin@test.com",
        name: "Admin",
        username: "admin_n",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    normalToken = signTestToken({
      sub: normalUser.id,
      email: normalUser.email,
      role: normalUser.role,
    });
    targetToken = signTestToken({
      sub: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
    });
    adminToken = signTestToken({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    targetNotification = await prisma.notification.create({
      data: {
        title: "Özel Bildirim",
        message: "Gizli mesaj",
        userId: targetUser.id,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it("1. 🚨 Normal kullanıcı (USER) tekil bildirim gönderememeli (403 Forbidden)", async () => {
    const response = await request(app.getHttpServer())
      .post("/notifications/single")
      .set("Authorization", `Bearer ${normalToken}`)
      .send({ title: "Hack", message: "Hack", userId: targetUser.id });
    expect(response.status).toBe(403);
  });

  it("2. 🚨 Normal kullanıcı (USER) toplu bildirim (bulk) gönderememeli (403 Forbidden)", async () => {
    const response = await request(app.getHttpServer())
      .post("/notifications/bulk")
      .set("Authorization", `Bearer ${normalToken}`)
      .send({ title: "Hack", message: "Hack" });
    expect(response.status).toBe(403);
  });

  it("3. 🔓 Admin kullanıcısı başarıyla tekil bildirim gönderebilmeli", async () => {
    const response = await request(app.getHttpServer())
      .post("/notifications/single")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Sistem Uyarısı",
        message: "Lütfen profilinizi güncelleyin.",
        userId: normalUser.id,
      });
    expect(response.status).toBe(201);
    expect(response.body.title).toBe("Sistem Uyarısı");
  });

  it("3b. 🚨 Var olmayan bir userId'ye bildirim gönderilmeye çalışılırsa anlamlı bir hata dönmeli (400/404), 500 değil", async () => {
    const response = await request(app.getHttpServer())
      .post("/notifications/single")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Hayalet Kullanıcı",
        message: "Bu kullanıcı yok",
        userId: "00000000-0000-0000-0000-000000000000",
      });
    expect(response.status).not.toBe(500);
  });

  it("4. 🔓 Admin kullanıcısı başarıyla toplu (bulk) bildirim gönderebilmeli", async () => {
    const response = await request(app.getHttpServer())
      .post("/notifications/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Genel Duyuru", message: "Sistem bakıma girecektir." });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain(
      "kullanıcıya bildirim başarıyla gönderildi"
    );
  });

  it("4b. 🚨 Geçersiz targetRole 400 dönmeli", async () => {
    const response = await request(app.getHttpServer())
      .post("/notifications/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Test", message: "Test", targetRole: "EDITOR" });
    expect(response.status).toBe(400);
  });

  it("5. 🔒 Kullanıcı sadece KENDİ bildirimlerini görebilmeli", async () => {
    const response = await request(app.getHttpServer())
      .get("/notifications")
      .set("Authorization", `Bearer ${normalToken}`);
    expect(response.status).toBe(200);
    expect(response.body.notifications.length).toBeGreaterThan(0);
    const hasTargetNotification = response.body.notifications.some(
      (n: any) => n.id === targetNotification.id
    );
    expect(hasTargetNotification).toBe(false);
  });

  it('6. 🚨 Kullanıcı BAŞKASININ bildirimini "Okundu" olarak işaretleyememeli (403 Forbidden)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/notifications/${targetNotification.id}/read`)
      .set("Authorization", `Bearer ${normalToken}`);
    expect(response.status).toBe(403);
  });

  it('7. 🔒 Kullanıcı KENDİ bildirimini başarıyla "Okundu" olarak işaretleyebilmeli', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/notifications/${targetNotification.id}/read`)
      .set("Authorization", `Bearer ${targetToken}`);
    expect(response.status).toBe(200);
    expect(response.body.isRead).toBe(true);
  });

  it('8. 🚀 Kullanıcı "Tümünü Okundu İşaretle" rotasını başarıyla kullanabilmeli', async () => {
    const response = await request(app.getHttpServer())
      .patch("/notifications/mark-all-read")
      .set("Authorization", `Bearer ${normalToken}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Tüm bildirimler okundu olarak işaretlendi"
    );
  });

  it("9. 🚨 Kullanıcı BAŞKASININ bildirimini silememeli (403 Forbidden)", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/notifications/${targetNotification.id}`)
      .set("Authorization", `Bearer ${normalToken}`);
    expect(response.status).toBe(403);
  });

  it("10. 🔒 Kullanıcı KENDİ bildirimini silebilmeli (204 No Content)", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/notifications/${targetNotification.id}`)
      .set("Authorization", `Bearer ${targetToken}`);
    expect(response.status).toBe(204);
  });

  it('11. 🚀 Kullanıcı "Tümünü Temizle" rotasıyla kendi tüm bildirimlerini silebilmeli', async () => {
    const response = await request(app.getHttpServer())
      .delete("/notifications/clear")
      .set("Authorization", `Bearer ${normalToken}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Tüm bildirimler temizlendi");
    const checkResponse = await request(app.getHttpServer())
      .get("/notifications")
      .set("Authorization", `Bearer ${normalToken}`);
    expect(checkResponse.body.total).toBe(0);
    expect(checkResponse.body.notifications.length).toBe(0);
  });

  it("12. Hedef rolde kullanıcı yoksa count: 0 dönmeli", async () => {
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany({ where: { role: "USER" } });
    const response = await request(app.getHttpServer())
      .post("/notifications/bulk")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Boş", message: "Boş", targetRole: "USER" });
    expect(response.status).toBe(201);
    expect(response.body.count).toBe(0);
  });
});
