const API_KEY = 'pos_80nVwWb8TIdMFTDV3Q8Z0Wpzu61bGiUy8iADDCMB';
const API_URL = 'https://api.postiz.com';

async function test() {
  console.log('Testing Postiz API...\n');
  
  // Test 1: List integrations
  try {
    const resp = await fetch(`${API_URL}/public/v1/integrations`, {
      headers: { 'Authorization': API_KEY }
    });
    console.log('Integrations endpoint:', resp.status);
    if (resp.ok) {
      const data = await resp.json();
      console.log('Integrations:', JSON.stringify(data, null, 2).substring(0, 500));
    } else {
      console.log('Error:', await resp.text());
    }
  } catch (e) {
    console.log('Integrations error:', e.message);
  }

  // Test 2: List all integrations to find X
  try {
    const resp = await fetch(`${API_URL}/public/v1/integrations`, {
      headers: { 'Authorization': API_KEY }
    });
    console.log('\nAll integrations:', resp.status);
    if (resp.ok) {
      const data = await resp.json();
      console.log('Full list:', JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log('Integrations error:', e.message);
  }
}

test();
