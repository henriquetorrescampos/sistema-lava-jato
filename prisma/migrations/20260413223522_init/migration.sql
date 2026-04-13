-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Veiculo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "cor" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Veiculo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Servico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "preco" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "data" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Agendamento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgendamentoServico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agendamentoId" INTEGER NOT NULL,
    "servicoId" INTEGER NOT NULL,
    CONSTRAINT "AgendamentoServico_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AgendamentoServico_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "Servico" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "valor" REAL NOT NULL,
    "metodo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "agendamentoId" INTEGER NOT NULL,
    CONSTRAINT "Pagamento_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "agendamentoId" INTEGER NOT NULL,
    CONSTRAINT "Avaliacao_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_cpf_key" ON "Usuario"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_agendamentoId_key" ON "Pagamento"("agendamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_agendamentoId_key" ON "Avaliacao"("agendamentoId");
