const API_KEY = '70f80ec6e2904f14bc93e6bc40f48338.9OZMUYo3ET2EYxRn';
const API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';

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

async function askRiv(question) {
  console.log(`Querying Riv: "${question}"`);
  const start = Date.now();
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'glm-4.7',
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          { role: 'user', content: question }
        ],
        thinking: { type: 'disabled' },
        max_tokens: 500
      })
    });

    const duration = Date.now() - start;
    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', response.status, data);
    } else {
      console.log(`Duration: ${duration} ms`);
      console.log(`Riv: ${data.choices[0].message.content}`);
      console.log('-----------------------------------');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  await askRiv("tell me about revivepropertyco");
  await askRiv("should i use the epoxy grout or regular grout?");
}

runTests();
