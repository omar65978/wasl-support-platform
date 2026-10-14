# Workflow demonstration

## Before presenting

For a live demonstration, apply SQL, create the five accounts, and run `npm run test:live`. Use separate browser profiles/contexts for the customer, agent, and manager. Open both applications against the same Supabase project.

For a no-credentials demonstration, build and start the combined preview. Open `/customer/` and `/support/` on the same origin and use the explicit demo buttons. Local demo state is shared across those paths. It is not shared between different browsers or development ports. Demo attachments are intentionally unavailable.

## Required demonstration

1. **Customer creates a request.** Sign in as `customer@wasl.test`, choose Create a request, enter a title/description, select Technical issue and High, and submit. Note the `WS-…` reference.
2. **Agent finds and claims it.** Sign in as `agent@wasl.test` in another browser profile. Open Unassigned, locate the reference, and choose Take this request. Confirm the owner's name and In progress status.
3. **Agent replies publicly.** Enter a customer-visible update in Reply to customer and send it.
4. **Agent adds an internal note.** Select Internal note and record a private diagnosis. The yellow note and privacy hint distinguish it from public communication.
5. **Customer replies.** Refresh the customer page or wait up to 15 seconds. Confirm the public message is present and the private note is absent. Send additional information.
6. **Agent completes the request.** Refresh the agent view, read the reply, choose Resolve request, enter at least 10 characters of resolution, and confirm. The customer's composer disappears and the resolution is visible.
7. **Isolation is tested.** Copy that request URL. Sign in as `other.customer@wasl.test` in a separate browser context and paste it. The request must remain unavailable. Run the live suite to demonstrate direct API and protected-file checks rather than relying only on UI hiding.
8. **Manager reassigns.** Open the request as `manager@wasl.test`, select Youssef Adel, and reassign it. Review Workload overview. A normal agent cannot open that report by editing the URL.
9. **Customer reopens.** Open the original customer session and choose Reopen request. The assigned employee remains; normal conversation resumes.

## Additional readiness checks

- Public PDF upload: attach a small PDF as the customer; download it as the assigned agent.
- Internal file upload: select Internal note before attaching a file as the owner; confirm no customer metadata or download access is available.
- File validation: try a renamed HTML file or an oversized image; it must fail before finalization.
- Conflict: keep an old agent page open, change the request from another session, then submit before its next refresh. The draft should remain and the UI should show the conflict.
- Slow connection: throttle the network; submission buttons should show their pending state and prevent duplicate clicks.
- Failed mutation: disconnect and send a message. The UI must not announce success or discard the draft. Reconnect, refresh, and inspect the server state before retrying.
- Browsing: use search, sort, filters, and next/previous pages. Observe bounded request queries in the browser network panel.
- Mobile/Arabic: switch the language, narrow the viewport to 390 px, open a request, reply, and use the support navigation menu.
- Keyboard: navigate to Create a request, enter fields, open the help dialog, dismiss with Escape, and verify focus returns to its trigger.

## Review answers

| Question                            | Location / answer                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| Where is Auth state?                | Shared `auth.ts`; React external-store hook and Angular injectable signals                |
| Where is authorization?             | SQL grants, table RLS, mutation RPCs, Storage policies; frontend guards are supplementary |
| How are roles shared?               | PostgreSQL `user_role`, `profiles.role`, and common TypeScript models                     |
| Where is server data managed?       | Shared `Repository` in `api.ts`; bounded component snapshots                              |
| What if an update fails?            | No optimistic success; keep draft; show error; refresh conflicts                          |
| Why no duplicate live messages?     | Replace snapshots by stable IDs rather than appending polling results                     |
| How are large lists handled?        | Indexed server-side search/filter/sort, 12-row pages, SQL aggregate reports               |
| Which data is public configuration? | URL and publishable key; never database/admin credentials                                 |
| Strongest tests?                    | Executed SQL policy tests plus hosted direct-API/Storage verification                     |

## Reset demo data

Sign out of the demo applications, clear the `wasl:demo:data:v1` localStorage entry through browser developer tools, then enter the demo again. This affects only sample data in that browser and does not touch Supabase.
