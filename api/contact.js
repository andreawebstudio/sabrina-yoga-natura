// Vercel Serverless Function — riceve il modulo contatti e lo inoltra via email con Resend.
//
// Variabili d'ambiente da impostare su Vercel (Project → Settings → Environment Variables):
//   RESEND_API_KEY      chiave API di https://resend.com
//   CONTACT_TO_EMAIL    indirizzo che riceve i messaggi (es. l'email di Sabrina)
//   CONTACT_FROM_EMAIL  mittente verificato su Resend (facoltativo; default: onboarding@resend.dev)
//
// Finché le variabili non sono impostate la funzione risponde 503 e il sito mostra
// un messaggio di errore onesto (nessuna finta conferma di invio).

const MAX = { name: 80, email: 120, activity: 80, message: 2000 };

function clean(value, max) {
  return String(value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method-not-allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot anti-spam: se compilato, fingiamo successo senza inviare nulla.
  if (body.website) return res.status(200).json({ ok: true });

  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  const activity = clean(body.activity, MAX.activity);
  const message = String(body.message ?? "").trim().slice(0, MAX.message);
  const privacy = body.privacy === true || body.privacy === "on" || body.privacy === "true";

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  if (!name || !emailOk || !activity || !message || !privacy) {
    return res.status(400).json({ ok: false, error: "invalid-input" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "Sabrina Yoga Natura <onboarding@resend.dev>";
  if (!apiKey || !to) {
    return res.status(503).json({ ok: false, error: "not-configured" });
  }

  const html = `
    <h2>Nuova richiesta dal sito</h2>
    <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Attività di interesse:</strong> ${escapeHtml(activity)}</p>
    <p><strong>Messaggio:</strong><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
    <p style="color:#777;font-size:12px">Presa visione dell'informativa privacy: sì</p>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Richiesta dal sito — ${activity}`,
        html
      })
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: "send-failed" });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false, error: "send-failed" });
  }
};
