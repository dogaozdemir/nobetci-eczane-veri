import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    // JSON dosyalarını oku
    const ilPath = path.join(process.cwd(), "data", "il.json");
    const ilcePath = path.join(process.cwd(), "data", "ilce.json");

    const iller = JSON.parse(fs.readFileSync(ilPath, "utf-8"));
    const ilceler = JSON.parse(fs.readFileSync(ilcePath, "utf-8"));

    // Örnek veri oluştur
    const today = new Date().toISOString().split("T")[0];
    const result = [];

    iller.forEach((il) => {
      const il_adi = il.il;
      const il_kodu = il.il_kodu;

      const ilgiliIlceler = ilceler.filter((i) => i.il_kodu === il_kodu);

      ilgiliIlceler.forEach((ilce) => {
        result.push({
          date: today,
          city: il_adi,
          district: ilce.ilce,
          pharmacies: [
            {
              name: `${ilce.ilce} Eczanesi`,
              phone: "0000 000 00 00",
              address: `${ilce.ilce} / ${il_adi}`,
              google_maps_url: `https://maps.google.com/?q=${ilce.ilce}+Eczanesi+${il_adi}`,
              yandex_maps_url: `https://yandex.com.tr/harita?q=${ilce.ilce}+Eczanesi+${il_adi}`
            }
          ]
        });
      });
    });

    res.setHeader("Content-Type", "application/json");
    res.status(200).json(result);

  } catch (err) {
    console.error("updateEczaneler hata:", err);
    res.status(500).json({ error: "Veri işlenemedi", detay: err.message });
  }
}
