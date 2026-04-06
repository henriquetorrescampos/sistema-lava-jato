-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id_veiculo" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modelo" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    CONSTRAINT "veiculos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id_agendamento" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" DATETIME NOT NULL,
    "hora" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "id_usuario" INTEGER NOT NULL,
    "id_veiculo" INTEGER NOT NULL,
    CONSTRAINT "agendamentos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamentos_id_veiculo_fkey" FOREIGN KEY ("id_veiculo") REFERENCES "veiculos" ("id_veiculo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agendamento_servicos" (
    "id_agendamento" INTEGER NOT NULL,
    "id_servico" INTEGER NOT NULL,

    PRIMARY KEY ("id_agendamento", "id_servico"),
    CONSTRAINT "agendamento_servicos_id_agendamento_fkey" FOREIGN KEY ("id_agendamento") REFERENCES "agendamentos" ("id_agendamento") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agendamento_servicos_id_servico_fkey" FOREIGN KEY ("id_servico") REFERENCES "servicos" ("id_servico") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "servicos" (
    "id_servico" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "preco" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id_pagamento" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "valor" REAL NOT NULL,
    "forma_pagamento" TEXT NOT NULL,
    "id_agendamento" INTEGER NOT NULL,
    CONSTRAINT "pagamentos_id_agendamento_fkey" FOREIGN KEY ("id_agendamento") REFERENCES "agendamentos" ("id_agendamento") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id_avaliacao" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_servico" INTEGER NOT NULL,
    "id_veiculo" INTEGER NOT NULL,
    CONSTRAINT "avaliacoes_id_servico_fkey" FOREIGN KEY ("id_servico") REFERENCES "servicos" ("id_servico") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "avaliacoes_id_veiculo_fkey" FOREIGN KEY ("id_veiculo") REFERENCES "veiculos" ("id_veiculo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_placa_key" ON "veiculos"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_id_agendamento_key" ON "pagamentos"("id_agendamento");
