import { PrismaClient } from '@prisma/client';
import { generateFinancialAdvice } from '../services/aiService.js';

const prisma = new PrismaClient();

/**
 * Envia mensagem do usuário para o chatbot e retorna resposta da IA
 */
export async function sendMessage(req, res) {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Mensagem é obrigatória.' });
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
      conversationHistory.reverse()
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
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
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
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico.' });
  }
}
