import env from '@/utils/validateEnv.util';
import { injectable } from 'inversify';
import OpenAI from 'openai';

@injectable()
export class AiService {
    private readonly client: OpenAI;
    constructor() {
        const configuration = new OpenAI({
            apiKey: env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1'
        });
        this.client = configuration;
    }
    public async reviewArtwork(artworkDetails: {
        title: string;
        description: string;
        category: string[];
        dimensions: { width: number; height: number };
        url: string;
    }): Promise<{
        approved: boolean;
        reason?: string;
        keywords?: string[];
        suggestedCategories?: string[];
        description: string;
        metadata?: Record<string, any>;
    }> {
        const textPrompt = `ARTWORK SUBMISSION FOR REVIEW:
Title: "${artworkDetails.title}"
Description: "${artworkDetails.description}"
Categories: ${artworkDetails.category.join(', ')}
Dimensions: ${artworkDetails.dimensions.width}cm × ${artworkDetails.dimensions.height}cm
Reference URL: ${artworkDetails.url}

Analyze this artwork submission thoroughly according to platform guidelines.`;

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{
            role: 'system', content: `You are an expert art curator and moderator responsible for reviewing artwork submissions.

REVIEW CRITERIA:
1. Content appropriateness - Check for prohibited content (explicit material, hate speech, violence)
2. Quality standards - Evaluate artistic merit and technical execution
3. Metadata accuracy - Assess if title, description and categories match the artwork
4. Originality - Flag potential copyright issues or derivative works

RESPONSE FORMAT (JSON only):
{
  "decision": "APPROVE" or "REJECT",
  "reason": "Clear, constructive explanation of decision with specific details",
  "generatedDescription": "Refined, compelling 800-1200 character description highlighting key artistic elements",
  "keywords": ["relevant", "descriptive", "searchable", "terms"],
  "suggestedCategories": {
    "primary": "most appropriate category",
    "secondary": ["additional", "relevant", "categories"]
  },
  "metadata": {
    "style": "identified artistic style",
    "subject": "main subject matter",
    "colors": ["predominant", "color", "palette"],
    "mood": "emotional tone of the artwork",
    "technique": "artistic methods used"
  }
}

Be constructive and specific in your feedback. If rejecting, explain exactly what needs to be changed.`
        }, {
            role: 'user', content: textPrompt
        }];

        try {
            const response = await this.createCompletion(messages, {
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 2048
            },
                'grok-2-latest' // Changed from vision model since image processing isn't needed
            );

            console.log('AI Response:', response);

            try {
                const parsedResponse = JSON.parse(response);
                const description = parsedResponse.generatedDescription ||
                    "No description generated by AI. This artwork was processed automatically.";

                return {
                    approved: parsedResponse.decision === 'APPROVE',
                    reason: parsedResponse.reason,
                    keywords: parsedResponse.keywords || [],
                    suggestedCategories: parsedResponse.suggestedCategories ?
                        [parsedResponse.suggestedCategories.primary,
                        ...(parsedResponse.suggestedCategories.secondary || [])] : [],
                    description: description,
                    metadata: parsedResponse.metadata || {}
                };
            } catch (parseError) {
                console.error('Failed to parse AI response as JSON:', parseError);

                const isApproved = response.includes('APPROVE');
                const reasonMatch = response.match(/Reason:(.*?)(?:\n|$)/i);
                const fallbackDescription = `This artwork titled "${artworkDetails.title}" was processed automatically. ` +
                    `The original description provided was: "${artworkDetails.description}"`;

                return {
                    approved: isApproved,
                    reason: reasonMatch ? reasonMatch[1].trim() : 'Unable to determine specific reason',
                    description: fallbackDescription,
                    keywords: [],
                    suggestedCategories: [],
                    metadata: {}
                };
            }
        } catch (error: any) {
            console.error('Error during artwork review:', error);
            throw new Error(`Artwork review failed: ${error.message}`);
        }
    }

    public async reviewUpdateArtwork(
        artwork: {
            title: string;
            description: string;
            category: string[];
            dimensions?: { width: number; height: number };
            url?: string;
            moderationStatus?: 'pending' | 'approved' | 'rejected' | 'suspended' | string;
            moderationReason?: string;
            moderatedBy?: string;
            aiReview?: {
                keywords?: string[];
                suggestedCategories?: string[];
                description?: string;
                metadata?: Record<string, any>;
            };
        }
    ): Promise<{
        approved: boolean;
        reason: string;
        improvements: string[];
        description: string;
        keywords?: string[];
        suggestedCategories?: string[];
        metadata?: Record<string, any>;
    }> {
        const textPrompt = `UPDATED ARTWORK REVIEW REQUEST:
Title: "${artwork.title}"
Description: "${artwork.description}"
Categories: ${artwork.category.join(', ')}
${artwork.dimensions ? `Dimensions: ${artwork.dimensions.width}cm × ${artwork.dimensions.height}cm` : ''}
${artwork.url ? `Reference URL: ${artwork.url}` : ''}

PREVIOUS REVIEW INFORMATION:
Status: ${artwork.moderationStatus || 'Not specified'}
Rejection Reason: ${artwork.moderationReason || 'Not specified'}
Reviewed By: ${artwork.moderatedBy || 'Not specified'}

Evaluate if the updated submission addresses the previous rejection reasons and meets platform standards.`;

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{
            role: 'system', content: `You are an expert art curator evaluating a resubmitted artwork that was previously rejected.

REVIEW CRITERIA:
1. Assess if the updates address the specific reasons for initial rejection
2. Verify the artwork now meets all platform guidelines and standards
3. Evaluate overall quality and appropriateness

RESPONSE FORMAT (JSON only):
{
  "decision": "APPROVE" or "REJECT",
  "reason": "Detailed explanation of your decision",
  "improvements": ["Specific change 1", "Specific change 2", "etc"],
  "remainingIssues": ["Issue 1", "Issue 2", "etc"],
  "generatedDescription": "Refined, compelling 800-1200 character description",
  "keywords": ["relevant", "descriptive", "terms"],
  "suggestedCategories": {
    "primary": "most appropriate category",
    "secondary": ["additional", "relevant", "categories"]
  },
  "metadata": {
    "style": "artistic style",
    "subject": "main subject",
    "colors": ["color", "palette"],
    "mood": "emotional tone",
    "technique": "methods used"
  }
}

Be specific about what has improved and what still needs attention.`
        }, {
            role: 'user', content: textPrompt
        }];

        try {
            const response = await this.createCompletion(messages, {
                response_format: { type: 'json_object' },
                temperature: 0.1,
                max_tokens: 2048
            },
                'grok-2-latest'
            );

            console.log('AI Update Review Response:', response);

            try {
                const parsedResponse = JSON.parse(response);
                const description = parsedResponse.generatedDescription ||
                    artwork.aiReview?.description ||
                    `This updated artwork titled "${artwork.title}" was reviewed.`;

                return {
                    approved: parsedResponse.decision === 'APPROVE',
                    reason: parsedResponse.reason,
                    improvements: parsedResponse.improvements || [],
                    description: description,
                    keywords: parsedResponse.keywords || artwork.aiReview?.keywords || [],
                    suggestedCategories: parsedResponse.suggestedCategories ?
                        [parsedResponse.suggestedCategories.primary,
                        ...(parsedResponse.suggestedCategories.secondary || [])] :
                        artwork.aiReview?.suggestedCategories || [],
                    metadata: parsedResponse.metadata || artwork.aiReview?.metadata || {}
                };
            } catch (parseError) {
                console.error('Failed to parse AI update review response as JSON:', parseError);

                const isApproved = response.includes('APPROVE');
                const reasonMatch = response.match(/Reason:(.*?)(?:\n|$)/i);
                const improvementsMatch = response.match(/Improvements:(.*?)(?:\n\n|$)/is);

                return {
                    approved: isApproved,
                    reason: reasonMatch ? reasonMatch[1].trim() : 'Unable to determine specific reason',
                    improvements: improvementsMatch ?
                        improvementsMatch[1].split('\n').map(item => item.replace(/^- /, '').trim())
                            .filter(item => item.length > 0) : [],
                    description: artwork.aiReview?.description ||
                        `This updated artwork titled "${artwork.title}" was reviewed.`,
                    keywords: artwork.aiReview?.keywords || [],
                    suggestedCategories: artwork.aiReview?.suggestedCategories || [],
                    metadata: artwork.aiReview?.metadata || {}
                };
            }
        } catch (error: any) {
            console.error('Error during updated artwork review:', error);
            throw new Error(`Updated artwork review failed: ${error.message}`);
        }
    }
    private async createCompletion(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[], options: {
        response_format?: { type: 'json_object' } | { type: 'text' }; temperature?: number; max_tokens?: number;
    } = {}, model?: string): Promise<string> {
        try {
            const completion = await this.client.chat.completions.create({
                model: model || 'grok-2-latest', messages: messages, ...options
            });
            return completion.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('Error in createCompletion:', error);
            throw new Error('Failed to create completion');
        }
    }

    public async detectLanguage(text: string): Promise<string> {
        try {
            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                {
                    role: 'system',
                    content: 'You are a language detection tool. Analyze the provided text and respond ONLY with the appropriate language code in ISO format (e.g., "en-US", "fr-FR", "ja-JP", "zh-CN", etc.). If unsure, return "en-US" as default.'
                },
                {
                    role: 'user',
                    content: `Detect the language of this text: "${text}"`
                }
            ];

            const response = await this.createCompletion(messages, {
                temperature: 0.1,
                max_tokens: 10
            }, 'grok-2-latest'
            );

            console.log('Language Detection Response:', response);
            // return response.trim() || 'en-US';
        } catch (error) {
            console.error('Error in detectLanguage:', error);
            throw new Error('Failed to detect language');
        }
    }
}
