var KULLANICILAR = [
  { k: "admin", s: "panel2024", isim: "Yonetici" },
  { k: "magaza1", s: "12345", isim: "Magaza Sorumlusu" }
];
var magsStr = localStorage.getItem("mags");
var MAGAZALAR = magsStr ? JSON.parse(magsStr) : [
  { id: 1, ad: "Magaza 1", supplierId: "", apiKey: "", apiSecret: "" },
  { id: 2, ad: "Magaza 2", supplierId: "", apiKey: "", apiSecret: "" }
];
var ayStr = localStorage.getItem("ayarlar");
var AYARLAR = ayStr ? JSON.parse(ayStr) : { platform: 2.99, kdv: 20, minMarj: 10, desiF: 3.50 };
var malStr = localStorage.getItem("maliyetler");
var MALIYETLER = malStr ? JSON.parse(malStr) : {};
var aktifMag = MAGAZALAR[0];
var aktifGun = 7;
var karCh = null, urunCh = null, simCh = null;
var tumSip = [];
var _barkodlar = [];
var _ms = 0;

function fmt(n) { return Math.round(parseFloat(n)).toLocaleString("tr-TR"); }

function giris() {
  var kAdi = document.getElementById("lK").value.trim();
  var sifre = document.getElementById("lS").value;
  var bulundu = null;
  for (var i = 0; i < KULLANICILAR.length; i++) {
    if (KULLANICILAR[i].k === kAdi && KULLANICILAR[i].s === sifre) { bulundu = KULLANICILAR[i]; break; }
  }
  if (!bulundu) { document.getElementById("lH").style.display = "block"; return; }
  document.getElementById("lH").style.display = "none";
  document.getElementById("loginEkrani").style.display = "none";
  document.getElementById("panel").style.display = "block";
  document.getElementById("hg").textContent = "Hos geldin, " + bulundu.isim + "!";
  mbarOlustur(); apiFormOlustur(); yukle();
}
document.getElementById("lS").onkeydown = function(e) { if (e.key === "Enter") { giris(); } };

function cikis() {
  document.getElementById("panel").style.display = "none";
  document.getElementById("loginEkrani").style.display = "flex";
  document.getElementById("lK").value = ""; document.getElementById("lS").value = "";
}

function mbarOlustur() {
  var el = document.getElementById("mbar"); el.innerHTML = "";
  for (var i = 0; i < MAGAZALAR.length; i++) {
    (function(m, idx) {
      var b = document.createElement("button");
      b.className = "mtab" + (idx === 0 ? " ak" : ""); b.textContent = m.ad;
      b.onclick = function() {
        document.querySelectorAll(".mtab").forEach(function(x) { x.classList.remove("ak"); });
        b.classList.add("ak"); aktifMag = m; yukle();
      };
      el.appendChild(b);
    })(MAGAZALAR[i], i);
  }
}

function donem(el, g) {
  document.querySelectorAll(".dtab").forEach(function(x) { x.classList.remove("ak"); });
  el.classList.add("ak"); aktifGun = g; yukle();
}

function git(el, s) {
  document.querySelectorAll(".ntab").forEach(function(x) { x.classList.remove("ak"); });
  document.querySelectorAll(".sayfa").forEach(function(x) { x.classList.remove("ak"); });
  el.classList.add("ak"); document.getElementById("s-" + s).classList.add("ak");
  if (s === "ayarlar") { maliyetFormOlustur(); }
}

var DEMO_U = ["Spor Ayakkabi","Laptop Cantasi","Bluetooth Kulaklik","Gunes Gozlugu","Akilli Saat","Sirt Cantasi","Powerbank","Telefon Kilifi","Termos","Kol Saati"];

function demoUret(gun) {
  var liste = []; var bitis = Date.now();
  var sayi = Math.floor(gun * 2.5 + Math.random() * 25);
  for (var i = 0; i < sayi; i++) {
    var urun = DEMO_U[Math.floor(Math.random() * DEMO_U.length)];
    var satis = 100 + Math.random() * 800;
    var mk = MALIYETLER[urun] || {};
    var maliyet = mk.maliyet ? mk.maliyet : (satis * (0.35 + Math.random() * 0.25));
    var desi = mk.desi ? mk.desi : (1 + Math.random() * 4);
    var komisyon = satis * (0.12 + Math.random() * 0.07);
    var kargo = AYARLAR.desiF * desi; var plat = AYARLAR.platform;
    var kd = AYARLAR.kdv / 100;
    var netKdv = (satis - maliyet - komisyon - kargo - plat) * kd;
    var kar = satis - maliyet - komisyon - kargo - plat - netKdv;
    var iade = Math.random() < 0.07;
    var dd = ["Delivered","Delivered","Delivered","InTransit","Cancelled"];
    liste.push({ id: "TY" + Math.floor(1000000 + Math.random() * 9000000), urun: urun, satis: satis, maliyet: maliyet, komisyon: komisyon, kargo: kargo, plat: plat, netKdv: netKdv, kar: kar, iade: iade, iadeMaliyet: iade ? kargo * 2 : 0, marj: satis > 0 ? (kar / satis * 100).toFixed(1) : "0", durum: iade ? "Cancelled" : dd[Math.floor(Math.random() * dd.length)], tarih: new Date(bitis - Math.random() * gun * 86400000) });
  }
  return liste;
}

function gercekVeyaDemo(callback) {
  if (!aktifMag.supplierId || !aktifMag.apiKey || !aktifMag.apiSecret) { callback(demoUret(aktifGun)); return; }
  var bitis = Date.now(); var baslangic = bitis - aktifGun * 86400000;
  fetch("/.netlify/functions/trendyol", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supplierId: aktifMag.supplierId, apiKey: aktifMag.apiKey, apiSecret: aktifMag.apiSecret, endpoint: "orders?startDate=" + baslangic + "&endDate=" + bitis + "&size=200" })
  }).then(function(r) { return r.json(); })
  .then(function(d) {
    var liste = []; var content = d.content || [];
    for (var i = 0; i < content.length; i++) {
      var s = content[i];
      var urun = (s.lines && s.lines[0]) ? s.lines[0].productName : "Urun";
      var barkod = (s.lines && s.lines[0] && s.lines[0].barcode) ? s.lines[0].barcode : urun;
      var satis = s.totalPrice || 0; var komisyon = satis * 0.15;
      var mk = MALIYETLER[barkod] || MALIYETLER[urun] || {};
      var maliyet = mk.maliyet || satis * 0.45; var desi = mk.desi || 2;
      var kargo = AYARLAR.desiF * desi; var plat = AYARLAR.platform; var kd = AYARLAR.kdv / 100;
      var netKdv = (satis - maliyet - komisyon - kargo - plat) * kd;
      var kar = satis - maliyet - komisyon - kargo - plat - netKdv;
      liste.push({ id: s.orderNumber, urun: urun, satis: satis, maliyet: maliyet, komisyon: komisyon, kargo: kargo, plat: plat, netKdv: netKdv, kar: kar, iade: false, iadeMaliyet: 0, marj: satis > 0 ? (kar / satis * 100).toFixed(1) : "0", durum: s.status, tarih: new Date(s.orderDate) });
    }
    callback(liste);
  }).catch(function() { callback(demoUret(aktifGun)); });
}

function yukle() {
  var ld = document.getElementById("ld"); ld.style.display = "flex";
  gercekVeyaDemo(function(sipList) {
    tumSip = sipList;
    document.getElementById("demoNot").style.display = !aktifMag.supplierId ? "block" : "none";
    var teslim = tumSip.filter(function(s) { return s.durum === "Delivered"; });
    var netKar = 0, brutGelir = 0, topKes = 0, iadeTp = 0;
    teslim.forEach(function(s) { netKar += s.kar; brutGelir += s.satis; topKes += s.komisyon + s.kargo + s.plat + s.netKdv; });
    tumSip.forEach(function(s) { iadeTp += s.iadeMaliyet; });
    var zararlar = teslim.filter(function(s) { return parseFloat(s.marj) < AYARLAR.minMarj; });
    var ortKar = teslim.length > 0 ? netKar / teslim.length : 0;
    var marj = brutGelir > 0 ? (netKar / brutGelir * 100).toFixed(1) : "0";
    var iptal = tumSip.filter(function(s) { return s.durum === "Cancelled"; }).length;
    document.getElementById("netKar").textContent = fmt(netKar) + " TL";
    document.getElementById("netKarA").textContent = teslim.length + " teslim";
    document.getElementById("topSip").textContent = tumSip.length;
    document.getElementById("topSipA").textContent = teslim.length + " teslim / " + iptal + " iptal";
    document.getElementById("brut").textContent = fmt(brutGelir) + " TL";
    document.getElementById("topKes").textContent = fmt(topKes) + " TL";
    document.getElementById("karMrj").textContent = "%" + marj;
    document.getElementById("zararSp").textContent = zararlar.length;
    document.getElementById("iadeMl").textContent = fmt(iadeTp) + " TL";
    document.getElementById("ortKar").textContent = fmt(ortKar) + " TL";
    if (zararlar.length > 0) {
      document.getElementById("uyari").style.display = "block";
      document.getElementById("uyariLst").textContent = zararlar.slice(0,3).map(function(s) { return "- " + s.urun + " Kar: " + fmt(s.kar) + " TL (%" + s.marj + ")"; }).join("
");
    }
    karGCiz(teslim); sipTDoldur(tumSip); urunAnlz(teslim); hkHsp(teslim, topKes);
    ld.style.display = "none";
  });
}

function karGCiz(teslim) {
  var gn = {};
  teslim.forEach(function(s) { var g = s.tarih.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }); gn[g] = (gn[g] || 0) + s.kar; });
  var etk = Object.keys(gn).slice(-14);
  var deg = etk.map(function(g) { return Math.round(gn[g]); });
  if (karCh) { karCh.destroy(); }
  karCh = new Chart(document.getElementById("karG").getContext("2d"), { type: "line", data: { labels: etk, datasets: [{ label: "Net Kar", data: deg, borderColor: "#11998e", backgroundColor: "rgba(17,153,142,0.1)", borderWidth: 2.5, pointRadius: 3, tension: 0.4, fill: true }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } } });
}

function sipTDoldur(liste) {
  var html = ""; var maks = Math.min(liste.length, 12);
  for (var i = 0; i < maks; i++) {
    var s = liste[i];
    var dr = s.durum === "Delivered" ? "by" : s.durum === "InTransit" ? "bs" : "bk";
    var dn = s.durum === "Delivered" ? "Teslim" : s.durum === "InTransit" ? "Yolda" : "Iptal";
    var zarar = parseFloat(s.marj) < AYARLAR.minMarj && s.durum === "Delivered";
    html += "<tr class='" + (zarar ? "ztr" : "") + "'><td>" + s.id + "</td><td>" + fmt(s.satis) + " TL</td><td>" + fmt(s.maliyet) + " TL</td><td><strong style='color:" + (s.kar >= 0 ? "#27ae60" : "#e74c3c") + "'>" + fmt(s.kar) + " TL</strong><br><span style='font-size:10px;color:#999'>%" + s.marj + "</span></td><td><span class='bdg " + dr + "'>" + dn + "</span>" + (zarar ? "<span class='bdg bz' style='margin-left:3px'>ZARAR</span>" : "") + "</td></tr>";
  }
  document.getElementById("sipT").innerHTML = html;
}

function urunAnlz(teslim) {
  var oz = {};
  teslim.forEach(function(s) {
    if (!oz[s.urun]) { oz[s.urun] = { adet: 0, satis: 0, maliyet: 0, komisyon: 0, kargo: 0, kar: 0 }; }
    oz[s.urun].adet++; oz[s.urun].satis += s.satis; oz[s.urun].maliyet += s.maliyet;
    oz[s.urun].komisyon += s.komisyon; oz[s.urun].kargo += s.kargo; oz[s.urun].kar += s.kar;
  });
  var srl = Object.entries(oz).sort(function(a, b) { return b[1].kar - a[1].kar; });
  var html = "";
  srl.slice(0,10).forEach(function(item) {
    var ad = item[0]; var v = item[1];
    var m = v.satis > 0 ? (v.kar / v.satis * 100).toFixed(1) : "0";
    var dc = parseFloat(m) >= 15 ? "by" : parseFloat(m) >= 5 ? "bs" : "bk";
    html += "<tr><td>" + (ad.length > 18 ? ad.slice(0,18) + "..." : ad) + "</td><td>" + fmt(v.satis) + " TL</td><td>" + fmt(v.komisyon) + " TL</td><td>" + fmt(v.kargo) + " TL</td><td><strong style='color:" + (v.kar >= 0 ? "#27ae60" : "#e74c3c") + "'>" + fmt(v.kar) + " TL</strong></td><td><span class='bdg " + dc + "'>%" + m + "</span></td></tr>";
  });
  document.getElementById("urunT").innerHTML = html;
  if (urunCh) { urunCh.destroy(); }
  var top6 = srl.slice(0,6);
  urunCh = new Chart(document.getElementById("urunG").getContext("2d"), { type: "bar", data: { labels: top6.map(function(x) { return x[0].length > 13 ? x[0].slice(0,13) + "..." : x[0]; }), datasets: [{ data: top6.map(function(x) { return Math.round(x[1].kar); }), backgroundColor: ["#11998e","#2193b0","#F27A1A","#834d9b","#cb2d3e","#f7971e"], borderRadius: 6 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } } });
}

function sim() {
  var satis = parseFloat(document.getElementById("sS").value) || 0;
  var maliyet = parseFloat(document.getElementById("sM").value) || 0;
  if (satis <= 0 || maliyet <= 0) { return; }
  var komR = parseFloat(document.getElementById("sK").value) || 15;
  var kargo = parseFloat(document.getElementById("sKr").value) || 25;
  var plat = parseFloat(document.getElementById("sP").value) || 2.99;
  var kdvR = parseFloat(document.getElementById("sKdv").value) || 20;
  var indirim = parseFloat(document.getElementById("sI").value) || 0;
  var hedef = parseFloat(document.getElementById("sH").value) || 20;
  var cs = satis * (1 - indirim / 100); var kom = cs * (komR / 100); var kd = kdvR / 100;
  var netKdv = (cs - maliyet - kom - kargo - plat) * kd;
  var kar = cs - maliyet - kom - kargo - plat - netKdv;
  var marj = cs > 0 ? (kar / cs * 100).toFixed(1) : "0";
  var el = document.getElementById("simR"); el.style.display = "block";
  el.className = "sr " + (kar < 0 ? "sk" : parseFloat(marj) >= hedef ? "si" : "so");
  document.getElementById("simB").textContent = kar < 0 ? "ZARAR ETTIRIYOR!" : parseFloat(marj) >= hedef ? "KAMPANYAYA KATILABILIRSIN!" : "HEDEF MARJIN ALTINDA";
  document.getElementById("simV").textContent = "Net Kar: " + fmt(kar) + " TL (%" + marj + ")";
  document.getElementById("simA").textContent = "Kampanya: " + fmt(cs) + " | Kom: " + fmt(kom) + " | Kargo: " + fmt(kargo) + " | Net KDV: " + fmt(netKdv) + " TL";
  if (simCh) { simCh.destroy(); }
  var oranlar = [0,5,10,15,20,25,30];
  var karlar = oranlar.map(function(ind) { var cs2 = satis*(1-ind/100); var k2 = cs2*(komR/100); var n2 = (cs2-maliyet-k2-kargo-plat)*kd; return parseFloat((cs2-maliyet-k2-kargo-plat-n2).toFixed(2)); });
  simCh = new Chart(document.getElementById("simG").getContext("2d"), { type: "bar", data: { labels: ["0%","5%","10%","15%","20%","25%","30%"], datasets: [{ data: karlar, backgroundColor: karlar.map(function(k) { return k >= 0 ? "#11998e" : "#ef473a"; }), borderRadius: 5 }] }, options: { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } } });
}

function hkHsp(teslim, topKes) {
  var bKom = 0, bKrg = 0;
  teslim.forEach(function(s) { bKom += s.komisyon; bKrg += s.kargo; });
  var bPlt = teslim.length * AYARLAR.platform; var fark = topKes - (bKom + bKrg + bPlt);
  var fc = Math.abs(fark) > 5 ? "hr2" : "hg2";
  document.getElementById("hkIc").innerHTML = "<div class='hsat'><span class='hl2'>Beklenen Komisyon</span><span class='hv'>" + fmt(bKom) + " TL</span></div><div class='hsat'><span class='hl2'>Beklenen Kargo</span><span class='hv'>" + fmt(bKrg) + " TL</span></div><div class='hsat'><span class='hl2'>Platform Bedeli</span><span class='hv'>" + fmt(bPlt) + " TL</span></div><div class='hsat'><span class='hl2'>Gerceklesen Kesinti</span><span class='hv " + fc + "'>" + fmt(topKes) + " TL</span></div><div class='hsat'><span class='hl2'>Fark</span><span class='hv " + fc + "'>" + (fark >= 0 ? "+" : "") + fmt(fark) + " TL</span></div>";
  document.getElementById("hkHt").innerHTML = Math.abs(fark) > 10 ? "<div class='uyari' style='display:block'><div class='ub'>Hatali Kesinti!</div><div class='ul'>" + fmt(Math.abs(fark)) + " TL " + (fark > 0 ? "fazla" : "eksik") + " kesildi.</div></div>" : "<div class='ipu'>Kesintiler normal. Hata yok.</div>";
}

function apiFormOlustur() {
  var html = "";
  MAGAZALAR.forEach(function(m, i) {
    html += "<div style='margin-bottom:14px;padding:12px;background:#f9f9f9;border-radius:11px;'><div style='font-weight:800;font-size:12px;margin-bottom:9px;'>" + m.ad + "</div><input style='width:100%;padding:8px 11px;border:1.5px solid #ddd;border-radius:8px;font-size:12px;margin-bottom:6px;outline:none;' placeholder='Supplier ID' id='sup_" + i + "' value='" + m.supplierId + "'/><input style='width:100%;padding:8px 11px;border:1.5px solid #ddd;border-radius:8px;font-size:12px;margin-bottom:6px;outline:none;' placeholder='API Key' id='key_" + i + "' value='" + m.apiKey + "'/><input type='password' style='width:100%;padding:8px 11px;border:1.5px solid #ddd;border-radius:8px;font-size:12px;outline:none;' placeholder='API Secret' id='sec_" + i + "' value='" + m.apiSecret + "'/></div>";
  });
  document.getElementById("apiF").innerHTML = html;
}

function apiKyt() {
  MAGAZALAR.forEach(function(m, i) {
    var s = document.getElementById("sup_" + i); var k = document.getElementById("key_" + i); var sc = document.getElementById("sec_" + i);
    if (s) { m.supplierId = s.value; } if (k) { m.apiKey = k.value; } if (sc) { m.apiSecret = sc.value; }
  });
  localStorage.setItem("mags", JSON.stringify(MAGAZALAR));
  alert("API bilgileri kaydedildi!"); maliyetFormOlustur(); yukle();
}

function trendyolUrunCek(callback) {
  if (!aktifMag.supplierId || !aktifMag.apiKey || !aktifMag.apiSecret) { callback(null); return; }
  fetch("/.netlify/functions/trendyol", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ supplierId: aktifMag.supplierId, apiKey: aktifMag.apiKey, apiSecret: aktifMag.apiSecret, endpoint: "products?approved=true&size=200&page=0" })
  }).then(function(r) { return r.json(); })
  .then(function(d) { callback(d.content || []); })
  .catch(function() { callback(null); });
}

function maliyetFormOlustur() {
  var kap = document.getElementById("malF");
  kap.innerHTML = "<div class='ipu'>Yukleniyor...</div>";
  trendyolUrunCek(function(urunler) {
    _barkodlar = [];
    if (!urunler) {
      kap.innerHTML = "<div class='ipu'>API baglantisi yok. Once API bilgilerini kaydedin.</div><div id='malSatirlar'></div><button class='btg' onclick='manuelEkle()'>+ Manuel Urun Ekle</button>";
      Object.keys(MALIYETLER).forEach(function(ad) { manuelEkle(ad, MALIYETLER[ad].maliyet, MALIYETLER[ad].desi); });
      return;
    }
    if (urunler.length === 0) { kap.innerHTML = "<div class='ipu'>Onayli urun bulunamadi.</div>"; return; }
    kap.innerHTML = "<div class='ipu'>" + urunler.length + " urun bulundu!</div><div class='mbas'><span style='width:38px'></span><span style='flex:3'>URUN</span><span style='width:66px;text-align:center'>ALIS TL</span><span style='width:60px;text-align:center'>DESI</span></div><div id='malSatirlar'></div>";
    urunler.forEach(function(u) {
      var ad = u.title || u.productName || "Urun";
      var barkod = u.barcode || u.stockCode || ad;
      var kay = MALIYETLER[barkod] || MALIYETLER[ad] || {};
      var resim = (u.images && u.images[0]) ? u.images[0].url : (u.imageUrl || null);
      _barkodlar.push(barkod);
      var div = document.createElement("div"); div.className = "usat";
      var imgH = resim ? "<div class='uiw'><img class='uimg' src='" + resim + "' onerror="this.parentElement.innerHTML='<div class=unoimg>X</div>'"/><img class='ubig' src='" + resim + "'/></div>" : "<div class='unoimg'>X</div>";
      div.innerHTML = imgH + "<input type='hidden' id='mad_" + barkod + "' value='" + ad + "'/><div class='ubil'><div class='uad'>" + (ad.length > 30 ? ad.slice(0,30) + "..." : ad) + "</div><div class='ubk'>" + barkod + "</div></div><input type='number' class='uinp' id='mmal_" + barkod + "' placeholder='TL' style='width:66px' value='" + (kay.maliyet || "") + "'/><input type='number' class='uinp' id='mdes_" + barkod + "' placeholder='desi' style='width:60px' value='" + (kay.desi || "") + "'/>";
      document.getElementById("malSatirlar").appendChild(div);
    });
    document.querySelectorAll(".uiw").forEach(function(w) {
      w.addEventListener("mousemove", function(e) { var b = w.querySelector(".ubig"); if (!b) { return; } b.style.left = Math.min(e.clientX+14, window.innerWidth-180) + "px"; b.style.top = Math.max(e.clientY-90, 10) + "px"; });
    });
  });
}

function manuelEkle(ad, mal, desi) {
  ad = ad || ""; mal = mal || ""; desi = desi || "";
  var id = "m" + (_ms++); var div = document.createElement("div");
  div.style.cssText = "display:flex;gap:6px;margin-bottom:7px;align-items:center;";
  div.innerHTML = "<input style='flex:3;padding:8px 10px;border:1.5px solid #ddd;border-radius:8px;font-size:12px;outline:none;' placeholder='Urun adi' id='mad_" + id + "' value='" + ad + "'/><input type='number' style='width:66px;padding:8px 5px;border:1.5px solid #ddd;border-radius:8px;font-size:12px;text-align:center;outline:none;' placeholder='TL' id='mmal_" + id + "' value='" + mal + "'/><input type='number' style='width:60px;padding:8px 5px;border:1.5px solid #ddd;border-radius:8px;font-size:12px;text-align:center;outline:none;' placeholder='desi' id='mdes_" + id + "' value='" + desi + "'/><button onclick='this.parentElement.remove()' style='background:#fee;border:none;border-radius:7px;padding:8px;cursor:pointer;color:#e74c3c;font-size:14px;'>X</button>";
  document.getElementById("malSatirlar").appendChild(div);
}

function malKyt() {
  MALIYETLER = {};
  _barkodlar.forEach(function(b) {
    var malEl = document.getElementById("mmal_" + b); var desEl = document.getElementById("mdes_" + b); var adEl = document.getElementById("mad_" + b);
    if (malEl) { var mal = parseFloat(malEl.value); var des = parseFloat(desEl ? desEl.value : "2"); var ad = adEl ? adEl.value : b; if (!isNaN(mal) && mal > 0) { MALIYETLER[b] = { maliyet: mal, desi: isNaN(des) ? 2 : des, ad: ad }; } }
  });
  localStorage.setItem("maliyetler", JSON.stringify(MALIYETLER));
  alert(Object.keys(MALIYETLER).length + " urunun maliyeti kaydedildi!"); yukle();
}

function ayrKyt() {
  var p = parseFloat(document.getElementById("aP").value); var k = parseFloat(document.getElementById("aKdv").value);
  var m = parseFloat(document.getElementById("aMin").value); var d = parseFloat(document.getElementById("aDesi").value);
  AYARLAR = { platform: isNaN(p)?2.99:p, kdv: isNaN(k)?20:k, minMarj: isNaN(m)?10:m, desiF: isNaN(d)?3.50:d };
  localStorage.setItem("ayarlar", JSON.stringify(AYARLAR)); alert("Ayarlar kaydedildi!"); yukle();
}