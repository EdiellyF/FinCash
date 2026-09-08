import { PrismaClient } from '@prisma/client';
import { generateFinancialAdvice, getUserLimits, getComparativeContext } from '../services/aiService.js';
import PDFDocument from 'pdfkit';
import { logger } from '../config/logger.js';
import { logSanitizedError, logSanitizedWarn } from '../utils/safeLogger.js';

const prisma = new PrismaClient();

/**
 * Envia mensagem do usuário para o chatbot e retorna resposta da IA
 */
export async function sendMessage(req, res) {
  try {
    const { message, period = '30d' } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Mensagem é obrigatória.' });
    }

    // Validar período
    const validPeriods = ['7d', '30d', '365d'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ message: 'Período inválido. Use: 7d, 30d ou 365d.' });
    }

    // Buscar histórico recente da conversa (últimas 10 mensagens)
    const conversationHistory = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Gerar resposta da IA
    const aiResponse = await generateFinancialAdvice(
      userId,
      message,
      conversationHistory.reverse(),
      period
    );

    // Salvar mensagem do usuário
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
      },
    });

 
    const savedResponse = await prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: aiResponse,
      },
    });

    res.json({
      message: aiResponse,
      id: savedResponse.id,
      createdAt: savedResponse.createdAt,
      period,
    });
  } catch (error) {
    logSanitizedError('Erro ao enviar mensagem', error, { userId: req?.user?.id });
    res.status(500).json({ message: 'Erro ao processar mensagem.' });
  }
}

export async function getHistory(req, res) {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    res.json(messages);
  } catch (error) {
    logSanitizedError('Erro ao buscar histórico', error, { userId: req?.user?.id });
    res.status(500).json({ message: 'Erro ao buscar histórico.' });
  }
}

export async function getLimits(req, res) {
  try {
    const userId = req.user.id;
    const limits = await getUserLimits(userId);
    res.json(limits);
  } catch (error) {
    logSanitizedError('Erro ao buscar limites', error, { userId: req?.user?.id });
    res.status(500).json({ message: 'Erro ao buscar limites.' });
  }
}

export async function exportToPdf(req, res) {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    const doc = new PDFDocument({ margin: 50 });
    const filename = `analise-financeira-${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Cabeçalho
    doc.fontSize(20).fillColor('#10B981').text('FinCash - Análise Financeira IA', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).fillColor('#666666').text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    // Conteúdo das mensagens
    let messageCount = 0;
    for (const msg of messages) {
      if (msg.role === 'assistant') {
        messageCount++;
        doc.fontSize(14).fillColor('#333333').text(`Análise #${messageCount}`, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#666666').text(`Data: ${new Date(msg.createdAt).toLocaleString('pt-BR')}`);
        doc.moveDown(0.5);

        // Quebrar o conteúdo em linhas
        const content = msg.content;
        const lines = doc.widthOfString(content) > (doc.page.width - 100);
        if (lines) {
          doc.fontSize(11).fillColor('#000000').text(content, { width: doc.page.width - 100, align: 'justify' });
        } else {
          doc.fontSize(11).fillColor('#000000').text(content);
        }
        doc.moveDown(2);

        // Nova página se necessário
        if (doc.y > 700) {
          doc.addPage();
        }
      }
    }

    // Rodapé
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(9).fillColor('#999999').text(
        `Página ${i + 1} de ${pageCount} - FinCash © 2026`,
        50,
        doc.page.height - 30,
        { align: 'center' }
      );
    }

    doc.end();
  } catch (error) {
    logSanitizedError('Erro ao exportar PDF', error, { userId: req?.user?.id });
    res.status(500).json({ message: 'Erro ao exportar PDF.' });
  }
}

export async function comparePeriods(req, res) {
  try {
    const userId = req.user.id;
    const { periods = ['7d', '30d', '365d'] } = req.body;

    const comparativeData = await getComparativeContext(userId, periods);

    res.json(comparativeData);
  } catch (error) {
    logSanitizedError('Erro ao comparar períodos', error, { userId: req?.user?.id });
    res.status(500).json({ message: 'Erro ao comparar períodos.' });
  }
}

export async function sendMessageStream(req, res) {
  try {
    const { message, period = '30d' } = req.body;
    const userId = req.user.id;
    const socketId = req.body.socketId;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Mensagem é obrigatória.' });
    }

    // Validar período
    const validPeriods = ['7d', '30d', '365d'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ message: 'Período inválido. Use: 7d, 30d ou 365d.' });
    }

    // Buscar histórico recente da conversa (últimas 10 mensagens)
    const conversationHistory = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Salvar mensagem do usuário
    await prisma.chatMessage.create({
      data: {
        userId,
        role: 'user',
        content: message,
      },
    });

    const io = global.io;
    if (!io || !socketId) {
      return res.status(400).json({ message: 'WebSocket não disponível.' });
    }

    const socket = io.sockets.sockets.get(socketId);
    if (!socket || socket.userId !== req.user.id) {
      logger.warn('Unauthorized socket emit attempt', { userId: req.user.id, socketId });
      return res.status(403).json({ message: 'Não autorizado.' });
    }

    
    const context = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '365d': 365,
      }[period] || 30;

      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const recentTransactions = await tx.transaction.findMany({
        where: {
          userId,
          transactionDate: { gte: startDate },
        },
        include: { category: true },
        orderBy: { transactionDate: 'desc' },
        take: 50,
      });

      const goals = await tx.goal.findMany({
        where: { userId },
        orderBy: { deadline: 'asc' },
      });

      const budgets = await tx.budget.findMany({
        where: {
          userId,
          month: currentMonth,
          year: currentYear,
        },
        include: { category: true },
      });

      const totalIncome = recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpense = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        balance: totalIncome - totalExpense,
        totalIncome,
        totalExpense,
        recentTransactions,
        goals,
        budgets,
        currentMonth,
        currentYear,
        period,
        periodDays,
      };
    });

    // Enviar contexto para o cliente
    socket.emit('chat:context', { context });

 
    const historyText = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content}`)
      .join('\n');

    const contextText = `
Contexto Financeiro do Usuário:
- Período analisado: ${context.period} (${context.periodDays} dias)
- Saldo atual: R$ ${context.balance.toFixed(2)}
- Receitas no período: R$ ${context.totalIncome.toFixed(2)}
- Despesas no período: R$ ${context.totalExpense.toFixed(2)}
- Mês atual: ${context.currentMonth}/${context.currentYear}

Metas Financeiras:
${context.goals.map(g => `- ${g.title}: R$ ${Number(g.currentAmount).toFixed(2)} / R$ ${Number(g.targetAmount).toFixed(2)}${g.deadline ? ` (Prazo: ${g.deadline.toLocaleDateString('pt-BR')})` : ''}`).join('\n')}

Orçamentos do Mês:
${context.budgets.map(b => `- ${b.category.name}: Limite R$ ${Number(b.limitAmount).toFixed(2)}`).join('\n') || 'Nenhum orçamento definido'}

Últimas Transações:
${context.recentTransactions.map(t => `- ${t.type === 'income' ? 'Receita' : 'Despesa'}: ${t.title} - R$ ${Number(t.amount).toFixed(2)} (${t.category.name})`).join('\n')}
`;

    const userMessage = message;
    const fullPrompt = `${contextText}\n\nHistórico da conversa:\n${historyText}\n\nPergunta atual: ${userMessage}`;

   
    const { generateFinancialAdvice } = await import('../services/aiService.js');
    const response = await generateFinancialAdvice(userId, message, conversationHistory.reverse(), period);

   
    const chunkSize = 100;
    for (let i = 0; i < response.length; i += chunkSize) {
      const chunk = response.slice(i, i + chunkSize);
      socket.emit('chat:chunk', { chunk, done: false });
      await new Promise(resolve => setTimeout(resolve, 50)); 
    }

    socket.emit('chat:chunk', { chunk: '', done: true });

    // Salvar resposta completa
    const savedResponse = await prisma.chatMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: response,
      },
    });

    res.json({
      message: response,
      id: savedResponse.id,
      createdAt: savedResponse.createdAt,
      period,
      streamed: true,
    });
  } catch (error) {
    logSanitizedError('Erro ao enviar mensagem com streaming', error, { userId: req?.user?.id });
    res.status(500).json({ message: 'Erro ao processar mensagem.' });
  }
}
