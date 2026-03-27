exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  }
  try {
    var params = JSON.parse(event.body || "{}");
    var supplierId = params.supplierId;
    var apiKey = params.apiKey;
    var apiSecret = params.apiSecret;
    var endpoint = params.endpoint;
    if (!supplierId || !apiKey || !apiSecret || !endpoint) {
      return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Eksik parametre" }) };
    }
    var cred = Buffer.from(apiKey + ":" + apiSecret).toString("base64");
    var url = "https://api.trendyol.com/sapigw/suppliers/" + supplierId + "/" + endpoint;
    var response = await fetch(url, {
      headers: { "Authorization": "Basic " + cred, "User-Agent": supplierId + " - SelfIntegration", "Content-Type": "application/json" }
    });
    var data = await response.json();
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" }, body: JSON.stringify(data) };
  } catch(err) {
    return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: err.message }) };
  }
};