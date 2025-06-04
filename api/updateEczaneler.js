import axios from "axios";
import cheerio from "cheerio";

export default async function handler(req, res) {
  const today = new Date().toISOString().split("T")[0];

  const exampleData = {
    date: today,
    city: "İstanbul",
    district: "Kadıköy",
    pharmacies: [
      {
        name: "Sena Eczanesi",
        phone: "0216 123 45 67",
        address: "Bahariye Cad. No:12 Kadıköy / İstanbul",
        google_maps_url: "https://maps.google.com/?q=Sena+Eczanesi+Kadıköy",
        yandex_maps_url: "https://yandex.com.tr/..."
      }
    ]
  };

  res.setHeader("Content-Type", "application/json");
  res.status(200).json(exampleData);
}
