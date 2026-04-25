import { prisma } from '../config/db.js';

export async function listGoals(userId) {
  const rows = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  return rows.map((goal) => ({
    ...goal,
    progress: Number(goal.targetAmount) > 0
      ? Math.min(100, (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
      : 0
  }));
}

export async function createGoal(userId, data) {
  return prisma.goal.create({
    data: {
      userId,
      title: data.title,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      deadline: data.deadline ? new Date(data.deadline) : null
    }
  });
}

export async function updateGoal(userId, id, data) {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error('Meta não encontrada.');

  return prisma.goal.update({
    where: { id },
    data: {
      title: data.title,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      deadline: data.deadline ? new Date(data.deadline) : null
    }
  });
}

export async function removeGoal(userId, id) {
  const goal = await prisma.goal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error('Meta não encontrada.');

  await prisma.goal.delete({ where: { id } });
}
