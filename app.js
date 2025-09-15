import express from "express";
import fetch from "node-fetch";
import cors from "cors";


const app = express();
app.use(express.json());

app.use(cors({ origin: "https://timex-us-test.myshopify.com" }));

const PORT = process.env.PORT || 3000;

// ✅ Reusable function to send BIS event to Klaviyo
async function sendBisEvent(email, productId, variantId, title) {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY; // must be set in your env

    const payload = {
    data: {
      type: "event",
      attributes: {
        metric: {
          data: {
            type: "metric",
            attributes: {
              name: "Back In Stock Request"
            }
          }
        },
        properties: {
          product_id: productId,
          variant_id: variantId,
          title: title
        },
        profile: {
          data: {
            type: "profile",
            attributes: {
              email: email
            }
          }
        },
        time: new Date().toISOString()
      }
    }
  };

 const res = await fetch("https://a.klaviyo.com/api/events/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      Revision: "2023-07-15",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text(); // read raw
  console.log("📡 Klaviyo response:", res.status, res.statusText, responseText);

  if (!res.ok) {
    throw new Error(`Klaviyo error: ${res.status} ${responseText}`);
  }

  // Parse only if JSON returned
  return responseText ? JSON.parse(responseText) : { success: true };
}

// ✅ API endpoint for frontend
app.post("/api/bis-request", async (req, res) => {
  try {
    const { email, productId, variantId, title } = req.body;

    if (!email || !productId || !variantId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await sendBisEvent(email, productId, variantId, title);
    res.json({ success: true, result });
  } catch (err) {
    console.error("❌ BIS request failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
