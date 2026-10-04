import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { signTestToken } from "./utils/auth.helper";
import * as bcrypt from "bcrypt";
import { createTestApp } from "./utils/setup";

describe("Messages Module (E2E) - Akıllı Silme ve İzolasyon", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let userA: any;
  let userB: any;
  let userC: any;

  let tokenA: string;
  let tokenB: string;
  let tokenC: string;

  let testMessage: any;

  beforeAll(async () => {
    // 🚨 setupResult objesinden app, prisma ve şifreyi dışarı çıkarıyoruz
    const setupResult = await createTestApp();
    app = setupResult.app;
    prisma = setupResult.prisma;
    const hashedPassword = setupResult.hashedPassword;

    userA = await prisma.user.create({
      data: {
        email: "userA@test.com",
        name: "User A",
        username: "usera",
        password: hashedPassword,
        role: "USER",
      },
    });
    userB = await prisma.user.create({
      data: {
        email: "userB@test.com",
        name: "User B",
        username: "userb",
        password: hashedPassword,
        role: "USER",
      },
    });
    userC = await prisma.user.create({
      data: {
        email: "userC@test.com",
        name: "User C",
        username: "userc",
        password: hashedPassword,
        role: "USER",
      },
    });

    tokenA = signTestToken({
      sub: userA.id,
      email: userA.email,
      role: userA.role,
    });
    tokenB = signTestToken({
      sub: userB.id,
      email: userB.email,
      role: userB.role,
    });
    tokenC = signTestToken({
      sub: userC.id,
      email: userC.email,
      role: userC.role,
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it("1. 🔒 UserA, UserB'ye mesaj gönderebilmeli", async () => {
    const response = await request(app.getHttpServer())
      .post("/messages")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ recipientId: userB.id, content: "Merhaba B, nasılsın?" });
    expect(response.status).toBe(201);
    expect(response.body.content).toBe("Merhaba B, nasılsın?");
    expect(response.body.senderId).toBe(userA.id);
    expect(response.body.recipientId).toBe(userB.id);
    testMessage = response.body;
  });

  it("2. 🔒 UserB, gelen kutusunda (Inbox) mesajı görebilmeli", async () => {
    const response = await request(app.getHttpServer())
      .get("/messages/inbox")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(response.status).toBe(200);
    expect(response.body.messages.length).toBeGreaterThan(0);
    expect(response.body.messages[0].id).toBe(testMessage.id);
  });

  it("3. 🔒 UserA, giden kutusunda (Outbox) gönderdiği mesajı görebilmeli", async () => {
    const response = await request(app.getHttpServer())
      .get("/messages/outbox")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(response.status).toBe(200);
    expect(response.body.messages.length).toBeGreaterThan(0);
    expect(response.body.messages[0].id).toBe(testMessage.id);
  });

  it("3b. 🔒 UserC'nin inbox/outbox'ında A-B arasındaki mesaj hiç görünmemeli", async () => {
    const inboxRes = await request(app.getHttpServer())
      .get("/messages/inbox")
      .set("Authorization", `Bearer ${tokenC}`);
    const outboxRes = await request(app.getHttpServer())
      .get("/messages/outbox")
      .set("Authorization", `Bearer ${tokenC}`);
    expect(
      inboxRes.body.messages.find((m: any) => m.id === testMessage.id)
    ).toBeUndefined();
    expect(
      outboxRes.body.messages.find((m: any) => m.id === testMessage.id)
    ).toBeUndefined();
  });

  it('4. 🚨 UserC (üçüncü kişi), bu mesajı "okundu" yapamamalı (403 Unauthorized)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/messages/${testMessage.id}/read`)
      .set("Authorization", `Bearer ${tokenC}`);
    expect(response.status).toBe(403);
  });

  it('5. 🔒 Sadece alıcı (UserB), mesajı "okundu" yapabilmeli', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/messages/${testMessage.id}/read`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(response.status).toBe(200);
    expect(response.body.isRead).toBe(true);
  });

  it("6. 🚨 UserC, mesajı silememeli (403 Unauthorized)", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/messages/${testMessage.id}`)
      .set("Authorization", `Bearer ${tokenC}`);
    expect(response.status).toBe(403);
  });

  it("7. 🔒 Gönderen (UserA) mesajı sildiğinde, Outbox'ından gitmeli ama DB'de kalmalı (Soft Delete)", async () => {
    const deleteRes = await request(app.getHttpServer())
      .delete(`/messages/${testMessage.id}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(deleteRes.status).toBe(204);
    const outboxRes = await request(app.getHttpServer())
      .get("/messages/outbox")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(
      outboxRes.body.messages.find((m: any) => m.id === testMessage.id)
    ).toBeUndefined();
    const dbMessage = await prisma.message.findUnique({
      where: { id: testMessage.id },
    });
    expect(dbMessage).toBeDefined();
    expect(dbMessage?.deletedBySender).toBe(true);
  });

  it("8. 🔒 Alıcı (UserB) da mesajı sildiğinde, DB'den tamamen silinmeli (Hard Delete)", async () => {
    const deleteRes = await request(app.getHttpServer())
      .delete(`/messages/${testMessage.id}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(deleteRes.status).toBe(204);
    const inboxRes = await request(app.getHttpServer())
      .get("/messages/inbox")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(
      inboxRes.body.messages.find((m: any) => m.id === testMessage.id)
    ).toBeUndefined();
    const dbMessage = await prisma.message.findUnique({
      where: { id: testMessage.id },
    });
    expect(dbMessage).toBeNull();
  });

  it("9. 🔒 UserA, outbox'ını toplu temizleyebilmeli (clearOutbox)", async () => {
    await prisma.message.create({
      data: {
        content: "Temizlenecek mesaj",
        senderId: userA.id,
        recipientId: userB.id,
      },
    });
    const response = await request(app.getHttpServer())
      .delete("/messages/outbox/clear")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(response.status).toBe(204);
    const outboxRes = await request(app.getHttpServer())
      .get("/messages/outbox")
      .set("Authorization", `Bearer ${tokenA}`);
    expect(outboxRes.body.messages.length).toBe(0);
  });

  it("10. 🔒 UserB, inbox'ını toplu temizleyebilmeli (clearInbox)", async () => {
    await prisma.message.create({
      data: {
        content: "Başka bir mesaj",
        senderId: userA.id,
        recipientId: userB.id,
      },
    });
    const response = await request(app.getHttpServer())
      .delete("/messages/inbox/clear")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(response.status).toBe(204);
    const inboxRes = await request(app.getHttpServer())
      .get("/messages/inbox")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(inboxRes.body.messages.length).toBe(0);
  });
});
