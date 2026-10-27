# Curated Odd one out questions

Approved format: each question explicitly states the connection and asks which of four countries is the exception. Replace the generated hidden-connection puzzles with 36 curated questions spanning borders, physical geography, capitals and languages. Keep flags, scoring and the existing shared-property reveal.

Store the editable source in `scripts/gen/odd-one-out.json`; the bank generator resolves country codes, shuffles options deterministically, and preserves explanations in Supabase's `extra` field. Reject duplicate keys, unknown countries and anything other than three distinct matching countries plus one distinct exception. Editorial difficulty reflects the fact being tested.

Regenerate the checked-in bank and category statistics. Sync only this category to Supabase, inserting and verifying the replacement before removing obsolete generated questions. Leave other categories intact.

Review: border and capital facts checked against `lib/geo/countries.json`; physical facts checked against the Alpine Convention, HELCOM, ESA and OECD sources listed below. Validate option uniqueness, answer membership, explicit prompts, three difficulty tiers, regeneration stability and existing scoring tests.

Sources for less obvious physical facts:
- https://www.alpconv.org/en/home/
- https://www.esa.int/Applications/Observing_the_Earth/Earth_from_Space_Lakes_of_Africa
- https://stateofthebalticsea.helcom.fi/wp-content/uploads/2017/07/HELCOM_State-of-the-Baltic-Sea_First-version-2017.pdf
- https://www.oecd.org/en/publications/enhancing-the-competitiveness-of-the-trans-caspian-transport-corridor-in-central-asia_f261e7fa-en/full-report/tctc-state-of-play-challenges-and-policy-considerations_b8a252b7.html
- https://maritime-spatial-planning.ec.europa.eu/sea-basins/north-sea
- https://aguasamazonicas.org/basins/amazon-main-stem/amazon-river
