const API_KEY = 'c20a9b77d03a40fd86e6d9db1e086a2a.F3PCGXKT49rBsrSS';
const API_URL = 'https://api.z.ai/api/paas/v4/chat/completions';

async function test() {
  console.log('Testing Z.AI API with global fetch...');
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
          { role: 'user', content: 'Hello, are you active?' }
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
      console.error('API Error:', response.status, data);
    } else {
      console.log('API Success!');
      console.log('Duration:', duration, 'ms');
      console.log('Response:', data.choices[0].message.content);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
