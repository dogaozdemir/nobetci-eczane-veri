import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import path from "path";

import cities from "../../../data/il.json";
import districts from "../../../data/ilce.json";

export const config = {
  api: {
    bodyParser: false,
  },
};

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default async function handler(req, res) {
  const today = new Date().toISOString().split("T")[0];
  const results = [];

  for (const city of cities) {
    const citySlug = slugify(city.il);
    const cityDistricts = districts.filter(d => d.il_id === city.id);

    // Şehir düzeyi veri çek
    const cityUrl = `https://www.hastanemyanimda.com/nobetci-eczane/${citySlug}`;
    const cityData = await fetchPharmacyData(cityUrl, city.il, null);
    if (cityData.length) results.push(...cityData);

    // İlçe düzeyi veri çek
    for (const district of cityDistricts) {
      const districtSlug = slugify(district.ilce);
      const districtUrl = `https://www.hastanemyanimda.com/nobetci-eczane/${citySlug}/${districtSlug}`;
      const districtData = await fetchPharmacyData(districtUrl, city.il, district.ilce);
      if (districtData.length) results.push(...districtData);
    }
  }

  // JSON dosyasına yaz (sadece localde çalışır)
  try {
    const filePath = path.join(process.cwd(), "public", "data", `eczaneler-${today}.json`);
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), "utf8");
  } catch (err) {
    console.error("Dosya yazma hatası:", err);
  }

  res.status(200).json({ message: "Veri güncellendi", count: results.length });
}

async function fetchPharmacyData(url, city, district) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const pharmacies = [];

    $(".pharmacy-card").each((i, el) => {
      const name = $(el).find(".pharmacy-name").text().trim();
      const phone = $(el).find(".pharmacy-phone").text().trim();
      const address = $(el).find(".pharmacy-address").text().trim();

      const gmap = `https://maps.google.com/?q=${encodeURIComponent(name + " " + (district || city))}`;
      const ymap = `https://yandex.com.tr/harita?q=${encodeURIComponent(name + " " + (district || city))}`;

      pharmacies.push({
        date: new Date().toISOString().split("T")[0],
        city,
        district: district || null,
        name,
        phone,
        address,
        google_maps_url: gmap,
        yandex_maps_url: ymap
      });
    });

    return pharmacies;
  } catch (err) {
    console.error(`Hata: ${url}`, err.message);
    return [];
  }
}
