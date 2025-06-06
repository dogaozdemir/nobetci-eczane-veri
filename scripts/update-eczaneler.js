import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import 'dotenv/config';
import ilList from '../data/il.json' assert { type: 'json' };
import ilceList from '../data/ilce.json' assert { type: 'json' };

const API_KEY = process.env.COLLECTAPI_KEY;

if (!API_KEY) {
  console.error('❌ HATA: COLLECTAPI_KEY .env dosyasında tanımlı değil.');
  process.exit(1);
}

const delay = ms => new Promise(res => setTimeout(res, ms));

// İlk harf büyük, kalanlar küçük hale getir (Türkçe karakterlerle uyumlu)
function capitalizeTurkish(str) {
  return str.charAt(0).toLocaleUpperCase('tr-TR') + str.slice(1).toLocaleLowerCase('tr-TR');
}

const fetchPharmacies = async () => {
  const allData = {};

  for (const il of ilList) {
    const ilceListForCity = ilceList.filter(ilce => ilce.il_id === il.il_id);
    allData[il.il_adi.toLowerCase()] = {};

    for (const ilce of ilceListForCity) {
      const ilAd = capitalizeTurkish(il.il_adi);
      const ilceAd = capitalizeTurkish(ilce.ilce_adi);

      const url = `https://api.collectapi.com/health/dutyPharmacy?ilce=${encodeURIComponent(ilceAd)}&il=${encodeURIComponent(ilAd)}`;

      try {
        const res = await fetch(url, {
          headers: {
            "content-type": "application/json",
            "authorization": API_KEY,
          }
        });

        const json = await res.json();
        allData[il.il_adi.toLowerCase()][ilce.ilce_adi.toLowerCase()] = json.result || [];
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
