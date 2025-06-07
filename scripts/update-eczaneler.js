import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import 'dotenv/config';


const API_KEY = process.env.COLLECTAPI_KEY;
const ilList = JSON.parse(fs.readFileSync(new URL('../data/il.json', import.meta.url)));
const ilceList = JSON.parse(fs.readFileSync(new URL('../data/ilce.json', import.meta.url)));


if (!API_KEY) {
  console.error('❌ HATA: COLLECTAPI_KEY .env dosyasında tanımlı değil.');
  process.exit(1);
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// İlk harf büyük, kalanlar küçük hale getir (Türkçe karakterlerle uyumlu)
function capitalizeTurkish(str) {
  if (!str || typeof str !== 'string') {
    console.warn('⚠️ Geçersiz ifade:', str);
    return '';
  }
  return str.charAt(0).toLocaleUpperCase('tr-TR') + str.slice(1).toLocaleLowerCase('tr-TR');
}

const fetchPharmacies = async () => {
  const allData = {};

  for (const il of ilList) {
    const ilceListForCity = ilceList.filter(ilce => ilce.il_id === il.il_kodu);
    allData[il.il.toLowerCase()] = {};

    if (ilceListForCity.length === 0) {
      console.warn(`⚠️ ${il.il} için ilçe verisi bulunamadı.`);
      continue;
    }

    for (const ilce of ilceListForCity) {
      if (!ilce.name) {
        console.warn(`⚠️ ${il.il} ilinde geçersiz ilçe nesnesi:`, ilce);
        continue;
      }

      const ilAd = capitalizeTurkish(il.il);
      const ilceAd = capitalizeTurkish(ilce.name);

      const url = `https://api.collectapi.com/health/dutyPharmacy?ilce=${encodeURIComponent(ilceAd)}&il=${encodeURIComponent(ilAd)}`;
      console.info(url);
      try {
        const res = await fetch(url, {
          headers: {
            "content-type": "application/json",
            "authorization": API_KEY,
          }
        });

        const json = await res.json();
        allData[il.il.toLowerCase()][ilce.name.toLowerCase()] = json.result || [];
        console.log(`✅ ${ilAd} / ${ilceAd}`);
      } catch (err) {
        console.error(`❌ ${ilAd} / ${ilceAd}:`, err.message);
      }

      await delay(800);
    }
  }

  const outputPath = path.resolve('public/data/pharmacies.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
  console.log(`📁 Veriler kaydedildi: ${outputPath}`);
};


fetchPharmacies();
