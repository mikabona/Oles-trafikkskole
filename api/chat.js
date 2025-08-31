// api/chat.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  try {
    const { messages } = req.body || [];

    // ===== ФИРМЕННЫЙ ПРОМПТ =====
    const system = `
Du er en kortfattet, vennlig kundestøtte-agent for Oles Trafikkskole i Ålesund.
Mål: gi forhåndsinformasjon og hjelpe den besøkende med neste steg (kurs, priser, språk, teori, oppkjøring, kontakt).
Skriv på brukerens språk (NB: norsk bokmål, engelsk eller russisk). Hvis bruker blander språk — svar på samme språk som siste melding.

Regler:
- Ikke be om sensitive personopplysninger.
- Ikke finn på fakta. Hvis du er usikker: si det og foreslå å kontakte skolen.
- Pris- og tidsinfo: forklar typisk nivå/struktur og legg til “for nøyaktige priser/plan → kontakt oss”.
- Tilby konkrete neste steg: “booke introduksjonstime”, “melde seg på teorikurs”, “skrive til oss på e-post/telefon”.

Profil:
- By: Ålesund. Teori i klasserom, kjøretimer i byen, oppkjøring etter avtale.
- Språk: norsk/engelsk (kan svare også på russisk).
- Tone: hjelpsom, presis, vennlig, 3–6 korte setninger per svar.
`;

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
