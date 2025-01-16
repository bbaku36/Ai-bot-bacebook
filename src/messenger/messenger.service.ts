import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiService } from '../ai/ai.service';

@Injectable()
export class MessengerService {
  private readonly logger = new Logger(MessengerService.name);
  private readonly pageAccessToken: string;

  constructor(
    private configService: ConfigService,
    private aiService: AiService,
  ) {
    this.pageAccessToken = this.configService.get<string>(
      'FACEBOOK_PAGE_ACCESS_TOKEN',
    );
  }

  async handleMessage(senderId: string, message: string): Promise<void> {
    try {
      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(message);

      // Send response back to Facebook
      await this.sendMessage(senderId, aiResponse);
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
      throw error;
    }
  }

  private async sendMessage(
    recipientId: string,
    message: string,
  ): Promise<void> {
    const url = `https://graph.facebook.com/v18.0/me/messages`;

    try {
      await axios.post(
        url,
        {
          recipient: { id: recipientId },
          message: { text: message },
        },
        {
          params: { access_token: this.pageAccessToken },
        },
      );
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      throw error;
    }
  }
}
