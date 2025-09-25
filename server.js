require('dotenv').config();
const express = require('express');
const Futurapay = require('futurapay/futurapay');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const merchantKey = process.env.MERCHANT_KEY;
const siteId = process.env.SITE_ID;
const apiKey = process.env.API_KEY;

const paymentGateway = new Futurapay(merchantKey, apiKey, siteId);
paymentGateway.setEnv(process.env.ENVIRONMENT || "live");
paymentGateway.setType("withdraw");

app.post('/generate-payment-url', (req, res) => {
    const { phone, amount, firstName, lastName, email } = req.body;

    const transactionData = {
        currency: "XAF",
        amount: amount,
        customer_transaction_id: Math.floor(Math.random() * 90000000),
        country_code: "CM",
        customer_first_name: firstName,
        customer_last_name: lastName,
        customer_phone: phone,
        customer_email: email
    };

    try {
        const securedUrl = paymentGateway.initiatePayment(transactionData);
        res.json({ url: securedUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Impossible de générer l'URL de paiement" });
    }
});

app.listen(port, () => {
    console.log(`Serveur Futurapay en cours sur port ${port}`);
});
