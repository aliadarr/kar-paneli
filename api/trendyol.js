export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { supplierId, apiKey, apiSecret, endpoint } = req.body;
    if (!supplierId || !apiKey || !apiSecret || !endpoint) {
      return res.status(400).json({ error: 'Eksik parametre' });
    }
    const cred = Buffer.from(apiKey + ':' + apiSecret).toString('base64');
    const url = 'https://api.trendyol.com/sapigw/suppliers/' + supplierId + '/' + endpoint;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + cred,
        'User-Agent': supplierId + ' - SelfIntegration',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'tr-TR,tr;q=0.9',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    const text = await response.text();
    if (text.includes('Cloudflare') || text.includes('Attention Required')) {
      return res.status(403).json({ 
        error: 'Cloudflare engeli - Trendyol bu sunucudan gelen istekleri engelliyor',
        hint: 'Lutfen Trendyol API key ve secret bilgilerinizin dogru oldugunu kontrol edin',
        status: response.status
      });
    }
    let data;
    try { data = JSON.parse(text); } catch(e) { 
      return res.status(200).json({ raw: text.slice(0, 1000), parseError: e.message });
    }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}