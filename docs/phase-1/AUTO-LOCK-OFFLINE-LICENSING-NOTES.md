# Auto-Lock Offline Mode — licensing notes

**Status:** 🔜 **Future feature only.** Nothing here is built in Phase 1, and nothing here may be described
publicly as available. Phase 1 has no accounts, payments or entitlements (`AGENTS.md` Phase 1 notes).
Implementing any of this is a stop condition ("touches auth, payments, entitlements") and needs its own
approved task.

## 1. Terminology

| Use | Do not use |
|---|---|
| **Auto-Lock Offline Mode** | "auto-delete", "wipe", "expire data", "kill switch" (in user-facing text) |
| "Premium tools auto-lock" | "Your projects will be disabled" |
| "Refresh your license" | "Your data will be removed" |

## 2. Core principle

> **User data must never be deleted because a subscription expires.**

Expiry locks *capabilities*, never *data*. This matches the approved security architecture: "Paid features
lock; projects open read-only; raw data export stays available; free features continue", which it
describes as "protects revenue without holding customers' data hostage"
(`docs/architecture/platform-security-architecture.md` §1.4 and §9.8).

## 3. Behaviour after the offline entitlement expires

The offline entitlement is the signed entitlement certificate and its grace deadline (`graceUntil`).

| Allowed ✅ | Locked 🔒 |
|---|---|
| Open existing local projects | Run new premium calculations |
| View saved results | Create new professional projects |
| View previous reports | Generate new branded reports |
| Export raw user data (CSV / JSON) | Use paid datasets |
| See license / subscription status | Use premium extension features |
| Reconnect to renew | Export professional reports |
| Use all free tools | |

Notes:

- "View previous reports" means opening a report file or record that was already generated. Re-rendering
  it with branding counts as "generate", which is locked.
- Free tools are never affected by license state.
- The lock screen must show what is locked, why, and the single action "Reconnect to renew". There is no
  countdown pressure and no nagging on page load.

## 4. Renewal flow

1. The user connects to the main app or server (MangoTools cloud, or the organisation's own control plane
   in Private and Air-Gapped modes, §18.2).
2. The subscription is verified.
3. A new signed entitlement certificate is issued to the device.
4. The offline working period resets.
5. Paid tools unlock again, with no data migration and no re-import.

Air-Gapped mode: steps 1–3 become a signed licence file that an administrator carries in (security
architecture §18.7). The principle is the same.

## 5. Public wording (approved)

> **"Your data is not deleted when access expires. Premium tools auto-lock until your license is refreshed."**

Use it on the pricing page, in the lock dialog and in the terms, **only once the feature exists**.

## 6. Technical notes (from the approved architecture, for the future task)

- Grace defaults: Professional 72 h · Business 7 days · Enterprise policy up to 30 days (security §9.8).
- Clock-rollback detection: paid features require going online if the local clock falls behind the last
  trusted time.
- Certificates are bound to the device key. Licensed dataset caches are encrypted with keys that arrive
  inside valid certificates.
- Code checks **capabilities** (for example `export.pdf.branded`), never plan names (product architecture
  §9.5).
- Honest limit: client-side locks can be bypassed by a determined user. Real protection is server-held
  value (datasets, sync, verification, updates).

## 7. Conflicts to resolve before implementation (founder)

1. **Server-side retention.** Security §9.8 says "projects kept (encrypted) for 12 months" after a
   downgrade. **Local** data is never deleted by the product. For **cloud-synced** copies, the founder
   must decide whether a retention limit is acceptable under "never deleted". If it is, it must be
   disclosed, with export reminders before any cloud copy is removed.
2. **Payment grace vs connectivity grace.** Keep them as two separate timers (security §9.8) so that a
   card failure and a lost signal are explained to the user differently.
3. **Wording for teams.** When an organisation removes a seat, is the user's local data still theirs to
   export? The default proposed here is yes (raw export stays allowed). Confirm with the organisation
   policy model (§18.8).
