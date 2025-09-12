import fetch from "node-fetch";

export async function sendBisEvent(email, productId, variantId, title) {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY; // store in env vars

  const payload = {
    data: {
      type: "event",
      attributes: {
        metric: { name: "Back In Stock Request" },
        properties: {
          product_id: productId,
          variant_id: variantId,
          title: title
        },
        profile: {
          email: email
        },
        time: new Date().toISOString()
      }
    }
  };

  const res = await fetch("https://a.klaviyo.com/api/events/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Klaviyo-API-Key ${apiKey}`,
      "Revision": "2023-07-15"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Klaviyo error: ${res.status} ${error}`);
  }

  return await res.json();
}
