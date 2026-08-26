# Temel imaj olarak Node.js 20 kullan
FROM node:20-alpine

# Çalışma dizinini ayarla
WORKDIR /usr/src/app

# Paket dosyalarını kopyala
COPY package*.json yarn.lock ./

# Bağımlılıkları yükle
RUN yarn install

# Projenin geri kalanını kopyala (prisma klasörü ve src dahil)
COPY . .

# Prisma istemcisini oluştur
RUN npx prisma generate

# NestJS projesini derle (build al)
RUN yarn build

# Portu dışarı aç (docker-compose'daki ayarlara göre içeride 3000 çalışır)
EXPOSE 3000

# Projeyi production modunda başlat
CMD ["yarn", "start:prod"]