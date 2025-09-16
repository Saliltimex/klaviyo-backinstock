import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["https://timex-us-test.myshopify.com"],
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = process.env.PORT || 3000;

// ✅ Function to send BIS event to Klaviyo
async function sendBisEvent(payload) {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY;
  if (!apiKey) throw new Error("Missing KLAVIYO_PRIVATE_API_KEY in env");

  const klaviyoPayload = {
    data: {
      type: "event",
      attributes: {
        metric: {
          data: {
            type: "metric",
            attributes: {
              name: "Back In Stock Request",
            },
          },
        },
        properties: {
          Categories: payload.Categories || [],
          Price: payload.Price || 0,
          Channels: payload.Channels || ["EMAIL"],
          ProductName: payload.ProductName,
          ProductID: payload.ProductID,
          VariantName: payload.VariantName,
          VariantId: payload.VariantId,
          SKU: payload.SKU,
          platform: payload.platform || "Shopify",
        },
        profile: {
          data: {
            type: "profile",
            attributes: {
              email: payload.email,
            },
          },
        },
        time: new Date().toISOString(),
      },
    },
  };

  const res = await fetch("https://a.klaviyo.com/api/events/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      Revision: "2023-07-15",
    },
    body: JSON.stringify(klaviyoPayload),
  });

  const responseText = await res.text();
  console.log("📡 Klaviyo response:", res.status, res.statusText, responseText);

  if (!res.ok) {
    throw new Error(`Klaviyo error: ${res.status} ${responseText}`);
  }

  return responseText ? JSON.parse(responseText) : { success: true };
}

// ✅ API endpoint for frontend
app.post("/api/bis-request", async (req, res) => {
  try {
    const {
      email,
      Categories,
      Price,
      Channels,
      ProductName,
      ProductID,
      VariantName,
      VariantId,
      SKU,
      platform,
    } = req.body;

    if (!email || !ProductID || !VariantId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await sendBisEvent({
      email,
      Categories,
      Price,
      Channels,
      ProductName,
      ProductID,
      VariantName,
      VariantId,
      SKU,
      platform,
    });

    res.json({ success: true, result });
  } catch (err) {
    console.error("❌ BIS request failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
