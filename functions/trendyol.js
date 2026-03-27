export async function onRequestPost(context) {
  try {
    const params = await context.request.json();
    const { supplierId, apiKey, apiSecret, endpoint } = params;
    if (!supplierId || !apiKey || !apiSecret || !endpoint) {
      return new Response(JSON.stringify({ error: 'Eksik parametre' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }
    const cred = btoa(apiKey + ':' + apiSecret);
    const url = 'https://api.trendyol.com/sapigw/suppliers/' + supplierId + '/' + endpoint;
    const response = await fetch(url, {
      headers: { 'Authorization': 'Basic ' + cred, 'User-Agent': supplierId + ' - SelfIntegration', 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}