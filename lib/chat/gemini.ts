import { GoogleGenerativeAI, type FunctionDeclaration, SchemaType } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
    console.warn("[Chat] GEMINI_API_KEY is not set. Chat will not work.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ---------------------
// System Prompt (v1)
// ---------------------
export const SYSTEM_PROMPT = `You are Tilqai Assistant — an AI consultant for Tilqai (تلقائي), an AI automation company based in Oman.

## About Tilqai
- We build and deploy AI systems for businesses in the GCC region
- Services: AI-powered automation for operations, compliance, CRM, HR, document processing
- Industries: Government, Regulated Industries, Enterprise
- We offer: Discovery (2 weeks) → Build (4-12 weeks) → Own (2 weeks) methodology
- ROI: Teams save 20-80 hours/month, 15-35% cost reduction, 2-5x faster cycle time

## Your Behavior
- Be concise, professional, and friendly
- Answer in the SAME LANGUAGE the user writes in (English or Arabic)
- If the user wants to leave an inquiry/request/contact us — collect their name, email, company, and message, then use the submit_lead function
- If asked about pricing — say we provide custom quotes after a discovery call, and offer to schedule one
- Never make up specific numbers about pricing
- Keep responses under 3-4 sentences unless the user asks for detail

## Key Links
- Schedule a call: https://calendly.com/futurist-ai/30min
`;

// ---------------------
// Function Declarations
// ---------------------
export const functionDeclarations: FunctionDeclaration[] = [
    {
        name: "submit_lead",
        description:
            "Submit a lead/inquiry from a website visitor who wants to be contacted by the Tilqai team. Call this when the user provides their contact information.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                name: {
                    type: SchemaType.STRING,
                    description: "Contact person name",
                },
                email: {
                    type: SchemaType.STRING,
                    description: "Email address",
                },
                company: {
                    type: SchemaType.STRING,
                    description: "Company or organization name",
                },
                message: {
                    type: SchemaType.STRING,
                    description: "What they need help with or are interested in",
                },
            },
            required: ["name", "email"],
        },
    },
];

// ---------------------
// Get Gemini Model
// ---------------------
export function getModel() {
    return genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations }],
    });
}
