const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

async function createFirestoreDatabase() {
  const keyFile = path.join(__dirname, 'firebase-service-account.json');
  
  const auth = new GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  
  const projectId = 'kindred-x5pbk';
  
  // Try to create the database
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `projects/${projectId}/databases/(default)`,
      locationId: 'nam5',
      type: 'FIRESTORE_NATIVE',
      concurrencyMode: 'OPTIMISTIC'
    })
  });
  
  const data = await response.json();
  console.log('Response status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
}

createFirestoreDatabase().catch(console.error);
