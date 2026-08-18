import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import logger from '../../config/logger.js';

export class ChatController {
  private aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  ask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ticker } = req.params;
      const { query, chatHistory } = req.body;

      if (!query) {
        res.status(400).json({ error: 'BadRequest', message: 'Query parameter is required' });
        return;
      }

      logger.info(`Forwarding chat query for ${ticker} to AI service`);

      const response = await axios.post(`${this.aiServiceUrl}/api/chat`, {
        ticker: ticker.toUpperCase(),
        query,
        chat_history: chatHistory || [],
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000, // 20 seconds timeout for LLM RAG completion
      });

      res.status(200).json(response.data);
    } catch (error: any) {
      logger.error(`RAG Chat API connection failed: ${error.message}`);
      
      // Fallback if FastAPI or Qdrant is offline
      res.status(200).json({
        answer: "I apologize, but my real-time document search is temporarily offline. Please ensure your FastAPI and Qdrant backend containers are running.",
        citations: ["System Alert"]
      });
    }
  };
}

export default ChatController;
