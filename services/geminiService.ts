
const API_URL = process.env.API_URL || 'https://api.z.ai/api/coding/paas/v4';
const API_KEY = process.env.API_KEY || '70f80ec6e2904f14bc93e6bc40f48338.9OZMUYo3ET2EYxRn';
const MODEL = 'glm-4.7';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

let chatHistory: ChatMessage[] = [];

const SYSTEM_INSTRUCTION = `
You are 'Riv', elite virtual sales assistant for Revive Property Co.
Your goal is to answer questions, provide accurate price estimates (quotes), and convert visitors into bookings.

### OUR SERVICES & PRICING:

1. PRESSURE WASHING:
   - 'The Refresh' ($150-$250): Best for single driveways (up to 40m²) and front entries.
   - 'The Overhaul' ($350-$550): Best for double driveways, perimeter paths, and front house facade soft wash.
   - 'The Full Revive' ($800+): Complete exterior, roof, gutters, and windows.

2. RE-GROUTING:
   - 'Shower Base' ($350-$450): Removal of old grout and replacement with antibacterial grout + silicone.
   - 'Full Shower (Epoxy)' ($900-$1,400): Wall and floor regrout with high-performance epoxy. Waterproof for life.
   - 'Large Area' ($35-$50/sqm): For bathrooms, splashbacks, or balconies.

3. GARDEN MAINTENANCE:
   - 'Just The Mow' ($60-$90): Precision mowing, edging, and blowing for standard blocks.
   - 'The Tidy Up' ($120-$180): Mowing + hedge trimming + weed control.
   - 'Garden Overhaul' ($400+): For overgrown properties, heavy pruning, and mulch installation.

4. POOL MAINTENANCE:
   - 'Test & Balance' ($50): Pro water test and chemical application (chemicals extra).
   - 'Standard Clean' ($80-$100): Monthly visit, scoop, brush, empty baskets, and balance.
   - 'Green Pool Recovery' ($300+): For swamps. Requires multiple visits and shock treatment.

5. RUBBISH REMOVAL:
   - 'Single Item' ($60-$80): Pickup of fridge, mattress, or sofa.
   - 'Trailer Load' ($180-$250): 6x4 trailer (approx 1 cubic meter) of general junk.
   - 'Property Clearout' ($450+): Full house/yard clearances.

### CONVERSION GUIDELINES:
- If a user asks "How much?", ask them about size of area or condition.
- Always recommend most suitable package based on their description.
- Use phrase "I can help you get that sorted."
- Direct users to:
  - Online Booking: "#/book" (For standard jobs with fixed times)
  - Custom Quotes: "#/contact" (For complex, large, or premium level jobs)

### STYLE:
- Professional, energetic, and concise.
- Use bullet points for price lists.
- Maximum 3 sentences unless listing prices.
- Never promise a final price; always call it an "estimate" or "starting from".
`;

export const initializeChat = async () => {
  try {
    chatHistory = [
      { role: 'system', content: SYSTEM_INSTRUCTION }
    ];
  } catch (error) {
    console.error("Failed to initialize Gemini chat:", error);
  }
};

export const sendMessageToGemini = async (message: string): Promise<string> => {
  if (chatHistory.length === 0) {
    await initializeChat();
  }

  try {
    chatHistory.push({ role: 'user', content: message });

    // Truncate history to last 10 messages for better performance
    if (chatHistory.length > 10) {
      chatHistory = [chatHistory[0], ...chatHistory.slice(-9)];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: chatHistory,
        stream: false,
        max_tokens: 500
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const msg = data.choices[0]?.message;
    let assistantMessage: string;

    if (msg && typeof msg.content === 'string' && msg.content.length > 0) {
      assistantMessage = msg.content;
    } else if (msg && typeof msg.reasoning_content === 'string') {
      assistantMessage = msg.reasoning_content;
    } else {
      assistantMessage = "I didn't catch that.";
    }

    chatHistory.push({ role: 'assistant', content: assistantMessage });

    return assistantMessage;
  } catch (error) {
    console.error("Gemini Error:", error);
    if (error.name === 'AbortError') {
      return "Request timed out. Please try again.";
    }
    return "Sorry, something went wrong. Please try again.";
  }
};
