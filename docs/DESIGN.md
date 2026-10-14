# Design direction

## Subject and primary jobs

Wasl means connection. This product connects a customer's question to a responsible person, visible progress, and a clear resolution. The customer experience should reduce uncertainty; the support experience should improve operational reading and action.

The agreed interface languages are English and Arabic, with automatic alignment changes. Backend setup is delivered through the Supabase SQL Editor.

## Compact token system

| Token            | Value     | Purpose                                                            |
| ---------------- | --------- | ------------------------------------------------------------------ |
| Connection blue  | `#2454D6` | Primary action and the customer welcome panel                      |
| Ink              | `#182B49` | Main copy and headings                                             |
| White            | `#FFFFFF` | Working surfaces                                                   |
| Cool canvas      | `#F2F5FA` | Page background                                                    |
| Waiting yellow   | `#F4CC62` | Small illustrative accent; waiting states use a lighter derivative |
| Resolution green | `#247A61` | Resolved state and confirmation                                    |

Manrope is used for Latin content; Noto Sans Arabic for Arabic. Both are self-hosted with their licenses. Main type scale: 43 / 32 / 27 / 22 / 16 / 14 / 12, with smaller data labels used selectively. Mobile request titles were increased after visual review. User-entered message content uses automatic text direction.

## Layout exploration

### Chosen customer layout

```text
Brand        My requests             Language / Account
Greeting
Welcome + Create request             Illustrative request thread
Request tabs / search / list         Helpful-request guidance
```

A blue welcome panel is the single expressive moment. Its ticket illustration refers to the support process, not arbitrary decoration. The remaining interface is quiet, mostly white, and aligned to the current language.

### Chosen support layout

```text
Sidebar       Context header
              Page heading / Refresh
              Workload pulse
              Tabs / search / filters
              Dense request table / bounded pages
```

A card-per-request proposal was rejected because it obscured scanning and ownership. The support table uses distinct columns rather than repeated decorative panels. Manager workload is a server-backed reporting view, not a set of invented success metrics.

## Review against generic patterns

Removed the initial idea of a repeated three-card statistics grid. There are no decorative all-caps labels, artificial numbered sections, gradient washes, automatic reveal animations, or repeated arrow suffixes on buttons. The interlocking brand symbol reflects connection; status chips encode actual lifecycle states.

After screenshot review:

- Fixed Angular critical-CSS behavior under the delivered CSP.
- Darkened muted text to pass representative WCAG AA contrast checks.
- Increased small-screen request title/status readability.
- Kept the support shell plain rather than adding another hero illustration.
- Checked Arabic and mobile layouts at 390 px.

The interface aims for restraint: one memorable opening in the customer portal and straightforward tools everywhere else.

## Release 1.1: appearance modes

All application surfaces now use shared semantic tokens. Light mode keeps the cool off-white canvas and restrained blue actions. Dark mode uses a navy canvas (`#111B29`), layered surfaces (`#192638`, `#24344A`), soft text (`#E3EBF6`), muted text (`#AFBDD0`), and a quieter hero (`#1E4079`). Status colors retain their meaning without neon accents or pure black backgrounds.

The theme toggle appears on both sign-in screens and application headers. It follows the system initially, persists an explicit choice, synchronizes same-origin tabs, and changes appearance without remounting forms or losing drafts. A small external bootstrap script applies the initial choice before application bundles load, remaining compatible with a CSP that disallows inline JavaScript.
