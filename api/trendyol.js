export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method not allowed' }); }
  try {
    const { supplierId, apiKey, apiSecret, endpoint } = req.body;
    if (!supplierId || !apiKey || !apiSecret || !endpoint) {
      return res.status(400).json({ error: 'Eksik parametre' });
    }
    const cred = Buffer.from(apiKey + ':' + apiSecret).toString('base64');
    const url = 'https://api.trendyol.com/sapigw/suppliers/' + supplierId + '/' + endpoint;
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + cred,
        'User-Agent': supplierId + ' - SelfIntegration',
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}