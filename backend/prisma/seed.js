import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaults = [
  { name: 'Salário', type: 'income', isDefault: true, color: '#22c55e', icon: 'wallet' },
  { name: 'Freelance', type: 'income', isDefault: true, color: '#16a34a', icon: 'briefcase' },
  { name: 'Investimentos', type: 'income', isDefault: true, color: '#0ea5e9', icon: 'trending-up' },
  { name: 'Bolsa-auxílio', type: 'income', isDefault: true, color: '#84cc16', icon: 'gift' },
  { name: 'Estágio', type: 'income', isDefault: true, color: '#06b6d4', icon: 'briefcase' },
  { name: 'Freela acadêmico', type: 'income', isDefault: true, color: '#f59e0b', icon: 'pen-tool' },
  { name: 'Moradia', type: 'expense', isDefault: true, color: '#ef4444', icon: 'house' },
  { name: 'Alimentação', type: 'expense', isDefault: true, color: '#f97316', icon: 'utensils' },
  { name: 'Transporte', type: 'expense', isDefault: true, color: '#eab308', icon: 'car' },
  { name: 'Saúde', type: 'expense', isDefault: true, color: '#06b6d4', icon: 'heart-pulse' },
  { name: 'Lazer', type: 'expense', isDefault: true, color: '#8b5cf6', icon: 'gamepad-2' },
  { name: 'Educação', type: 'expense', isDefault: true, color: '#3b82f6', icon: 'graduation-cap' },
  { name: 'Mensalidade/Anuidade', type: 'expense', isDefault: true, color: '#6366f1', icon: 'book-open' },
  { name: 'Materiais de Estudo', type: 'expense', isDefault: true, color: '#8b5cf6', icon: 'book' },
  { name: 'Transporte para Faculdade', type: 'expense', isDefault: true, color: '#ec4899', icon: 'bus' },
  { name: 'Restaurante Universitário', type: 'expense', isDefault: true, color: '#f43f5e', icon: 'utensils' },
  { name: 'Alojamento/República', type: 'expense', isDefault: true, color: '#d946ef', icon: 'home' },
  { name: 'Cursos Complementares', type: 'expense', isDefault: true, color: '#a855f7', icon: 'laptop' },
];

async function main() {
  for (const item of defaults) {
    const exists = await prisma.category.findFirst({
      where: { name: item.name, isDefault: true, type: item.type }
    });

    if (!exists) {
      await prisma.category.create({ data: item });
    }
  }
  console.log('Seed executado com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
