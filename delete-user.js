const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// node delete-user.js list
// node delete-user.js delete email@exemplo.com

const action = process.argv[2];
const email = process.argv[3];

async function listUsers() {
  try {
    const users = await prisma.usuario.findMany();
    console.log('Usuários no banco:', JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function deleteUser(emailToDelete) {
  if (!emailToDelete) {
    console.log('Uso: node delete-user.js delete email@exemplo.com');
    return;
  }

  try {
    const deletedUser = await prisma.usuario.delete({
      where: { email: emailToDelete }
    });
    console.log('Usuário deletado:', deletedUser);
  } catch (error) {
    console.error('Erro ao deletar usuário:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (action === 'list') {
    await listUsers();
  } else if (action === 'delete') {
    await deleteUser(email);
  } else {
    console.log('Uso:');
    console.log('  node delete-user.js list              - Lista todos os usuários');
    console.log('  node delete-user.js delete email      - Deleta usuário por email');
  }
}

main();