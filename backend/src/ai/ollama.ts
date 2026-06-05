import axios from 'axios';
import config, { getModelForHardware } from '../config';
import { logger } from '../utils/logger';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

interface OllamaEmbedResponse {
  embedding: number[];
}

class OllamaClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.ollama.baseUrl;
  }

  async generate(prompt: string, system?: string): Promise<string> {
    const { chat } = getModelForHardware();
    try {
      const response = await axios.post<OllamaResponse>(`${this.baseUrl}/api/generate`, {
        model: chat,
        prompt,
        system: system || 'You are a helpful career assistant specializing in tech job applications.',
        stream: false,
        options: { temperature: 0.7, num_predict: 2048 },
      });
      return response.data.response;
    } catch (error) {
      logger.error(`Ollama generate failed with ${chat}, trying fallback...`);
      try {
        const response = await axios.post<OllamaResponse>(`${this.baseUrl}/api/generate`, {
          model: config.ollama.fallbackModel,
          prompt,
          system: system || 'You are a helpful career assistant.',
          stream: false,
          options: { temperature: 0.7, num_predict: 2048 },
        });
        return response.data.response;
      } catch (fallbackError) {
        logger.error('Ollama fallback also failed:', fallbackError);
        throw new Error('AI service unavailable. Ensure Ollama is running.');
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    const { embed } = getModelForHardware();
    try {
      const response = await axios.post<OllamaEmbedResponse>(`${this.baseUrl}/api/embeddings`, {
        model: embed,
        prompt: text,
      });
      return response.data.embedding;
    } catch (error) {
      logger.error('Ollama embedding failed:', error);
      throw new Error('Embedding service unavailable');
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`);
      return true;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }
}

export const ollamaClient = new OllamaClient();
