# Client and management links

The public root and #demo open a read-only, clearly labelled 90-visit simulation without sign-in. #admin opens the existing protected Rudder management area. #report=TOKEN opens a published production snapshot.

Local preview: npm run dev. The localhost address only works on this PC. Use the hosted address for Sun King.

## Simulation

90 visits on Saturday 24 October 2026. Five supplied zones, six supplied AHQs each, three formats per AHQ (Shop, Gazebo, Parasol). Fifteen supplied shopper names have six illustrative allocations each. The four supplied username examples are used; other usernames are illustrative and labelled. No assignment, response, QC decision or timestamp describes actual shopper work.

All source demo records have synthetic=true and test=true and use SIM identifiers. They are generated separately in src/demo-data.js and never enter the production workspace. Actual imported SurveyToGo test records are not used to generate findings. Demo variables have DEMO_ prefixes, and no current questionnaire mapping is claimed.

The default analysis sample is simulated Approved records. Only completed interactions are eligible for normal selling questions. Missing and unmapped answers remain in eligible denominators. Coverage and QC intentionally show all selected QC statuses.

## Revised project target

The user revised the project to 90 visits (30 AHQs x 3 formats). The admin interface and client preview use 90. Run supabase/migrations/002_visit_target_90.sql in the existing Supabase project to update the target in future production snapshots. Previously published snapshots remain unchanged.

## Real data

This release does not replace the current questionnaire, real assignment mapping, or Supabase permission and publication checks. Raw responses visible to the public are from the synthetic dataset only. Production clients still receive the restricted published aggregate payload.

Hosted link (available after successful deployment): https://sun-king-hpm-reporting-demo.whole-dove-2046.chatgpt.site/#demo
Rudder management: https://sun-king-hpm-reporting-demo.whole-dove-2046.chatgpt.site/#admin

