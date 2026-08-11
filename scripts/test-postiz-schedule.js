const API_KEY = 'pos_80nVwWb8TIdMFTDV3Q8Z0Wpzu61bGiUy8iADDCMB';
const API_URL = 'https://api.postiz.com';

async function testSchedule() {
  const payload = {
    type: 'schedule',
    creationMethod: 'API',
    date: '2026-08-12T12:00:00Z',
    shortLink: true,
    tags: [],
    posts: [{
      integration: { id: 'cmrqspwfp0843qj0yyiru88sy' },
      value: [{
        content: 'Test post from Obioma Care automation 🤖 #nclex #nursing',
        image: [],
        delay: 0
      }],
      settings: { __type: 'x', who_can_reply_post: 'everyone' }
    }]
  };

  try {
    const resp = await fetch(`${API_URL}/public/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY
      },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();
    console.log('Status:', resp.status);
    console.log('Response:', text.substring(0, 1000));
  } catch (e) {
    console.log('Error:', e.message);
  }
}

testSchedule();
