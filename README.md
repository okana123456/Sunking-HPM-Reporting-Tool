# Sun King Kenya HPM Reporting

The current release includes a separate 90-visit test data client dashboard. See CLIENT-LINKS.md for the public demo, protected management link, revised target and test dataset definitions. The production import workflow below remains separate from the demonstration.

Built afresh for Rudder Research and Data Analytics Ltd. This is a local-first implementation stage with optional Supabase central persistence. It imports manual SurveyToGo full CSV and single-sheet XLSX exports. It is not live shopper tracking.

## Local project

Repository folder: `C:\Users\Admin\Desktop\Sun-King-HPM-Reporting`

Add this folder in GitHub Desktop using File > Add local repository.

```sh
npm install
npm run dev
npm test
npm run build
```

Without environment configuration, the application operates as an explicitly labelled, in-memory local preview. Refreshing loses preview data. No production records or credentials are bundled. Use the supplied export locally through the upload interface. Never commit exports.

## Connect Supabase

1. Apply `supabase/migrations/001_reporting.sql` in a new Supabase project's SQL editor. Back up an existing database and review the schema before applying there.
2. Create a Rudder user in Supabase Authentication. Disable public sign-ups if not needed. Obtain the user's UUID.
3. In the SQL editor, run `insert into public.managers(user_id) values ('YOUR-AUTH-USER-UUID');`. The browser cannot add managers.
4. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` using the project URL and publishable or anon key. Never use the service-role key or database password.
5. Restart the local server. Sign in as the authorised manager. Import privately, verify mappings and assignments, and save. Records are now central and available to authorised managers on another device.
6. Preview the publication payload and publish. The server independently builds an aggregate allowlist from the current workspace, so a browser cannot publish an arbitrary private payload. Publication creates a fixed snapshot and revocable random UUID link. A subsequent publication creates a replacement link. Revoke old links in administration if needed.

RLS denies anonymous table access. Anonymous users can only call `get_report` with an active token. Management writes use restricted functions with a manager check and revision conflict protection. Client links require no login. Anyone holding a link can see its allowed aggregate contents, and downloaded copies cannot be revoked. Raw interviews, notes, GPS and free text never enter client snapshots.

## Import and analysis rules

- Scope identifiers as `survey ID:SbjNum`. Keep a stable survey ID across uploads.
- Reimports do not increase record counts. Partial exports do not delete existing records. Changed records require explicit review and keep prior raw values.
- Upload and interview timestamps do not establish export revision order. Changed records always require review, including older exports. No silent overwrite occurs.
- History retains incoming raw rows, filenames, classifications and mapping version. Dictionary edits retain the previous dictionary.
- Source values remain strings. Multiple-answer columns are decoded as selected codes, never assumed to be binary flags.
- Unverified codes display as Code followed by the original value. Blank values are routed out only under verified routing.
- Default findings use approved production Sun King records matched to the assignment register. Competitors are excluded. Unknown test classifications are not production.
- A received record is not evidence of a successful selling interaction. Retain unsuccessful visits and set their outcome in the assignment register.
- Assignment columns: `visitId,key,outlet,ahq,zone,kind,persona,objection,outcome`. Each planned visit must have a unique visitId. key can be blank until an interview is matched. A received interview key can only appear once. kind is Sun King or Competitor. No supplied outlet/zone allocations have been invented.
- Only explicit verified, publishable, non-private single-code categorical question fields enter client reports. Inspect the exact preview before publishing. Review labels as well as codes for accidental personal information.
- Date parsing currently supports ISO timestamps with explicit offsets or month/day/year timestamps plus UTCDiff. Confirm SurveyToGo's export date convention. Display uses Africa/Nairobi. Missing offsets and time-only manual answers are not guessed.
- No scoring framework, correct product prices, financing terms or performance thresholds are assumed.

## Questionnaire dictionary

Administration has an editable JSON dictionary. Each source variable has a questionnaire label, full question text, section, type, code labels, verified/private/publish flags, optional required flag, and optional routing. Routing is a verified membership rule with `field` and `values`. Do not mark routing verified until checked against the questionnaire. Multi-condition and revision-dependent routing require extending the rule engine and tests before those questions are certified. Each multi-answer source column must be mapped independently.

## Deployment

GitHub stores the source. Pushing does not host the dashboard. Deploy the static `dist` directory to an HTTPS static host such as Netlify, Cloudflare Pages or Vercel. Set the two public environment variables in the host before building. Build command: `npm run build`. Output directory: `dist`. Configure the deployed address in Supabase Authentication settings. Use the deployed hostname for client links; a localhost link cannot be opened from another device. Run the access checks below before sharing any real report.

## Validation

`npm test` covers CSV and XLSX parsing, repeated imports, partial files, updates and raw history, invalid IDs, test separation, decoding, eligibility, unsuccessful visits, dates and client payload privacy. Set `HPM_TEST_EXPORT` to the private supplied CSV path to run its integration test. This creates an equivalent XLSX in memory and validates both formats without committing source data.

Before deployment, verify with a configured Supabase project:

1. Anonymous direct reads of workspace, managers and reports fail or return no rows.
2. An authenticated non-manager cannot save, publish or revoke.
3. A manager can import and reload centrally persisted data.
4. Concurrent saves reject an outdated workspace revision.
5. A published token loads in a separate browser with no sign-in.
6. Network responses contain only approved aggregates, never raw/private fields.
7. Revoking a token makes it unavailable in another browser.

These database and cross-device checks require the project's connection details and are not established by unit tests.

## Remaining implementation inputs and limits

The supplied CSV contains 10 test interviews, 183 columns, 6 Approved and 4 Requires Approval. It does not establish production progress. Questionnaire, assignment register, approved benchmarks, logos and Supabase credentials are pending.

This initial implementation does not yet certify questionnaire versions, multi-condition routing, contradiction checks, configurable duration thresholds, evidence review/publication, or repeat-attempt assignment matching. A single planned visit currently accepts one interview key. The JSON mapping editor is functional but is intended for trained administrators. These items must be completed against the supplied current questionnaire and operational decisions before production launch.

Data storage uses one private JSON workspace with revision locking. This is appropriate for the small 30-visit programme, but not a general high-volume survey warehouse. Original file bytes are not retained; all imported source rows and prior values are retained. Use a secured external archive for original exports.
