import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { PrismaService } from "../src/common/prisma/prisma.service";
import { UsersAdminService } from "../src/modules/users/admin/users-admin.service";
import { signTestToken } from "./utils/auth.helper";
import * as bcrypt from "bcrypt";
import { UserStatus } from "@prisma/client";
import { createTestApp } from "./utils/setup";

describe("Auth Module (E2E) - Login & Account Status", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let usersAdminService: UsersAdminService;

  let activeUser: any;
  let bannedUser: any;
  let suspendedUser: any;

  const PASSWORD = "password123";

  beforeAll(async () => {
    // 🚨 1. Setup fonksiyonunu çağırıp App, Prisma ve Şifreyi alıyoruz
    const setupResult = await createTestApp();
    app = setupResult.app;
    prisma = setupResult.prisma;

    // Auth testinde usersAdminService çağırdığın için, oluşan app üzerinden servisi çekebiliriz.
    usersAdminService = app.get(UsersAdminService);

    // Özel şifre gereksinimi için kendimiz oluşturuyoruz.
    const hashedPassword = await bcrypt.hash(PASSWORD, 10);

    activeUser = await prisma.user.create({
      data: {
        email: "active@test.com",
        name: "Active User",
        username: "activeuser",
        password: hashedPassword,
        role: "USER",
      },
    });

    bannedUser = await prisma.user.create({
      data: {
        email: "banned@test.com",
        name: "Banned User",
        username: "banneduser",
        password: hashedPassword,
        role: "USER",
      },
    });

    suspendedUser = await prisma.user.create({
      data: {
        email: "suspended@test.com",
        name: "Suspended User",
        username: "suspendeduser",
        password: hashedPassword,
        role: "USER",
      },
    });

    // Admin servisini gerçek akışla banla/askıya al
    await usersAdminService.updateStatus(bannedUser.id, {
      status: UserStatus.BANNED,
      banReason: "Test ban",
    });
    await usersAdminService.updateStatus(suspendedUser.id, {
      status: UserStatus.SUSPENDED,
      banDuration: 7,
      banReason: "Test suspend",
    });
  });

  afterAll(async () => {
    if (prisma) await prisma.$disconnect();
    if (app) await app.close();
  });

  describe("POST /auth/login", () => {
    it("1. Doğru bilgilerle giriş yapılabilmeli ve accessToken dönmeli", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "active@test.com", password: PASSWORD });
      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user.email).toBe("active@test.com");
      expect(response.body.user.password).toBeUndefined();
    });

    it("2. Yanlış şifreyle giriş reddedilmeli (401)", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "active@test.com", password: "wrong-password" });
      expect(response.status).toBe(401);
    });

    it("3. Var olmayan email ile giriş reddedilmeli (401)", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "ghost@test.com", password: PASSWORD });
      expect(response.status).toBe(401);
    });

    it("4. Banlı kullanıcı doğru şifreyle bile giriş yapamamalı (401)", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "banned@test.com", password: PASSWORD });
      expect(response.status).toBe(401);
    });

    it("5. Askıya alınmış kullanıcı giriş yapamamalı (401)", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "suspended@test.com", password: PASSWORD });
      expect(response.status).toBe(401);
    });
  });

  describe("AuthGuard - Ghost Token Shield", () => {
    it("6. Daha önce geçerli olan token, kullanıcı banlandıktan SONRA reddedilmeli", async () => {
      const freshUser = await prisma.user.create({
        data: {
          email: "freshban@test.com",
          name: "Fresh Ban",
          username: "freshban",
          password: await bcrypt.hash(PASSWORD, 10),
          role: "USER",
        },
      });
      const token = signTestToken({
        sub: freshUser.id,
        email: freshUser.email,
        role: freshUser.role,
      });

      const beforeBan = await request(app.getHttpServer())
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Before Ban" });
      expect(beforeBan.status).toBe(200);

      await usersAdminService.updateStatus(freshUser.id, {
        status: UserStatus.BANNED,
        banReason: "Banned mid-session",
      });

      const afterBan = await request(app.getHttpServer())
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated After Ban" });
      expect(afterBan.status).toBe(403); // Yeni Guard sistemimiz 403 fırlatır
    });

    it("7. Silinmiş bir kullanıcının token'ı reddedilmeli", async () => {
      const ghostUser = await prisma.user.create({
        data: {
          email: "ghost-delete@test.com",
          name: "Ghost Delete",
          username: "ghostdelete",
          password: await bcrypt.hash(PASSWORD, 10),
          role: "USER",
        },
      });
      const token = signTestToken({
        sub: ghostUser.id,
        email: ghostUser.email,
        role: ghostUser.role,
      });

      await prisma.user.delete({ where: { id: ghostUser.id } });

      const response = await request(app.getHttpServer())
        .patch("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Should Fail" });
      expect(response.status).toBe(401);
    });

    it("register: role: ADMIN gönderilse bile USER oluşmalı", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "evil@test.com",
          password: "password123",
          name: "Evil",
          username: "evil",
          role: "ADMIN",
        });
      const user = await prisma.user.findUnique({
        where: { email: "evil@test.com" },
      });
      expect(user?.role).toBe("USER");
    });
  });
});
