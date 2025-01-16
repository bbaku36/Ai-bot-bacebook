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
      maxTokens: 1000,
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

    // Define product information in Mongolian
    const productList = `
    1. Олон үйлдэлт ногоо хэрчигч
    - Үнэ: 18,500₮
    - Онцлог:
      - Цэвэр ган иртэй, практик загвар.
      - Ногоо болон жимсийг янз бүрээр хэрчих сольж болдог ирнүүдтэй.
      - Гар гэмтэхээс хамгаалах аюулгүй ажиллагааны системтэй.
      - Зэвэрдэггүй, удаан эдэлгээтэй материалтай.
      - Хальтирдаггүй суурьтай, хэрэглэхэд хялбар.
      - Хоол хийх процессыг хөнгөвчилж цаг хэмнэнэ.
    - Хүргэлт: Үнэгүй хүргэлттэй.
  
    2. Wi-Fi Ухаалаг Залгуур
    - Үнэ: Үндсэн үнэ: 45,000₮, Хямдарсан үнэ: 35,000₮
    - Онцлог:
      - 20A хүртэл өндөр чадалтай, том оврын төхөөрөмжийг дэмжинэ.
      - Alexa, Google Assistant, Tmall Genie-тэй нийцтэй.
      - Tuya болон Smart Life апп-уудтай бүрэн ажиллана.
      - Wi-Fi холболтоор хялбар суурилуулна.
      - Цаг тохируулах горимтой – төхөөрөмжөө автоматаар асааж, унтраах боломжтой.
      - Нэг утаснаас олон төхөөрөмж удирдах эсвэл олон утаснаас нэг төхөөрөмж удирдах боломжтой.
    - Хүргэлт: Хот дотор үнэгүй хүргэлттэй.
    `;

    try {
      const response = await this.chatModel.invoke([
        new SystemMessage(
          `Та Facebook-ийн мессежүүдэд хариулах эелдэг, ойлгомжтой туслах юм. Хэрэглэгчийн асуултад хариулахдаа доорх бүтээгдэхүүний мэдээллийг ашиглана уу:\n\n${productList}`,
        ),
        new HumanMessage(userMessage),
      ]);

      return response.content.toString();
    } catch (error) {
      this.logger.error(`AI хариу үүсгэхэд алдаа гарлаа: ${error.message}`);
      throw error;
    }
  }
}
