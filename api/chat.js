// api/chat.js — Vercel Serverless Function
export default async function handler(req, res) {
  // CORS: чтобы вызывать с GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body || [];

    const system = `Du er en kortfattet, vennlig forhåndsinfo-agent for Oles Trafikkskole i Ålesund.
Svar på norsk (bokmål). Ikke be om sensitive persondata.`;

    const input = [{ role: "system", content: system }, ...(messages || [])];

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input
      })
    }).then(r => r.json());

    let text = r?.output_text;
    if (!text && Array.isArray(r?.output)) {
      const c = r.output[0]?.content?.[0];
      if (c?.type === "output_text") text = c.text;
    }
    if (!text) text = "Beklager, noe gikk galt. Prøv igjen.";

    res.status(200).json({ reply: text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Chat error" });
  }
}
