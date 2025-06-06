import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// Türkçe karakterleri URL uyumlu hale getirme fonksiyonu
function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, ""); // Noktalama temizliği
}

// Verileri çek
async function scrapeDistrict(citySlug, districtSlug) {
  const url = `https://www.hastanemyanimda.com/nobetci-eczane/${citySlug}/${districtSlug}`;
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle0", timeout: 0 });

  const data = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll(".list-group .list-group-item").forEach(item => {
      const name = item.querySelector("h5")?.innerText.trim();
      const address = item.querySelector("p")?.innerText.trim();
      const phone = item.querySelector("a[href^='tel']")?.innerText.trim();
      list.push({ name, address, phone });
    });
    return list;
  });

  await browser.close();
  return data;
}

async function main() {
  const ilData = JSON.parse(fs.readFileSync("data/il.json", "utf8"));
  const ilceData = JSON.parse(fs.readFileSync("data/ilce.json", "utf8"));
  const allData = {};

  for (const il of ilData) {
    const citySlug = toSlug(il.il_adi);
    const ilceler = ilceData.filter(i => i.il_kodu === il.il_kodu);

    for (const ilce of ilceler) {
      const districtSlug = toSlug(ilce.ilce_adi);
      const key = `${citySlug}/${districtSlug}`;
      console.log(`🟢 Veri çekiliyor: ${key}`);
      try {
        const data = await scrapeDistrict(citySlug, districtSlug);
        allData[key] = data;
      } catch (err) {
        console.error(`❌ Hata oluştu: ${key}`, err);
        allData[key] = [];
      }
    }
  }

  const filePath = path.join("public", "data", "eczaneler.json");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
  console.log("✅ Tüm veriler kaydedildi.");
}

main();
