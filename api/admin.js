// ============================================================================
// /api/admin  —  ListEdge owner control plane  (Vercel serverless function)
//
// Holds the Supabase SERVICE-ROLE key and performs every privileged action.
// The caller MUST be an authenticated 'owner'; this is verified on every call.
// NEVER expose the service-role key in any client-side file.
//
// Vercel → Project → Settings → Environment Variables:
//   SUPABASE_URL               = https://YOUR-PROJECT.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  = (Supabase → Settings → API → service_role secret)
// ============================================================================

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  var BASE = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  var KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!BASE || !KEY) { res.status(500).json({ error: 'Server is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' }); return; }

  function svc(path, method, body) {
    return fetch(BASE + path, {
      method: method || 'GET',
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: body ? JSON.stringify(body) : undefined
    });
  }
  function ok(data){ res.status(200).json({ ok: true, data: data || null }); }
  function bad(code, msg){ res.status(code).json({ error: msg }); }

  // ---- 1) the caller must be a signed-in owner -------------------------------
  var auth = req.headers.authorization || req.headers.Authorization || '';
  var token = auth.indexOf('Bearer ') === 0 ? auth.slice(7) : '';
  if (!token) { return bad(401, 'Not signed in.'); }

  var caller;
  try {
    var ur = await fetch(BASE + '/auth/v1/user', { headers: { apikey: KEY, Authorization: 'Bearer ' + token } });
    if (!ur.ok) { return bad(401, 'Your session has expired — please sign in again.'); }
    caller = await ur.json();
  } catch (e) { return bad(401, 'Could not verify your session.'); }

  try {
    var pr = await svc('/rest/v1/profiles?select=role&id=eq.' + encodeURIComponent(caller.id), 'GET');
    var who = await pr.json();
    if (!Array.isArray(who) || !who[0] || who[0].role !== 'owner') { return bad(403, 'Owner access only.'); }
  } catch (e) { return bad(403, 'Owner access only.'); }

  // ---- 2) parse the requested action ----------------------------------------
  var b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  var action = b.action;

  try {
    if (action === 'create-office') {
      if (!b.name || !String(b.name).trim()) return bad(400, 'Office name is required.');
      var r = await svc('/rest/v1/agencies', 'POST', { name: String(b.name).trim(), active: b.active !== false });
      var d = await r.json();
      if (!r.ok) return bad(400, (d && d.message) || 'Could not create office.');
      return ok(Array.isArray(d) ? d[0] : d);
    }

    if (action === 'set-office-active') {
      if (!b.officeId) return bad(400, 'Missing office.');
      var r2 = await svc('/rest/v1/agencies?id=eq.' + encodeURIComponent(b.officeId), 'PATCH', { active: !!b.active });
      if (!r2.ok) { var e2 = await r2.json(); return bad(400, (e2 && e2.message) || 'Could not update office.'); }
      return ok();
    }

    if (action === 'create-user') {
      var email = (b.email || '').trim();
      var role  = (b.role === 'manager') ? 'manager' : 'agent';
      if (!email) return bad(400, 'Email is required.');
      if (!b.agency_id) return bad(400, 'Choose which office this user belongs to.');
      if (!b.password || String(b.password).length < 8) return bad(400, 'Set a temporary password of at least 8 characters.');

      var cr = await svc('/auth/v1/admin/users', 'POST', {
        email: email, password: String(b.password), email_confirm: true,
        user_metadata: { full_name: (b.full_name || '').trim() }
      });
      var cu = await cr.json();
      if (!cr.ok) { return bad(400, (cu && (cu.msg || cu.message || cu.error_description)) || 'Could not create this login — the email may already be in use.'); }
      var uid = cu.id || (cu.user && cu.user.id);
      if (!uid) return bad(500, 'The login was created but no id came back.');

      var pr2 = await svc('/rest/v1/profiles', 'POST', {
        id: uid, email: email, full_name: (b.full_name || '').trim(),
        agency_id: b.agency_id, role: role, active: true
      });
      if (!pr2.ok) { var pe = await pr2.json(); return bad(400, (pe && pe.message) || 'The login was created, but saving the profile failed.'); }
      var pd = await pr2.json();
      return ok(Array.isArray(pd) ? pd[0] : pd);
    }

    if (action === 'set-user-active') {
      if (!b.userId) return bad(400, 'Missing user.');
      var r3 = await svc('/rest/v1/profiles?id=eq.' + encodeURIComponent(b.userId), 'PATCH', { active: !!b.active });
      if (!r3.ok) { var e3 = await r3.json(); return bad(400, (e3 && e3.message) || 'Could not update user.'); }
      return ok();
    }

    if (action === 'set-user-role') {
      if (!b.userId) return bad(400, 'Missing user.');
      var role2 = (b.role === 'manager') ? 'manager' : 'agent';
      var r4 = await svc('/rest/v1/profiles?id=eq.' + encodeURIComponent(b.userId), 'PATCH', { role: role2 });
      if (!r4.ok) { var e4 = await r4.json(); return bad(400, (e4 && e4.message) || 'Could not update role.'); }
      return ok();
    }

    if (action === 'delete-user') {
      if (!b.userId) return bad(400, 'Missing user.');
      var r5 = await svc('/auth/v1/admin/users/' + encodeURIComponent(b.userId), 'DELETE');
      if (!r5.ok && r5.status !== 204) { return bad(400, 'Could not remove this user.'); }
      return ok();
    }

    if (action === 'delete-office') {
      if (!b.officeId) return bad(400, 'Missing office.');
      // remove every user in the office first (their logins; profiles cascade),
      // then delete the office itself
      var lr = await svc('/rest/v1/profiles?select=id&agency_id=eq.' + encodeURIComponent(b.officeId), 'GET');
      var list = await lr.json();
      if (Array.isArray(list)) {
        for (var i = 0; i < list.length; i++) {
          try { await svc('/auth/v1/admin/users/' + encodeURIComponent(list[i].id), 'DELETE'); } catch (e) {}
        }
      }
      var dr = await svc('/rest/v1/agencies?id=eq.' + encodeURIComponent(b.officeId), 'DELETE');
      if (!dr.ok && dr.status !== 204) { var de = await dr.json(); return bad(400, (de && de.message) || 'Could not delete office.'); }
      return ok();
    }

    return bad(400, 'Unknown action.');
  } catch (e) {
    return bad(500, 'Something went wrong performing that action.');
  }
};
