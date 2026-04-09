const API_KEY = '70f80ec6e2904f14bc93e6bc40f48338.9OZMUYo3ET2EYxRn';
const API_URL = 'https://api.z.ai/api/coding/paas/v4/chat/completions';

async function test() {
  console.log('Testing Z.AI Coding API...');
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
          { role: 'user', content: 'Hello, are you active on the coding plan?' }
        ],
        thinking: {
          type: 'disabled'
        },
        max_tokens: 50
      })
    });

    const duration = Date.now() - start;
    const data = await response.json();

    if (!response.ok) {
      console.error('API Error:', response.status, JSON.stringify(data, null, 2));
    } else {
      console.log('API Success!');
      console.log('Duration:', duration, 'ms');
      console.log('Response:', data.choices[0].message.content);
    }
  } catch (error) {
    console.error('Fetch Error:', error.message);
  }
}

test();
