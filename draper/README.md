# 36 Draper Street — Development Microsite

A four-page microsite for the Draper Street development, presented by Klyne Real Estate.
Pure HTML/CSS/JS — no build step. Upload to GitHub, import to Vercel, done.

---

## 1 · Put it live (about 5 minutes)

1. Go to **github.com** → **New repository** → name it `draper-street` → Create.
2. On the empty repo page, click **uploading an existing file**.
3. Drag in **everything inside this folder** (keep the `css`, `js`, `images` folders intact) → **Commit changes**.
4. Go to **vercel.com** → **Add New → Project** → import `draper-street` → **Deploy**. No settings needed.
5. Vercel gives you a live URL immediately (e.g. `draper-street.vercel.app`).
   To use a custom domain like `draperstreet.co.nz`: Vercel → Project → **Settings → Domains** → add it and follow the DNS prompt.

---

## 2 · Images

**Already included:** `hero-render.jpg` (the interactive street render on the home page), `exterior-1.jpg`, `exterior-3.jpg`, `og-image.jpg` for link previews, and all ten floor plan images (`plan-unit-1-ground.jpg` / `-first.jpg` through `plan-unit-5-*.jpg`) — pulled directly from Citadel's sales brochure and cropped to just the drawings.

Still to add — files go in the `images` folder with **these exact names**:

| File | Used on | Ideal size |
|---|---|---|
| `exterior-2.jpg` | Gallery | 1600×1200 |
| `interior-1.jpg` … `interior-3.jpg` | Gallery | 1600×1200 |
| `progress-1.jpg` … `progress-3.jpg` | Gallery (On site) | 1600×1200 |
| `location.jpg` | Home location section | 1600×1200 |

Missing images show a styled placeholder, never a broken icon. To add images later: GitHub → your repo → `images` folder → **Add file → Upload files**. Vercel redeploys automatically on every commit.

Fortnightly progress photos: just replace `progress-1.jpg` with the newest shot each fortnight — the "On site — latest" slot is the first one.

---

## 3 · Connect the enquiry form (email + dashboard)

The form uses **Formspree** — every enquiry emails you *and* is stored in a dashboard you can review any time.

1. Go to **formspree.io** → sign up free (50 enquiries/month on the free tier).
2. **New form** → name it "Draper Street" → set the email to the address you want enquiries sent to.
3. Copy the form's ID — it looks like `mwkgqjpz` in `https://formspree.io/f/mwkgqjpz`.
4. In GitHub, open `contact.html` → click the pencil (Edit) → find `YOUR_FORM_ID` → replace it with your ID → **Commit changes**.

Until that's done, the form politely tells buyers to call or email instead — nothing breaks.

Enquiries include name, email, phone, which unit, and the message. The "Enquire about Unit 2" buttons on the floor-plans page pre-select that unit in the form.

---

## 4 · Things you might want to change later

- **Prices / availability** — `index.html` (the schedule) and `floor-plans.html` (each unit panel). When a unit goes under offer, change its `tag avail` span to `tag uo` and the text to "Under offer".
- **Floor plans** — sourced from Citadel's sales brochure and cropped to just the drawings, so they carry the actual dimensions and room labels. To replace one, upload a new image over `plan-unit-N-ground.jpg` or `-first.jpg` with the same filename — no HTML changes needed.
- **The interactive hero** — the home page rotates between the street render and the rear-residence render (arrows, or drag the image sideways). Every home is a live hotspot in both views. Unit pricing/status shown on hover lives at the top of `js/hero.js` in the `UNITS` list; the hotspot outlines are the `polys` coordinates in the `VIEWS` list below it. To check alignment at any time, open the site with `?hotspots=1` on the end of the URL (e.g. `yoursite.vercel.app/?hotspots=1`) — every hotspot shows faintly so you can see exactly where they sit.
- **Email address** — currently `harsh@klyne.nz` in `contact.html` and `js/site.js`. Search and replace if it's different.

---

*Built for Klyne Real Estate · Licensed REAA 2008*
