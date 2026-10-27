# Second 100-question Odd one out expansion

Adds 100 questions to the existing 136, reaching 236. All additions retain the explicit-criterion, three matches plus one exception format. Authoring batches were cross-reviewed for facts, ambiguity and repeated criteria. Existing questions and all other categories are preserved.

# Third border batch: 34 questions

Exactly 26 new simple border targets and eight new conjunctions (countries bordering both named targets). No keys or prompts duplicate the existing 136-question source bank. All 136 option positions contain valid sovereign-country codes, with three distinct positive options and a separate odd option in each question.

Border predicates were checked against the local country dataset in both directions for every positive and negative choice. Difficulty ratings are editorial.

## Caveats checked

- All assertions refer to international country borders, including ordinary river borders. No positive border pair is separated solely by a lake or sea. In particular, the DRC–Tanzania lake-only boundary is never used.
- Venezuela is not used as a simple target, since its three-neighbour option set would require the disputed Guyana border. No Kosovo, Taiwan, Palestine or Western Sahara entity codes are used.
- Ukraine questions use internationally recognized country-to-country borders and do not depend on present military control or claims over occupied territory. Ukraine options are Poland, Slovakia and Romania. No Russia–Ukraine pair is needed in this batch.
- DRC questions use Angola, Central African Republic and South Sudan, with Cameroon as the odd option. These choices avoid the purely lacustrine DRC–Tanzania relationship. The target prompt spells out the Democratic Republic of the Congo; the local dataset uses DRC.
- The South Africa/Zambia conjunction uses Zimbabwe, Mozambique and Namibia. Botswana–Zambia is not used, avoiding its potentially surprising tiny border. Namibia–Zambia is an internationally recognized river boundary along the Zambezi; this is not a lake-only boundary.
- Russia is paired with Norway, Finland, Latvia, China, Mongolia, Kazakhstan and North Korea only where needed. Those relationships do not rely on disputed territories. Russia's borders with Norway and Finland are ordinary recognized borders.
- Swiss and German border conjunctions involving France refer to the ordinary European borders; overseas French territory plays no role. Liechtenstein borders both Austria and Switzerland.
- All eight conjunction prompts explicitly say BOTH, preventing players from needing to infer a hidden connection.

## Validated criteria

- `border-switzerland`: target(s) CHE; matching FRA, ITA, LIE; exception BEL.
- `border-belgium`: target(s) BEL; matching DEU, FRA, NLD; exception CHE.
- `border-czechia`: target(s) CZE; matching DEU, AUT, POL; exception SVN.
- `border-slovakia`: target(s) SVK; matching CZE, HUN, UKR; exception SRB.
- `border-croatia`: target(s) HRV; matching SVN, HUN, BIH; exception MKD.
- `border-slovenia`: target(s) SVN; matching AUT, ITA, HUN; exception SVK.
- `border-ukraine`: target(s) UKR; matching POL, SVK, ROU; exception CZE.
- `border-belarus`: target(s) BLR; matching POL, LTU, LVA; exception EST.
- `border-lithuania`: target(s) LTU; matching POL, LVA, BLR; exception EST.
- `border-latvia`: target(s) LVA; matching EST, LTU, RUS; exception POL.
- `border-norway`: target(s) NOR; matching SWE, FIN, RUS; exception DNK.
- `border-finland`: target(s) FIN; matching NOR, SWE, RUS; exception EST.
- `border-paraguay`: target(s) PRY; matching BRA, ARG, BOL; exception URY.
- `border-senegal`: target(s) SEN; matching MRT, MLI, GIN; exception SLE.
- `border-honduras`: target(s) HND; matching GTM, SLV, NIC; exception CRI.
- `border-saudi-arabia`: target(s) SAU; matching JOR, KWT, YEM; exception SYR.
- `border-botswana`: target(s) BWA; matching NAM, ZAF, ZWE; exception AGO.
- `border-namibia`: target(s) NAM; matching AGO, ZMB, BWA; exception MOZ.
- `border-zimbabwe`: target(s) ZWE; matching ZMB, MOZ, BWA; exception NAM.
- `border-mozambique`: target(s) MOZ; matching ZAF, MWI, TZA; exception NAM.
- `border-malawi`: target(s) MWI; matching MOZ, TZA, ZMB; exception ZWE.
- `border-uganda`: target(s) UGA; matching KEN, RWA, SSD; exception ETH.
- `border-rwanda`: target(s) RWA; matching UGA, BDI, COD; exception KEN.
- `border-burundi`: target(s) BDI; matching RWA, COD, TZA; exception UGA.
- `border-drc`: target(s) COD; matching AGO, CAF, SSD; exception CMR.
- `border-nigeria`: target(s) NGA; matching BEN, NER, CMR; exception GHA.
- `border-china-and-russia`: target(s) CHN, RUS; matching KAZ, MNG, PRK; exception UZB.
- `border-austria-and-switzerland`: target(s) AUT, CHE; matching DEU, ITA, LIE; exception SVN.
- `border-germany-and-italy`: target(s) DEU, ITA; matching AUT, CHE, FRA; exception SVN.
- `border-kazakhstan-and-tajikistan`: target(s) KAZ, TJK; matching CHN, KGZ, UZB; exception TKM.
- `border-mozambique-and-zambia`: target(s) MOZ, ZMB; matching MWI, TZA, ZWE; exception NAM.
- `border-namibia-and-zimbabwe`: target(s) NAM, ZWE; matching BWA, ZAF, ZMB; exception AGO.
- `border-south-africa-and-zambia`: target(s) ZAF, ZMB; matching ZWE, MOZ, NAM; exception SWZ.
- `border-brazil-and-chile`: target(s) BRA, CHL; matching ARG, BOL, PER; exception PRY.

## Independent review

The capitals agent independently reviewed the complete draft and found no ambiguous or incorrect predicates. Its suggestions were applied: Lithuania now uses Estonia as the closer distractor; Norway uses Denmark, and Finland uses Estonia. The DRC target prompt spells out the full country name. Validation passed again after these refinements.

Parent review refinement: replaced Botswana with Zimbabwe in the South Africa/Zambia conjunction to avoid dependence on the tiny Kazungula border. Revalidated successfully.


# Third physical geography batch

33 new questions in `/tmp/odd-third-physical.json`, validated against the existing 136 keys and repository country codes. Each has exactly three matching country codes plus one distinct odd country.

Questions use actual river courses (including named international-boundary reaches), physical coastline, explicit latitude lines, or specific mountain/desert features. No answer relies on control of disputed territory. Height thresholds have wide margins and occur in only two questions. The new highest-point-on-an-island criterion is distinct from height or volcanic origin.

## Particular ambiguity checks

- Congo–Angola: FAO explicitly states that the Congo forms the Angola–DRC border before reaching the sea. This does not depend on Cabinda.
- Tigris–Syria: FAO explicitly identifies the short Turkey–Syria border reach. Prompt says through OR ALONG BORDER.
- Pamir: China's UNESCO nomination explicitly places the Pamirs across China, Tajikistan and Afghanistan.
- Namib: ESA explicitly identifies its extent from Angola through Namibia to South Africa.
- Cubango–Okavango: both names included to make the Angolan headwater name clear.
- Great Prespa specifies the larger lake; Little Prespa has shores in only two countries.
- Highest volcano: Mount Fuji, Kilimanjaro and Pico de Orizaba are volcanic. Peru's Huascarán is not a volcano.
- Above 8,000 m: Nepal, China and India each have well-known peaks above the threshold; India qualifies via Kangchenjunga (8,586 m). Bhutan's highest peak is below 8,000 m. Pakistan is omitted to avoid distracting discussion of Kashmir summit territories.
- Above 6,000 m in South America: Argentina, Chile and Peru all qualify by large margins; Brazil's highest point is below 3,000 m.
- Highest point on an island: Spain's Teide (Tenerife), Portugal's Pico (Pico Island), Japan's Fuji (Honshu), versus Germany's Zugspitze on the European mainland.
- Latitude crossings refer to mainland to avoid overseas/island interpretation. No selected country is close to the changing Arctic Circle or tropic boundary.

## Primary-source verification links

### Rivers

- Sava: actual course through Slovenia, Croatia, Serbia: https://www.savacommission.org/en/relief-and-hydrography/2012
- Drava: actual Austria–Slovenia–Croatia course: https://www.icpdr.org/danube-basin/sub-basins/drava-basin
- Prut: Ukraine source, Romania–Moldova boundary: https://www.icpdr.org/publications/focusing-prut-river-basin
- Gambia: FAO explicitly lists Guinea, Senegal, Gambia: https://www.fao.org/4/t0360e/t0360e09.htm ; USAID follows actual course: https://pdf.usaid.gov/pdf_docs/PDAAG774.pdf
- Uruguay: FAO lists Brazil/Argentina/Uruguay and Paraguay river separately lists Brazil/Bolivia/Paraguay/Argentina: https://www.fao.org/4/ad770b/AD770B08.htm
- Paraná: ESA traces Brazil, Paraguay, Argentina: https://www.esa.int/Applications/Observing_the_Earth/Parana_River
- Limpopo: LIMCOM/GWP actual-course description has South Africa–Botswana boundary then Mozambique: https://www.gwp.org/contentassets/7de026b6e424495b93f365323f13373a/gef7-limpopo-future-water-resources-scenarios.pdf
- Cubango–Okavango: FAO explicitly traces Angola/Namibia/Botswana: https://www.fao.org/4/w4347e/w4347e0p.htm ; Botswana government explains local names: https://dailynews.gov.bw/news-detail/38263
- Congo: FAO explicitly describes Congo/DRC boundary and then Angola/DRC boundary before sea: https://www.fao.org/4/w4347e/w4347e0n.htm
- Euphrates/Tigris: FAO Syria profile states Euphrates Turkey→Syria→Iraq and Tigris Turkey/Syria boundary: https://www.fao.org/4/W4356E/w4356e0t.htm ; Oregon State/UNEP hydropolitical atlas describes both actual river courses, including Tigris boundary and Iraq: https://transboundarywaters.ceoas.oregonstate.edu/sites/transboundarywaters.ceoas.oregonstate.edu/files/Database/ResearchProjects/HydropoliticalVul/hydropolitical_AS.pdf
- Salween: United Nations University case study identifies China/Myanmar/Thailand and upstream source: https://digitallibrary.un.org/record/445157/files/pdf9280810383.pdf ; river-monitoring coalition maps actual China–Myanmar course and Thai boundary: https://www.internationalrivers.org/wp-content/uploads/sites/86/2020/07/salween_factsheet_2016.pdf
- Amu Darya: source research explicitly describes Afghanistan/Tajikistan and Afghanistan/Uzbekistan boundary reaches: https://agris.fao.org/search/es/records/65df9d5e4c5aef494fe39017

### Mountains, deserts and Rift

- Dinaric: UNEP-WCMC ecoregion author team lists Croatia/Bosnia/Montenegro: https://www.oneearth.org/ecoregions/dinaric-mountains-mixed-forests/ ; UNESCO Dinaric project: https://www.unesco.org/en/articles/implementation-strategic-action-programme-sap-dinaric-karst-aquifer-system-improving-groundwater
- Greater Caucasus: NASA identifies Russia to north, Georgia south, Azerbaijan southeast: https://science.nasa.gov/earth/earth-observatory/fall-colors-the-caucasus-mountains-35872/
- Atlas: ESA explicitly identifies Morocco/Algeria/Tunisia: https://www.esa.int/ESA_Multimedia/Images/2017/11/Proba-V_images_Atlas_mountains
- Pamir: China's UNESCO submission explicitly China/Tajikistan/Afghanistan: https://whc.unesco.org/en/tentativelists/5535/
- East African Rift: USGS explicitly identifies Ethiopian, Kenyan and northern Tanzanian segments: https://pubs.usgs.gov/of/2010/1083/p/pdf/ofr2010-1083p.pdf
- Arabian Desert: One Earth ecoregion account explicitly Saudi Arabia/Oman/Yemen for the Arabian Sand Desert: https://www.oneearth.org/ecoregions/arabian-sand-desert/
- Namib: ESA explicitly Angola/Namibia/South Africa: https://www.esa.int/Applications/Observing_the_Earth/Earth_from_Space_Dune_45?platform=hootsuite

### Seas, lake and highest points

- Gulf Aden: NOAA/IHO limits explicitly trace Yemen, Somalia, Djibouti coastlines: https://www.ncei.noaa.gov/archive/archive-management-system/OAS/bin/prd/jquery/seaname/details/62
- Gulf Thailand: PEMSEA's ocean-health report identifies Thailand/Cambodia/Vietnam and Malaysia: https://tile.loc.gov/storage-services/service/gdc/gdcovop/2023331201/2023331201.pdf
- Celebes Sea: NOAA/IHO traces Mindanao, Sulawesi and eastern Borneo: https://www.ncei.noaa.gov/archive/archive-management-system/OAS/bin/prd/jquery/seaname/details/126 ; UN toponymy exercise confirms boundaries: https://unstats.un.org/unsd/geoinfo/UNGEGN/docs/_data_ICAcourses/_HtmlModules/_Exercises/E05/E05_01_Answers.html
- Timor Sea: Australian government treaty names Timor-Leste/Australia and their links to Indonesia's existing Timor Sea boundary: https://www.dfat.gov.au/sites/default/files/treaty-maritime-arrangements-australia-timor-leste.pdf
- Great Prespa: Greek government's UNESCO submission explicitly divides the larger lake among Greece/Albania/North Macedonia (then FYROM): https://whc.unesco.org/en/tentativelists/5864
- Teide: Spain official tourism identifies highest point on Tenerife: https://www.spain.info/en/discover-spain/facts-spain-geography-landscape/ ; UNESCO confirms: https://whc.unesco.org/en/list/1258/
- Pico: Portugal geology/energy directorate identifies Portugal's highest point and island location: https://roteirodasminas.dgeg.gov.pt/en/lista-de-pontos/montanha-do-pico-geosite-en-1/
- Pico de Orizaba: Smithsonian explicitly identifies volcano as Mexico's highest point: https://volcano.si.edu/volcano.cfm?vn=341100

The widely known latitude crossings, Fuji/Kilimanjaro/Huascarán identities and mountain-height margins were reviewed geographically; the niche river, range and sea cases have explicit primary support above.

Final sharper distractors: Greater Caucasus uses Armenia (Lesser Caucasus, not Greater); Timor Sea uses Papua New Guinea (Arafura/Coral coastline, no Timor Sea coast); Tropic of Capricorn uses Zambia, whose entire territory is north of 23.4°S.
- Final primary checks for sharper options: Germany's official tourism site identifies Zugspitze as its highest summit in the Bavarian Alps: https://www.germany.travel/en/inspiring-germany/spectacular-views-germany-at-your-feet.html ; ICIMOD identifies Mount Kangchenjunga as 8,586 m in the India/Nepal landscape: https://www.icimod.org/initiative/about-klcdi/ . NASA's Greater Caucasus source above explicitly contrasts Armenia's Lesser Caucasus.
- Definitive India >8,000 m confirmation: UNESCO's Khangchendzonga National Park listing explicitly places the 8,586 m summit in India's Sikkim park: https://whc.unesco.org/en/list/1513


# Third batch: 33 capital/name/flag questions

Content: /tmp/odd-third-capitals.json. Exactly 33 unique new keys; every entry has exactly three distinct positive sovereign-country codes plus a separate fourth odd code. All codes checked against lib/geo/countries.json. All local coordinate/name/region predicates produce true,true,true,false. No exact criterion repeats the current 136-entry bank. There are exactly three name-based questions.

## Review points

- Capital comparisons use capitalLat/capitalLng from local country data. 'East of Tokyo' explicitly excludes crossing the International Date Line; Wellington, Suva and South Tarawa are all between Tokyo and 180 E; Manila is west of Tokyo.
- West-of-Lisbon: Dakar, Monrovia and Bissau qualify, Accra does not. North-of-London: Berlin, Warsaw and Dublin qualify; Prague does not.
- High-altitude question uses city-centre/typical urban elevations, not the maximum elevation of a sprawling municipality. All three positives comfortably exceed 2,000m; Kathmandu is about 1,400m. Bogotá official municipality gives 2,625m rather than the common 2,640m; either value safely qualifies.
- Coastal capitals: Dakar/Conakry/Monrovia versus inland Bamako; Algiers/Tripoli/Beirut versus inland Amman; Stockholm/Helsinki/Tallinn versus Oslo on the Oslofjord, outside the Baltic; Kingston/Port-au-Prince/Santo Domingo versus inland San José. Mediterranean question deliberately excludes Tunis to avoid urban-area versus city-centre shoreline ambiguity.
- The tree question uses Lebanon, Belize and Equatorial Guinea. Equatorial Guinea appears only for its flag; no changing-capital fact is used.
- Flag features count motifs within coats of arms. Lions: Sri Lanka's large lion, Spain's León quarter, Fiji's shield lion. Bhutan's dragon is not a lion. Trees: Lebanese cedar, Belize mahogany, Equatorial Guinea ceiba; Jamaica contains no tree.
- Red/black/green odd is Senegal, not Ghana (Ghana has a black star). White-hoist bands on Bahrain and Qatar have serrated edges but remain vertical white bands.
- Centred-cross question uses Switzerland, Georgia and Dominican Republic; Norway's cross is offset toward the hoist.
- Horizontal blue/white/blue bands need not be plain: Nicaragua and El Salvador include central devices. This differs from the previous plain-horizontal-tricolour question.
- Wide-central-red-band: Costa Rica, Cambodia and North Korea all have a broad red horizontal central band, whereas Thailand has a broad blue central band. This replaces a proposed coat-of-arms criterion to avoid civil/state flag variants.
- No official-language legal claims in this batch, and no Afghanistan/Syria changing flag designs.

## Red-cross correction and singular star clarification

Corrected Norway: it has a BLUE cross outlined in WHITE on a RED field, so it is the odd country. Positives are Iceland, United Kingdom and Australia (red St George cross outlined white within the Union Jack). This is a literal visual criterion, including crosses inside cantons. Source: Australian government explicitly explains white surround of red St George cross: https://www.cpbr.gov.au/oz/flag-union.html ; PM&C also documents the Union Jack on Australian flag: https://www.pmc.gov.au/resources/australian-symbols-booklet/national-symbols/australian-national-flag ; Iceland presidency red-cross/white-outline description: https://www.forseti.is/en/presidency/flag-and-shield .

White-star question now explicitly says 'at least one white star' to cover Somalia's single star along with Australia's and Micronesia's multiple stars. Mali remains the unambiguous inland West Africa distractor; no current capital designation introduced.

## Sources for niche facts

- Fiji foreign ministry, flag lion and shield: https://www.foreignaffairs.gov.fj/fiji-embassy-in-brussels-belgium/fiji-flag/
- Sri Lanka government, flag lion and bo leaves: https://www.gov.lk/sri-lanka/country-overview
- Belize National Institute of Culture and History standardized flag: https://nichbelize.org/belize-flag-2026/
- Belize government national symbols including mahogany tree in flag arms: https://portalclone.azurewebsites.net/Home/NationalSymbols
- Equatorial Guinea embassy, ceiba and six six-pointed stars: https://embajada-guineaecuatorial.com.ve/simbolos-patrios/
- Burundi foreign ministry, diagonal cross and six-pointed stars: https://www.mae.gov.bi/en/national-symbols/
- Cyprus foreign ministry, olive branches below island map: https://www.mfa.gov.cy/mfa/embassies/embassy_ljubljana.nsf/generalinformation_en/generalinformation_en?OpenDocument=&print=
- Quito Ecuador cultural heritage institute, elevation 2,850m: https://www.patrimoniocultural.gob.ec/quito/
- Bogotá municipality, elevation 2,625m: https://bogota.gov.co/en/node/78
- Ethiopian meteorological station at Addis Ababa, elevation 2,354m: https://www.ethiomet.gov.et/stations/4/
- Kathmandu municipality, elevation approximately 1,400m: https://kathmandu.gov.np/en/about-us
- UNESCO, Brasilia created as capital: https://whc.unesco.org/en/list/445
- Canberra National Capital Authority, formal planned capital: https://www.nca.gov.au/national-capital-plan
- Islamabad Capital Development Authority, master-plan background: https://cda.gov.pk/aboutIslamabad



