import { prisma } from '../config/db.js';

export async function listCategories(userId) {
  return prisma.category.findMany({
    where: {
      OR: [{ userId }, { isDefault: true }]
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }]
  });
}

export async function createCategory(userId, data) {
  return prisma.category.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      color: data.color || '#64748b',
      icon: data.icon || 'tag',
      isDefault: false
    }
  });
}

export async function updateCategory(userId, id, data) {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw new Error('Categoria não encontrada ou não pode ser editada.');

  return prisma.category.update({
    where: { id },
    data
  });
}

export async function removeCategory(userId, id) {
  const category = await prisma.category.findFirst({ where: { id, userId } });
  if (!category) throw new Error('Categoria não encontrada ou não pode ser excluída.');

  const related = await prisma.transaction.findFirst({ where: { categoryId: id, userId } });
  if (related) throw new Error('Não é possível excluir uma categoria com transações vinculadas.');

  await prisma.category.delete({ where: { id } });
}
