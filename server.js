require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔑 Clés à mettre dans ton fichier .env
const MERCHANT_KEY = process.env.MERCHANT_KEY || "TMXXXXXXXXXXXXXXXX";
const SITE_ID = process.env.SITE_ID || "831206409";
const API_KEY = process.env.API_KEY || "apiKey66a33e22470a2";

// Fonction utilitaire pour chiffrer les données (équivalent Encryptions.php)
function encryptPayload(merchant_key, api_key, site_id, payload) {
  // Ajouter les infos obligatoires
  payload.merchant_key = merchant_key;
  payload.api_key = api_key;
  payload.site_id = site_id;

  // Générer la clé AES via MD5
  const key = crypto
    .createHash("md5")
    .update(merchant_key + api_key + site_id)
    .digest("hex");

  // Algo AES-256-CBC
  const cipherMethod = "aes-256-cbc";
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    cipherMethod,
    Buffer.from(key, "hex"),
    iv
  );

  // Chiffrer le JSON
  const data = JSON.stringify(payload);
  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Retourner le format attendu par Futurapay (query string)
  return new URLSearchParams({
    data: encrypted,
    iv: iv.toString("base64"),
    key: Buffer.from(api_key).toString("base64"),
  }).toString();
}

// 📌 Endpoint pour générer l’URL de paiement
app.post("/generate-payment", (req, res) => {
  const { amount, currency, firstName, lastName, phone, email, country } =
    req.body;

  const transactionData = {
    currency: currency || "USD",
    amount: amount || 500,
    customer_transaction_id: Math.floor(Math.random() * 100000000),
    country_code: country || "US",
    customer_first_name: firstName || "John",
    customer_last_name: lastName || "Doe",
    customer_phone: phone || "+1234567890",
    customer_email: email || "john.doe@example.com",
  };

  try {
    const encryptedData = encryptPayload(
      MERCHANT_KEY,
      API_KEY,
      SITE_ID,
      transactionData
    );

    // Construire l’URL du widget (stage pour test)
    const paymentUrl = `https://stage-payment-widget.futurapay.com/widget/deposit?${encryptedData}`;

    res.json({ url: paymentUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors du chiffrement" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
