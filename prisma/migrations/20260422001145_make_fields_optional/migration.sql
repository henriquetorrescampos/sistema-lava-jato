-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT,
    "email" TEXT NOT NULL,
    "cpf" TEXT,
    "telefone" TEXT,
    "senha" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Usuario" ("cpf", "createdAt", "email", "id", "nome", "senha", "telefone") SELECT "cpf", "createdAt", "email", "id", "nome", "senha", "telefone" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
