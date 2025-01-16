import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly chatModel: ChatOpenAI;

  constructor(private configService: ConfigService) {
    this.chatModel = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      temperature: 0.7,
      modelName: 'gpt-4-0125-preview',
      maxTokens: 500,
      streaming: false,
      callbacks: [
        {
          handleLLMError: (error) => {
            this.logger.error('LLM Error:', {
              message: error.message,
              name: error.name,
              stack: error.stack,
            });
          },
          handleLLMEnd: (output) => {
            this.logger.debug('LLM Response:', {
              usage: output.llmOutput?.tokenUsage,
            });
          },
        },
      ],
      timeout: 30000,
      maxRetries: 3,
    });
  }

  async generateResponse(userMessage: string): Promise<string> {
    console.log('userMessage', userMessage);

    try {
      const response = await this.chatModel.invoke([
        new SystemMessage(
          'You are a helpful assistant responding to Facebook messages. Be concise and friendly.',
        ),
        new HumanMessage(userMessage),
      ]);

      return response.content.toString();
    } catch (error) {
      this.logger.error(`Error generating AI response: ${error.message}`);
      throw error;
    }
  }
}
