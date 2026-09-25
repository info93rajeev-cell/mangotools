# Guided Reply & Appointment Engine (non-AI)

**Status:** 🔜 **Future feature only.** Not part of Phase 1 and not part of TASK-002. Nothing here may be
described publicly as available. It needs its own approved task, and probably a new engine lane.

## 1. What it is

A small, **deterministic** assistant for a website (MangoTools itself, and later customer sites). It is
**not AI**. It can do exactly two things:

1. **Reply from available approved data.**
2. **Fix appointments from predefined available slots.**

Nothing else.

## 2. Hard rules

**Forbidden** (enforced as architecture rules, not just policy):

- LLMs or any AI model, local or remote
- AI text generation, rewriting or summarising
- Online research or web search
- Guessing, or "best effort" answers built from partial matches
- Pulling data from outside the approved sources in §3

**Every reply is either** an approved text returned verbatim (with template fields filled from known
values), **or** one of the fixed fallback responses in §5.

## 3. Allowed data sources

| Source | Examples |
|---|---|
| Website content | Page text from the built site |
| Tool page content | Tool descriptions, FAQs, "how it works", references |
| FAQ | Category and tool FAQs |
| Policy pages | Privacy, disclaimer, terms |
| Service / pricing text | Published pricing and service descriptions |
| Admin-defined response templates | Approved Q → A pairs, with keywords and synonyms |
| Admin-defined appointment availability | See §6 |
| User-provided form data | Name, email and the question the user typed into the assistant form |
| Deterministic tool result on the current page | For example "Your GST total is ₹1,18,000.00", read from the tool's current output |

All sources are **versioned content** in the repository or in an admin store, never fetched at answer
time from outside.

## 4. How replies are chosen (deterministic)

1. **Guided first.** Show buttons for known topics ("Pricing", "How is GST calculated?", "Book an
   appointment"). A button maps directly to an approved answer, so no matching is needed.
2. **Typed questions** are normalised (lower-case, punctuation removed, synonyms from the taxonomy) and
   matched against the approved Q&A keywords with the existing deterministic search engine
   (`engines/search`).
3. A match is used only if its score passes a **fixed threshold** and clearly beats the runner-up by a
   fixed margin. Otherwise the reply is a fallback. **Never** stitch several partial answers together.
4. Same question + same content version → same reply. This is covered by fixtures, like every engine.
5. The reply shows its **source** ("From: GST Calculator FAQ") so the user can check it.

## 5. Fallback responses (exact text)

| Situation | Reply |
|---|---|
| No approved answer matches | "I do not have this information available." |
| The topic is marked human-only (legal, billing disputes, complaints), or the user asks for a person | "Please contact the team for this question." |
| The question is outside the website's data (general knowledge, other companies, news) | "I can only answer from the information available on this website." |

The fallback texts live in the string files and must not be reworded without founder approval.

## 6. Appointments

Appointments may only use **predefined availability** set by an admin:

| Setting | Meaning |
|---|---|
| Working days | For example Mon–Fri |
| Working hours | For example 10:00–17:00, with time zone |
| Slot duration | For example 30 min |
| Blocked dates / times | Holidays, leave, one-off blocks |
| Appointment type | For example "Product demo (30 min)" or "Enterprise call (45 min)" |
| Required fields | For example name, email, company, topic |
| Confirmation template | An approved text with fields filled in |
| Cancellation / reschedule rule | For example "up to 24 h before, via the link in the confirmation" |

Rules:

- **Never invent appointment slots.** The engine generates candidate slots only from the settings above,
  minus blocked times and already-booked slots.
- Slot generation is a pure, fixture-tested function: same settings, date and bookings → same slots.
- Show time zones explicitly. Store times in UTC.
- If no slot is available: "No appointment slots are available in this period. Please contact the team."
- Booking needs a server to hold bookings and prevent double-booking. That is a **future backend**
  (`apps/api` is forbidden in Phase 1). It must be declared as an upload in the trust map
  (`TRUST-PROMISES-AND-POLICY-RULES.md` §2.2), with the collected fields listed on the form.

## 7. Limited voice (optional add-on)

The founder does not want AI voice. Voice may only **read approved response text aloud**.

| Rule | Detail |
|---|---|
| Engine | **Browser Text-to-Speech only** (Web Speech API `speechSynthesis`) |
| No AI voice | No AI voice generation, no cloud TTS service, no voice cloning |
| No microphone | No microphone access in the early version. Keep `Permissions-Policy: microphone=()` |
| No voice input | Speech recognition is not used |
| No autoplay | Nothing is spoken until the user acts |
| User action | The user clicks **Listen** on a reply. **Stop** is always available |
| Unavailable | Show: **"Voice playback is not available on this device."** |

Privacy caveat for implementation: some browsers offer **network voices**. Chrome's "Google …" voices,
for example, send the text to a remote service. To keep the "no unnecessary uploads" promise, use only
voices where `SpeechSynthesisVoice.localService === true`. If there is no local voice, show the
unavailable message.

## 8. Acceptance ideas for the future task

- There is no dependency on any AI/LLM SDK. The architecture check bans them in this lane.
- Fixtures: question → reply (including every fallback), and availability → slots (including blocked
  dates, DST and time-zone edges).
- The network test shows no requests during replies. Booking requests go only to the declared endpoint.
- The a11y suite covers the assistant dialog, the buttons and the Listen control.
- The content version and source label are shown with every reply.

## 9. Open questions (founder)

1. Is this for the MangoTools site only, or a product sold to customer websites (white-label)? This
   changes the lane, the pricing and the admin UI.
2. Where do admins edit templates and availability: in the repository (reviewed like content) or in a
   future admin panel?
3. Confirmation delivery (email) needs an email provider, which is a new egress. Approve it before
   building.
