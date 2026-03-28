export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const body = req.body;
    const supplierId = body.supplierId;
    const apiKey = body.apiKey;
    const apiSecret = body.apiSecret;
    const endpoint = body.endpoint;
    
    if (!supplierId || !apiKey || !apiSecret || !endpoint) {
      return res.status(400).json({ error: 'Eksik parametre: ' + JSON.stringify({ supplierId: !!supplierId, apiKey: !!apiKey, apiSecret: !!apiSecret, endpoint: !!endpoint }) });
    }
    
    const cred = Buffer.from(apiKey + ':' + apiSecret).toString('base64');
    const url = 'https://api.trendyol.com/sapigw/suppliers/' + supplierId + '/' + endpoint;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + cred,
        'User-Agent': supplierId + ' - SelfIntegration',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text.slice(0, 500) }; }
    
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack ? err.stack.slice(0, 300) : '' });
  }
}