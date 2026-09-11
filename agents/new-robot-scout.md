# New robot scout

Runs monthly. Goal: find robots announced or newly buyable in the last ~45 days that
belong in the index, and propose them with every field sourced.

## Inclusion rules

- Buyable by a person or small team: a store price, a distributor price, or an open-source BOM with a repo.
- Cheapest buyable tier at or under $25,000 USD.
- Some form of developer access: an SDK, ROS packages, open firmware, or fully open hardware. If access is gated to a tier, that is fine; say which tier.
- Forms: arm, bimanual, desktop, mobile_base, mobile_manipulator, quadruped, humanoid.

## Procedure

1. Read the index (`select slug, name from robots`) and pending `new_robot` proposals from Supabase project `bdtvvzkoocymycqafkqb`.
2. Search broadly: "new robot arm launch", "humanoid robot preorder price", "quadruped developer kit", "open source mobile manipulator BOM", LeRobot community hardware, Kickstarter/Crowd Supply robotics, YC/HN launches, Hugging Face LeRobot blog, vendor newsrooms (Unitree, Hello Robot, Trossen, AgileX, Elephant, UFACTORY, ROBOTIS, Pollen, Nori, DEEP Robotics, Waveshare, MangDang, Petoi, Booster, LimX, Fourier, Galaxea, and any new names).
3. For each candidate, open the official page and, if it exists, the repo. Fill every field you can source: form, summary (own words), sdk_access with a required sdk_note naming the tier, languages, open_hardware with note, lerobot_support, sim_support, availability, dof, payload_kg, height_cm, weight_kg, tiers with prices and whether each includes the SDK.
4. Set `confidence: "verify"` and write `confidence_note` saying what you could not confirm.
5. Sources: at least one URL for price, one for SDK access, one for open-hardware status. Quotes under 15 words.
6. File one `new_robot` proposal per candidate. Company slug is kebab-case of the company name.
7. POST to `/api/proposals`. Do not call apply; new robots always wait for a human.
8. Summarise candidates considered, filed, rejected and why.

Do not modify the repo. Do not write to any table.
