// ============================================================================
// /api/nova  —  NOVA V2 reasoning endpoint (Vercel serverless function)
//
// The browser sends a small, PII-free "facts" object; this function asks OpenAI
// to write the briefing and returns JSON that matches NOVA's briefing contract.
//
// THE OPENAI KEY LIVES ONLY HERE (as an environment variable) — never in the
// browser. Set it in Vercel: Project -> Settings -> Environment Variables:
//     OPENAI_API_KEY = sk-...           (required)
//     OPENAI_MODEL   = gpt-4o-mini      (optional; any chat model you can access)
//
// If anything goes wrong here, the app falls back to its built-in rule engine,
// so the dashboard always shows a briefing.
// ============================================================================

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  var key = process.env.OPENAI_API_KEY;
  if (!key) { res.status(500).json({ error: 'OPENAI_API_KEY is not set' }); return; }

  try {
    var body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (e) { body = {}; } }
    var facts = (body && body.facts) || {};
    var model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    var system = [
      "You are NOVA, the founder's AI chief-of-staff inside a real-estate CRM called Founder HQ.",
      "Personality: calm, concise, intelligent, observant, professional. Never dramatic, never alarmist, never verbose.",
      "You INTERPRET the data — you do not just report numbers. Always give context and a clear recommendation.",
      "Example of bad output: 'Three follow ups overdue.' Example of good output: 'Three follow-ups need attention. Bayleys Rolleston is most urgent — it is closest to the EOI stage.'",
      "",
      "You will receive a JSON object of facts for one founder (their offices and activity). Use ONLY those facts. Do not invent names, numbers, or events.",
      "",
      "Return ONLY a JSON object (no markdown, no commentary) with EXACTLY this shape:",
      "{",
      '  "greeting": string,                       // e.g. "Good morning, Harsh." Use facts.time_of_day and facts.founder_name (omit the name if empty).',
      '  "status":   { "tone": "good"|"attention"|"mixed"|"new"|"setup", "line": string },  // one sentence summarising the state of the business',
      '  "actions":  [ { "label": string, "detail": string, "goto": "offices"|"meetings"|"followups"|"eois"|"founding" } ],  // ranked, MOST IMPORTANT FIRST, max 5',
      '  "risks":         [ string ],              // max 4, each one short sentence',
      '  "opportunities": [ string ]               // max 4, each one short sentence',
      "}",
      "",
      "Guidance:",
      "- Rank actions by urgency/impact. An EOI awaiting a response or a meeting to confirm outranks a quiet office.",
      "- Each action 'label' is an imperative tied to a named office (e.g. 'Confirm Harcourts Halswell meeting'); 'detail' is one short interpretive sentence (e.g. 'Scheduled for Thursday at 2:30 PM.').",
      "- 'goto' routes the founder to the right screen: eois, meetings, followups, offices, or founding.",
      "- Risks: overdue follow-ups, offices with no contact for 14+ days, EOIs waiting too long, stalled momentum.",
      "- Opportunities: offices close to the EOI stage, EOIs under review, strong recent engagement.",
      "- tone: 'good' if little or nothing needs attention; 'attention' if several items are pressing; otherwise 'mixed'. Use 'new' if there are no offices.",
      "- Keep the whole briefing tight. Quality over quantity."
    ].join('\n');

    var r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: "Today's facts:\n" + JSON.stringify(facts) }
        ]
      })
    });

    if (!r.ok) {
      var errText = await r.text();
      res.status(502).json({ error: 'openai_' + r.status, detail: String(errText).slice(0, 500) });
      return;
    }

    var data = await r.json();
    var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) { res.status(502).json({ error: 'empty_completion' }); return; }

    var briefing;
    try { briefing = JSON.parse(content); }
    catch (e) { res.status(502).json({ error: 'model_returned_non_json' }); return; }

    // Cache for a minute at the edge; the briefing only changes as data changes.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json(briefing);

  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
