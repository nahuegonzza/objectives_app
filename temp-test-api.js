async function testAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/modules');
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error:', e);
  }
}

testAPI();