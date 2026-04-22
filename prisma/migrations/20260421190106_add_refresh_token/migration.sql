-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefreshToken_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
