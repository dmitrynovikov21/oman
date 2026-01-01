import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.trim() : '';
    
    // Debug log to check if key is loaded (security: show only first 7 chars)
    if (apiKey) {
        console.log(`AiService initialized with Key: ${apiKey.substring(0, 7)}...`);
    } else {
        console.error('AiService: ANTHROPIC_API_KEY is missing!');
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey || 'dummy_key',
    });
  }

  async generateCaseReport(context: string): Promise<string> {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY is not set');
      return '<p>Error: API Key for Claude is missing.</p>';
    }

    try {
      console.log('Sending request to Anthropic with model: claude-sonnet-4-5-20250929');
      
      const msg = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        temperature: 0,
        system: `You are an expert legal assistant specializing in drafting Expert Reports for Omani Courts in ARABIC.

        Your Goal: Generate a formal "Expert Work Report" (تقــــرير أعمال الخبـــرة) based on the provided case context, following the exact structure and tone of the provided template.

        Output Language: ARABIC (Modern Standard Arabic for Legal Context).
        FORMAT: HTML ONLY. Do NOT use Markdown (no **, no ##). Use tags: <h1>, <h3>, <p>, <ul>, <li>, <strong>.

        Template Structure (Strictly Follow This):
        
        <div dir="rtl" style="text-align: right; direction: rtl;">
            <h1 style="text-align: center;">تقــــرير أعمال الخبـــرة</h1>
            
            <p><strong>بيانات الدعوى:</strong><br>
            دعوى رقم: [Case Number from Context]<br>
            المدعي: [Plaintiff Name from Context or Unknown]<br>
            المدعى عليها: [Defendant Name from Context or Unknown]<br>
            المحكمة: [Court Name from Context or Unknown]</p>
            
            <h3>1. المأمورية (Mandate)</h3>
            <p>[Summarize the expert's mandate based on court appointment document. If not present, state that the mandate is to analyze the labor dispute between the parties.]</p>
            
            <h3>2. موضوع التداعي / الطلبات (Subject of Litigation / Requests)</h3>
            <p><strong>طلبات المدعي:</strong></p>
            <ul>
              <li>[List plaintiff's requests based on documents]</li>
            </ul>
            <p><strong>طلبات المدعى عليها:</strong></p>
            <ul>
               <li>[List defendant's requests/rebuttals]</li>
            </ul>
            
            <h3>3. اجراءات الخبرة (Expertise Procedures)</h3>
            <ul>
               <li>الاطلاع على اوراق الدعوى ومستنداتها.</li>
               <li>[Mention if meetings were held or documents reviewed from Meeting Notes]</li>
            </ul>
            
            <h3>4. بحث و تحليل الدعوى وفق المأمورية (Research and Analysis)</h3>
            <p>[Deep analysis of the facts, financial entitlements (End of Service, Leave Salary, Unpaid Salaries, etc.), and conflicting statements. Use specific dates and amounts found in the context.]</p>
            
            <h3>5. خلاصة التقرير (Conclusion)</h3>
            <p>[Final conclusion and summary of entitlements/recommendations to the court.]</p>
        </div>
        
        Important: 
        - Use only the information provided in the context. 
        - If information is missing, state that it is not available in the provided documents.
        - Maintain a formal legal tone suitable for an Omani court.
        - Do NOT include <html>, <head> or <body> tags. Return only the inner HTML content starting with the div.
        `,
        messages: [
          {
            role: 'user',
            content: context,
          },
        ],
      });

      const textBlock = msg.content.find((c) => c.type === 'text');
      return textBlock ? (textBlock as any).text : 'No response generated.';
    } catch (error: any) {
      console.error('AI Generation failed:', error);
      // Return a user-friendly error message in HTML
      return `<div style="color: #ef4444; padding: 10px; border: 1px solid #ef4444; border-radius: 8px;">
        <h3>AI Generation Error</h3>
        <p>Failed to generate report. Reason: ${error.message || 'Unknown error'}</p>
        <p>Please check API keys and try again.</p>
      </div>`;
    }
  }
}
