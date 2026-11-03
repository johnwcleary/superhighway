# Runbook: move superhighway.fm to Cloudflare

This is the step-by-step for making `superhighway.fm` the live site on
Cloudflare and turning `johnwilliamcleary.com` into a redirect to it. Everything
here is done by hand in the Cloudflare dashboard and at your domain registrar.
Nothing in the repo touches DNS.

Work through the steps in order and tick the boxes as you go. The site keeps
serving from Squarespace until step 5, and email keeps flowing throughout, as
long as the email records in step 2 are right before the nameservers change in
step 3.

## Before you start: what's live today

Captured with `dig` on 2026-11-03. Two things differ from the original plan,
and the steps below account for both:

1. **The two domains use different email providers.** `superhighway.fm` is on
   **Google Workspace**. `johnwilliamcleary.com` is on **Microsoft 365**, the
   GoDaddy-provisioned kind (MX `…mail.protection.outlook.com`, verification
   `NETORGFT11483937.onmicrosoft.com`, SPF `include:secureserver.net`).
2. **Neither domain's DNS is at Squarespace Domains.**

| | superhighway.fm | johnwilliamcleary.com |
|---|---|---|
| Registrar (WHOIS) | Instra Corporation | GoDaddy |
| Nameservers today | GoDaddy (`ns57`/`ns58.domaincontrol.com`) | Squarespace (`connect1`/`connect2.squarespacedns.com`) |
| Email | Google Workspace | Microsoft 365 (via GoDaddy) |
| Website records | Squarespace `A` ×4, `www` → `ext-sq.squarespace.com` | same |
| DNSSEC | off | off |

> **TODO(john):** confirm where you log in to manage `superhighway.fm`. Its DNS
> is on GoDaddy, so it's most likely in your GoDaddy account even though WHOIS
> names Instra. Also confirm whether the Microsoft 365 mailbox on
> `johnwilliamcleary.com` is still in use. The steps below keep it working
> either way.

---

## 1. GitHub repository

- [ ] The repo already exists: <https://github.com/johnwcleary/superhighway>
      (public, `main` is the default branch). It was created fresh for this
      project and has no history from Squarespace. Nothing to do unless you
      want to change its visibility.
- [ ] Make sure the last CI run on `main` is green (repo → **Actions**).

## 2. Add both domains to Cloudflare (Free plan)

Do this for **`superhighway.fm`** first, then **`johnwilliamcleary.com`**.

- [ ] Cloudflare dashboard → **Add a domain** → enter the domain → choose
      **Quick scan for DNS records** → **Free** plan.
- [ ] On the review screen, compare the imported records with the tables
      below. Cloudflare's scan can miss records, so add anything that's missing
      by hand. Pay most attention to **MX** and **TXT**: if they're wrong, email
      breaks as soon as the nameservers change.
- [ ] For the Squarespace website records (`A @` ×4 and `CNAME www`), click
      the orange cloud so it turns grey (**DNS only**) for now. They keep the
      old site up until step 5 and avoid any certificate or redirect-loop
      surprises in between.
- [ ] Note the **two Cloudflare nameservers** shown for each zone (something
      like `xxx.ns.cloudflare.com`). You need them in step 3.

### superhighway.fm: email records that must exist before step 3

| Type | Name | Content | Priority | Proxy |
|---|---|---|---|---|
| MX | `@` | `aspmx.l.google.com` | 1 | DNS only |
| MX | `@` | `alt1.aspmx.l.google.com` | 5 | DNS only |
| MX | `@` | `alt2.aspmx.l.google.com` | 5 | DNS only |
| MX | `@` | `alt3.aspmx.l.google.com` | 10 | DNS only |
| MX | `@` | `alt4.aspmx.l.google.com` | 10 | DNS only |
| TXT | `@` | `google-site-verification=mmKrQ_OJXnonPsyDU4D1U9UFdX8nlWezBYFT76qrZDc` | | |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | | |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` | | |

- [ ] **Change the SPF record.** Today's SPF is
      `v=spf1 include:dc-aa8e722993._spfm.superhighway.fm ~all`. That include
      points at a GoDaddy-managed helper record which the scan probably won't
      import. It resolves to `include:_spf.google.com`, so replace the whole SPF
      value with the direct, equivalent `v=spf1 include:_spf.google.com ~all`
      from the table. There must be exactly **one** `v=spf1` TXT record on `@`.
- [ ] Delete the GoDaddy-only `_domainconnect` CNAME/TXT if they were
      imported. They do nothing outside GoDaddy.
- [ ] Google Workspace has no DKIM record (`google._domainkey`) on this
      domain today. That doesn't block anything here; see step 10.

### johnwilliamcleary.com: email records that must exist before step 3

| Type | Name | Content | Priority | Proxy |
|---|---|---|---|---|
| MX | `@` | `johnwilliamcleary-com.mail.protection.outlook.com` | 0 | DNS only |
| TXT | `@` | `NETORGFT11483937.onmicrosoft.com` | | |
| TXT | `@` | `v=spf1 include:secureserver.net -all` | | |

These are Microsoft 365 records, not Google. If you've stopped using that
mailbox you could drop them, but keeping them costs nothing.

## 3. Point both domains at Cloudflare's nameservers

Only do this once step 2's email records look right in both zones.

- [ ] **johnwilliamcleary.com** (registered at **GoDaddy**): GoDaddy → **My
      Products** → **Domains** → `johnwilliamcleary.com` → **DNS** →
      **Nameservers** → **Change nameservers** → **I'll use my own
      nameservers**. Replace the two `connect*.squarespacedns.com` entries with
      the two Cloudflare nameservers for this zone → **Save**.
- [ ] **superhighway.fm**: same flow in the account that manages it (see the
      TODO above; most likely GoDaddy). Replace `ns57`/`ns58.domaincontrol.com`
      with the two Cloudflare nameservers for this zone.
- [ ] Don't change anything else at the registrar. In particular, don't remove
      the domains from GoDaddy.
- [ ] Wait for Cloudflare to email "**… is now active on Cloudflare**", or
      watch the zone's Overview page. Propagation can take **up to 24–48
      hours** but is usually **under an hour**.
- [ ] Check from your terminal (each should list two `*.ns.cloudflare.com`
      names):

  ```bash
  dig NS superhighway.fm +short
  ```

  ```bash
  dig NS johnwilliamcleary.com +short
  ```

## 4. Create the Worker from the GitHub repo

- [ ] Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a
      repository**. Connect GitHub if asked, granting access to
      `johnwcleary/superhighway` only, then select that repo.
- [ ] Settings:
  - **Project / Worker name:** `superhighway`. This must match `name` in
    `wrangler.jsonc`.
  - **Production branch:** `main`
  - **Build command:** `pnpm build`
  - **Deploy command:** `npx wrangler deploy`
  - **Root directory:** `/`
  - No environment variables are needed. Workers Builds reads Node 24 from
    `.nvmrc` and pnpm 12.16.1 from `package.json#packageManager` via Corepack.
- [ ] **Save and Deploy.** Watch the build log. It should finish with
      `wrangler deploy` uploading about 14 assets and **no bindings**.
- [ ] Open the `superhighway.<your-subdomain>.workers.dev` URL shown on the
      Worker's page and check the site renders.
- [ ] From now on, every merge to `main` deploys automatically. Production
      deploys don't come from GitHub Actions, which only runs checks.

## 5. Put the Worker on superhighway.fm (and redirect www)

In the **superhighway.fm** zone:

- [ ] **DNS → Records:** delete **only** the Squarespace website records: the
      four `A @` records (`198.185.159.144`, `198.185.159.145`,
      `198.49.23.144`, `198.49.23.145`) and `CNAME www → ext-sq.squarespace.com`.
      **Leave every MX and TXT record alone.** The custom domain in the next
      step can't be added while those records still exist on the hostname.
- [ ] **Workers & Pages → superhighway → Settings → Domains & Routes → Add →
      Custom domain** → `superhighway.fm` → **Add custom domain**. Cloudflare
      creates the DNS record and certificate itself. The record shows as
      read-only, type "Worker". The certificate can take a few minutes.
- [ ] **www.superhighway.fm** is handled by a redirect rule, not attached to
      the Worker. Workers static assets can't redirect by hostname (see
      `public/_redirects`), so the redirect happens at Cloudflare's edge:
  - [ ] **DNS → Records → Add record:** type `A`, name `www`, IPv4
        `192.0.2.1`, **Proxied** (orange cloud). This placeholder address is
        explained in step 6.
  - [ ] **Rules → Overview → Create rule → Redirect Rule** (Single Redirect):
    - **Rule name:** `www to apex`
    - **If incoming requests match:** **Custom filter expression** →
      **Edit expression**:

      ```
      (http.host eq "www.superhighway.fm")
      ```

    - **Then:** Type **Dynamic**, expression:

      ```
      concat("https://superhighway.fm", http.request.uri.path)
      ```

    - **Status code:** `301`
    - **Preserve query string:** on
    - **Deploy**

## 6. Redirect johnwilliamcleary.com → superhighway.fm

In the **johnwilliamcleary.com** zone:

- [ ] **DNS → Records:** delete the Squarespace website records: the four
      `A @` records and `CNAME www → ext-sq.squarespace.com`. Leave the MX and
      TXT records.
- [ ] Add two placeholder records, both **Proxied** (orange cloud):

  | Type | Name | Content | Proxy |
  |---|---|---|---|
  | A | `@` | `192.0.2.1` | Proxied |
  | CNAME | `www` | `johnwilliamcleary.com` | Proxied |

  **Why:** a Redirect Rule only runs on requests that reach Cloudflare, and a
  hostname only reaches Cloudflare if it has a proxied DNS record. With no
  record, browsers would get "server not found" before any rule could run.
  `192.0.2.1` is a reserved documentation address (RFC 5737) that never routes
  anywhere. Because the record is proxied, visitors only ever see Cloudflare's
  IPs, and the redirect fires at the edge before Cloudflare would try to
  contact that address. The `www` CNAME follows the apex, so it's proxied the
  same way. Universal SSL covers `johnwilliamcleary.com` and
  `www.johnwilliamcleary.com` automatically.

- [ ] **Rules → Overview → Create rule → Redirect Rule** (Single Redirect):
  - **Rule name:** `johnwilliamcleary.com to superhighway.fm`
  - **If incoming requests match:** **All incoming requests**. This matches
    every hostname in the zone, apex and `www` alike. It's the same as this
    custom filter expression:

    ```
    true
    ```

  - **Then:** Type **Dynamic**, expression:

    ```
    concat("https://superhighway.fm", http.request.uri.path)
    ```

  - **Status code:** `301`
  - **Preserve query string:** on
  - **Deploy**

## 7. Verify

Run these from your terminal once both zones are active and steps 5 and 6 are
deployed. Ignore header case and order: `curl` over HTTP/2 prints lowercase
headers.

```bash
dig MX superhighway.fm +short
```

Expected (order may vary):

```
1 aspmx.l.google.com.
5 alt1.aspmx.l.google.com.
5 alt2.aspmx.l.google.com.
10 alt3.aspmx.l.google.com.
10 alt4.aspmx.l.google.com.
```

```bash
dig MX johnwilliamcleary.com +short
```

Expected:

```
0 johnwilliamcleary-com.mail.protection.outlook.com.
```

```bash
dig TXT superhighway.fm +short
```

Expected: exactly one `v=spf1` record, `"v=spf1 include:_spf.google.com ~all"`,
plus the `google-site-verification=…` record.

```bash
curl -I https://johnwilliamcleary.com
```

Expected:

```
HTTP/2 301
location: https://superhighway.fm/
server: cloudflare
```

```bash
curl -I https://www.johnwilliamcleary.com/anything
```

Expected:

```
HTTP/2 301
location: https://superhighway.fm/anything
server: cloudflare
```

```bash
curl -I https://www.superhighway.fm
```

Expected:

```
HTTP/2 301
location: https://superhighway.fm/
server: cloudflare
```

Extra checks:

```bash
curl -I https://superhighway.fm
```

Expected: `HTTP/2 200`, `content-type: text/html…`, `server: cloudflare`.

```bash
curl -I https://superhighway.fm/nope
```

Expected: `HTTP/2 404`. In a browser it shows the site's own 404 page.

```bash
curl -I "https://johnwilliamcleary.com/some/path?utm_source=test"
```

Expected: `location: https://superhighway.fm/some/path?utm_source=test`. This
shows the query string is preserved.

- [ ] All of the above match.
- [ ] Open <https://superhighway.fm> in a browser and on your phone. Check that
      the padlock is valid and the phone/email links work.

## 8. Test email on both domains

- [ ] **superhighway.fm (Google Workspace):** from a personal address (Gmail,
      iCloud, …) send to `john@superhighway.fm`. Confirm it arrives, then
      reply from `john@superhighway.fm` and confirm the reply arrives.
- [ ] In the received reply, open **Show original** (Gmail) or the equivalent
      and check `SPF: PASS` and `DMARC: PASS`.
- [ ] **johnwilliamcleary.com (Microsoft 365):** if you still use an address on
      this domain, do the same round trip from Outlook. If you don't, skip
      this.
- [ ] If anything bounces, compare the zone's MX/TXT records with the tables
      in step 2. Nothing else in this runbook touches email.

## 9. Cancel the Squarespace website subscription

Only do this once step 7 passes and step 8 shows mail flowing.

- [ ] Squarespace → the site → **Settings → Billing → Subscriptions** → cancel
      the **website** plan.
- [ ] Nothing about the domains needs to change at Squarespace. Neither domain
      is registered there: `johnwilliamcleary.com` is at GoDaddy, and
      `superhighway.fm` is at GoDaddy/Instra (see the TODO at the top). Both
      domains' DNS is now on Cloudflare, so Squarespace's DNS records stop
      mattering.
- [ ] Before cancelling anything else, check where **Google Workspace** is
      billed (Google Admin → **Billing**). If it was bought through a reseller
      (GoDaddy or Squarespace), keep that subscription. Only the website plan
      goes.
- [ ] Keep both domains registered where they are for now, renewing as usual.
      Moving them is optional (step 10).

## 10. Optional, later

- [ ] **Transfer both domains to Cloudflare Registrar.** It renews at cost with
      no markup and puts registration and DNS in one account. Both `.com` and
      `.fm` appear on Cloudflare's supported-TLD list. In the dashboard:
      **Domain Registration → Transfer Domains**. Unlock each domain and get its
      auth code from the current registrar first. A `.com` can't move within 60
      days of registration or a previous transfer. The dashboard shows whether
      each domain is eligible.
- [ ] **A `hi@superhighway.fm` address without another Workspace seat:**
      **don't use Cloudflare Email Routing for this.** Email Routing needs
      Cloudflare's own MX records on the domain, which would replace Google's
      and break Workspace mail for `superhighway.fm`. Instead, add `hi@` as an
      **alias** on your existing Workspace user (Google Admin → **Users** → you
      → **Alternate email addresses**). Aliases are free, up to 30 per user. Or
      create a free Google Group with that address. Email Routing would only
      suit a domain with no other mail provider.
- [ ] **Add DKIM for superhighway.fm:** Google Admin → **Apps → Google
      Workspace → Gmail → Authenticate email** → generate a key → add the
      `google._domainkey` TXT record in Cloudflare → **Start authentication**.
      This strengthens the existing DMARC `p=quarantine`.
- [ ] **DMARC reports:** the `_dmarc` record sends aggregate reports to
      GoDaddy's `onsecureserver.net` service. Point `rua=` at an address you
      read, or at Cloudflare's free DMARC Management, if you want to see them.

---

### Rollback

If something goes wrong after step 5, you can put the old site back without
touching email:

- Remove the Worker custom domain and the redirect rules.
- Restore the Squarespace records in each zone: `A @` →
  `198.185.159.144`, `198.185.159.145`, `198.49.23.144`, `198.49.23.145`
  (DNS only) and `CNAME www` → `ext-sq.squarespace.com` (DNS only).

This only works while the Squarespace website subscription is still active,
which is why step 9 comes last.
