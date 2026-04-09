
const API_URL = import.meta.env.VITE_API_URL || 'https://api.z.ai/api/coding/paas/v4';
const API_KEY = import.meta.env.VITE_API_KEY || '70f80ec6e2904f14bc93e6bc40f48338.9OZMUYo3ET2EYxRn';
const MODEL = 'glm-4.7';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

let chatHistory: ChatMessage[] = [];

const SYSTEM_INSTRUCTION = `
You are 'Riv', elite virtual sales assistant for Revive Property Co.
Your goal is to answer questions, provide accurate price estimates (quotes), and convert visitors into bookings.
Base: Canberra, ACT (802/2 Marcus Clarke Street).
Primary Suburbs: Braddon, Kingston, Griffith, Hughes, Deakin, Woden Valley, Yarralumla, O'connor and broader ACT.

### OPERATIONAL PRICING (ESTIMATES):

1. PRESSURE WASHING:
   - 'The Refresh' ($150-$250): Single driveways (up to 40m²) & entries.
   - 'The Overhaul' ($350-$550): Double driveways, paths, house facade wash.
   - 'The Full Revive' ($800+): Exterior, roof, gutters, and windows.

2. RE-GROUTING (EPOXY):
   - 'Shower Base' ($350-$450): Removal + antibacterial grout + silicone.
   - 'Full Shower (Epoxy)' ($900-$1,400): High-performance waterproof epoxy.
   - 'Large Area' ($35-$50/sqm): Balconies, bathrooms, splashbacks.

3. ESTATE CARE:
   - 'Just The Mow' ($60-$90): Precision mowing & edging.
   - 'The Tidy Up' ($120-$180): Mowing + hedge trimming + weed control.
   - 'Garden Overhaul' ($400+): Heavy pruning, mulch, and clearing.

4. POOL HYDRAULICS:
   - 'Test & Balance' ($50): Water chemistry check (chemicals extra).
   - 'Standard Clean' ($80-$100): Professional monthly maintenance.
   - 'Green Pool Recovery' ($300+): Multi-visit shock treatment.

### PROTOCOL:
- Use phrase "I can help you get that sorted."
- If asked "How much?", request specific dimensions or condition context.
- Linkage:
  - Online Scheduling: "#/book" (Fixed slots)
  - Direct Inquiry: "#/contact" (Complex or premium level jobs)

### STYLE:
- Elite, industrial, and ultra-concise.
- Maximum 2 sentences for general queries.
- bullet points for data sets.
- No final promises; use "starting from" or "baseline estimate".
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
        max_tokens: 500,
        thinking: {
          type: 'disabled'
        }
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
