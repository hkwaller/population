# 100-question Odd one out expansion

Added 100 questions to the existing 36, using the same approved explicit-criterion format. Country codes and four distinct options are validated during generation. Existing questions and other categories must remain unchanged.

Three authoring batches were cross-reviewed. Final editorial changes: Vietnam replaces Nepal for the solid-disc flag question; Switzerland is the Nordic-cross exception; New Zealand (four stars) is the five-star exception; Sri Lanka (lion) is the bird exception. Physical distractors strengthened to South Africa (Zambezi), Austria (Tisza), Slovenia (Carpathians) and Mozambique (Kalahari).

# Factual review: 34 new odd-one-out questions

Validated automatically against `lib/geo/countries.json`: all 136 country-code uses exist; every question has three distinct matching codes and one distinct odd code; all keys and question texts are new relative to `scripts/gen/odd-one-out.json`.

Difficulty distribution: 10 easy (<0.5), 16 medium (0.5 through <0.72), 8 hard (>=0.72). Ratings are editorial estimates.

## Local assertion checks

- `border-mainland-france`: ESP, BEL, CHE are in FRA.borders; AUT is absent.
- `border-italy`: FRA, AUT, SVN are in ITA.borders; HRV is absent.
- `border-poland`: DEU, LTU, SVK are in POL.borders; HUN is absent.
- `border-turkey`: GRC, BGR, GEO are in TUR.borders; LBN is absent.
- `border-india`: PAK, NPL, BGD are in IND.borders; THA is absent.
- `border-thailand`: MMR, LAO, KHM are in THA.borders; VNM is absent.
- `border-vietnam`: CHN, LAO, KHM are in VNM.borders; THA is absent.
- `border-argentina`: CHL, BOL, PRY are in ARG.borders; PER is absent.
- `border-bolivia`: PER, CHL, PRY are in BOL.borders; ECU is absent.
- `border-peru`: ECU, BOL, BRA are in PER.borders; VEN is absent.
- `border-colombia`: PAN, ECU, VEN are in COL.borders; BOL is absent.
- `border-mexico`: USA, GTM, BLZ are in MEX.borders; HND is absent.
- `border-guatemala`: MEX, BLZ, SLV are in GTM.borders; NIC is absent.
- `border-kenya`: ETH, UGA, TZA are in KEN.borders; RWA is absent.
- `border-ethiopia`: KEN, DJI, ERI are in ETH.borders; UGA is absent.
- `border-zambia`: AGO, MWI, MOZ are in ZMB.borders; UGA is absent.
- `border-tanzania`: RWA, BDI, MWI are in TZA.borders; ZWE is absent.
- `border-algeria`: TUN, LBY, NER are in DZA.borders; EGY is absent.
- `border-sudan`: EGY, TCD, ETH are in SDN.borders; DJI is absent.
- `border-iran`: IRQ, ARM, TKM are in IRN.borders; JOR is absent.
- `border-afghanistan`: TJK, UZB, TKM are in AFG.borders; KGZ is absent.
- `border-romania`: UKR, BGR, SRB are in ROU.borders; SVN is absent.
- `border-hungary`: AUT, ROU, SVK are in HUN.borders; BGR is absent.
- `border-laos`: CHN, MMR, KHM are in LAO.borders; MYS is absent.
- `border-cameroon`: NGA, GAB, TCD are in CMR.borders; BEN is absent.
- `border-france-and-germany`: checked both target codes in each option's borders; odd fails the conjunction.
- `border-china-and-india`: checked both target codes in each option's borders; odd fails the conjunction.
- `border-brazil-and-argentina`: checked both target codes in each option's borders; odd fails the conjunction.
- `africa-no-land-borders`: border counts MDG=0, MUS=0, SYC=0, GMB=1.
- `exactly-two-land-neighbours`: border counts MNG=2, SWE=2, BTN=2, PAK=4.
- `at-least-six-land-neighbours`: border counts DEU=9, ZMB=8, TZA=8, GHA=3.

## Geography checks and caveats

- France question explicitly limits the target to mainland France in Europe. All three positive options border metropolitan mainland France; no overseas territory is used. Austria has no French border anywhere.
- Afghanistan uses only Tajikistan, Uzbekistan and Turkmenistan as positives, avoiding contested India/Afghanistan interpretations. Iran uses Iraq, Armenia and Turkmenistan, avoiding Azerbaijan enclave questions. Algeria uses Tunisia, Libya and Niger, avoiding Western Sahara. Sudan uses Egypt, Chad and Ethiopia: the existence of these country-to-country borders is not in doubt; the question does not ask about the position of any disputed line.
- Asian landlocked options Mongolia, Nepal and Bhutan have no sea coast; Vietnam has an extensive sea coast. This is a literal landlocked criterion and does not depend on country centroid coordinates.
- The no-land-borders question checks border arrays directly: Madagascar, Mauritius and Seychelles have no land borders; Gambia borders Senegal. No island status is inferred from the absence of borders.
- Lesotho is entirely enclosed by South Africa; San Marino and Vatican City are entirely enclosed by Italy. Local border arrays confirm one neighbour for each. Andorra borders both France and Spain and is not enclosed by a single other country.
- The six-neighbours question has DEU=9, ZMB=8, TZA=8 and GHA=3 in local data. None of these counts relies on overseas departments, dependencies or disputed states.
- Pacific-and-Caribbean question deliberately names the Caribbean Sea, avoiding an ambiguity about whether marginal seas count as Atlantic coast. Mexico, Guatemala and Colombia each have mainland coastlines on both bodies of water; Peru has Pacific coast only. Guatemala's two fronts are described by the Guatemala Maritime Administration: https://guatadmin.org/country-profile/ . The CIA's primary Central America physical map also confirms Mexico/Guatemala Caribbean and Pacific frontage: https://www.cia.gov/the-world-factbook/static/c0e0198c123b78e404c04b3b742113e1/central_america_phy.pdf . These straightforward geography facts were manually reviewed; the local JSON does not encode coastline bodies.
- Questions about border conjunctions explicitly state BOTH named countries, so players do not need to infer the relationship. Nepal/Bhutan/Myanmar border both China and India; Bangladesh borders India but not China. Bolivia/Paraguay/Uruguay border both Brazil and Argentina; Peru borders Brazil but not Argentina. Belgium/Luxembourg/Switzerland border both France and Germany; Austria borders Germany but not France.

No application files were edited.


# Physical geography question review

33 questions in `/tmp/odd-more-physical.json`. Validated all cca3 codes against the repository's country data, four distinct options per question, no repeated keys from the existing 36. Difficulty mix is 10 easy (<.5), 15 medium (.5–.71), 8 hard (>=.72).

## Editorial decisions

- Every question names its criterion. Rivers mean the named river's actual course, including an international boundary; they never mean the catchment basin.
- The Senegal matching countries are Mali, Mauritania and Senegal. Guinea is not used as an odd choice because the Bafing headwater is there and textbooks sometimes count the full river system.
- Orange-Senqu explicitly includes the name used for its Lesotho section. Botswana is in the basin, but the river itself does not flow through Botswana.
- Lake Constance and Lake Malawi ask about shorelines. Their water jurisdiction issues do not affect which countries physically have shores.
- South China Sea asks coastline only; no disputed offshore island or maritime claim is needed.
- The three ocean coastline questions are distinct criteria, not variants of any existing bank question. Border agent was notified to avoid these criteria.

## Primary-source checks

- Gulf of Finland: HELCOM explicitly lists Finnish, Estonian and Russian coastal waters: https://helcom.fi/wp-content/uploads/2024/10/Status-of-coastal-fish-communities.pdf
- Gulf of Guinea: IOM regional primary report covers Ghana, Benin and Togo: https://dtm.iom.int/sites/g/files/tmzbdl1461/files/reports/Pays%20Cotiers%20-%20aper%C3%A7u-EN%20FINAL.pdf
- Andaman Sea: UN treaty repository includes India/Myanmar, Myanmar/Thailand and three-country Andaman agreements: https://www.un.org/Depts/los/LEGISLATIONANDTREATIES/STATEFILES/MMR.htm
- Arabian Sea: NOAA sea limits explicitly trace Pakistan, India and Oman coasts: https://www.ncei.noaa.gov/archive/archive-management-system/OAS/bin/prd/jquery/seaname/details/36
- Persian Gulf: FAO names Kuwait, Bahrain and Qatar among the bordering countries: https://www.fao.org/4/x8468e/x8468e13.pdf
- South China Sea: ASEAN directly identifies bordering Vietnam, Malaysia and Philippines: https://asean.org/our-communities/asean-political-security-community/peaceful-secure-and-stable-region/situation-in-the-south-china-sea/overview/
- Ionian Sea: EU Maritime Spatial Planning Platform identifies Italy/Greece; Albania's well-established Ionian shore corroborated by its tourism material: https://maritime-spatial-planning.ec.europa.eu/sea-basins/east-mediterranean and https://www.albania1912.com/en/ion-coast/
- Coral Sea: Australian government describes sea flanked by Australia, Papua New Guinea and Solomon Islands: https://www.pngremembrancetrail.gov.au/location/coral-sea
- Tanganyika: ESA explicitly lists Burundi, DRC, Tanzania and Zambia: https://www.esa.int/Applications/Observing_the_Earth/Earth_from_Space_Lakes_of_Africa
- Malawi/Nyasa: ESA explicitly places Malawi, Tanzania and Mozambique at its shores: https://www.esa.int/ESA_Multimedia/Images/2010/10/Lake_Malawi_Great_Rift_Valley ; FAO confirms Tanzania's shoreline despite water jurisdiction issue: https://www.fao.org/4/t0473e/T0473E06.htm
- Constance: Swiss national mapping agency identifies Switzerland, Germany and Austria as three riparian states: https://www.swisstopo.admin.ch/en/artificial-and-natural-boundaries
- Rhine: ICPR convention identifies France, Germany and Netherlands: https://www.iksr.org/en/icpr/legal-basis/convention/
- Mekong: MRC explicitly states actual river flows through Laos, Cambodia, Vietnam and three other countries: https://www.mrcmekong.org/mekong-river-basin/
- Niger: FAO follows course from Guinea through Mali to Niger: https://www.fao.org/4/w4347e/w4347e0i.htm
- Zambezi: river authority source in Zambia/mouth Mozambique, Zimbabwe national parks authority transboundary valley descriptions: https://www.zambezira.org/node/16 and https://www.zimparks.org.zw/transfrontier-conservation-affairs/
- Senegal: FAO main-course description confirms Mali followed by Senegal/Mauritania border; upstream Guinea reaches are tributaries: https://www.fao.org/4/W4347E/w4347e0h.htm
- Orange-Senqu: ORASECOM distinguishes Senqu in Lesotho, middle/lower Orange in South Africa and Namibia border, and separate Molopo/Nossob tributaries in Botswana: https://orasecom.org/wp-content/uploads/2020/05/1951Goods-and-Services-Report-WP5_010_2010.pdf
- Dnieper: UNDP explicitly states river flows across Russia, Belarus and Ukraine: https://www.undp.org/sites/g/files/zskgke326/files/migration/by/UNDP_Belarus.pdf
- Oder: German environment project body identifies Czech Republic, Poland and Germany sharing actual river; government source confirms river border: https://www.z-u-g.org/en/eureni/projects/gemeinsam-fuer-die-oder/ and https://www.germany.travel/en/nature-outdoor-activities/oder-neisse-cycle-route.html
- Tisza: ICPDR actual-course segments and Serbia's waterways authority confirm Ukraine, Hungary, Serbia: https://www.icpdr.org/danube-basin/sub-basins/tisza-basin?page=1 and https://www.plovput.gov.rs/international-waterways
- Carpathians: Polish government describes range countries including Poland, Slovakia and Romania: https://www.gov.pl/web/europeofthecarpathians/europe-of-the-carpathians
- Altai: Mongolia's UNESCO submission explicitly identifies Mongolian, Russian and Chinese Altai: https://whc.unesco.org/en/tentativelists/5955/
- Tian Shan: UNEP-WCMC describes actual range through China, Kyrgyzstan, Kazakhstan and Uzbekistan: https://world-heritage-datasheets.unep-wcmc.org/datasheet/output/site/xinjiang-tianshan/
- Kalahari: Botswana's national tourism organisation explicitly places desert in Botswana, Namibia, South Africa: https://botswanatourism.co.bw/index.php/explore/kalahari-desert

Common ocean coastlines and familiar Caribbean, Black Sea, Adriatic, Bay of Bengal and Gulf of Mexico coastline facts were reviewed against standard geographic knowledge; no uncertain borderline coastline was selected. Only established sovereign country codes are used, and no answer depends on sovereignty over disputed territory.


# Review of 33 additional capital, language, and flag questions

Validated 33 rows with four distinct valid cca3 codes per row: exactly three matching codes and a separate odd code. Difficulty distribution is 10 easy (<0.5), 15 medium (0.5–<0.72), 8 hard (>=0.72). Compared keys and question criteria with existing scripts/gen/odd-one-out.json. No existing criterion is repeated; the mainland-Asia question is a specifically Asian counterpart to the existing European mainland question.

## Local machine checks

Capital coordinates, country names, capital names, regions and subregions were checked against lib/geo/countries.json. For every computable predicate, results were [true,true,true,false]. The references for New York City (40.7128,-74.0060) and Sydney (-33.8688,151.2093) are standard city-centre coordinates; all answer cities have comfortable margins beyond small variations in city-centre choice. Southern tropics excludes the Equator and Tropic boundary; no selected city lies near either boundary.

English-name questions use the exact names displayed in local country data. Djibouti, Luxembourg, Singapore match their capitals. The 'City' question uses Mexico City, Guatemala City and Panama City versus San José. This batch contains only three wording/name-based questions.

## Flag and legal checks

Simple flag features were reviewed against standard current national flag designs. These use literal visual criteria (colours, stripes, discs, stars, birds) rather than conjectured symbolism. Flags with recent disputed or changing designs are excluded. Coats of arms count as part of the flag; the exclusive-colour rows deliberately use flags without coats of arms. The rayed-sun and Southern Cross entries have explicit official descriptions below. The flag of Nepal has moon/sun emblems rather than the large solid disc used by Japan, Bangladesh and Palau.

The source data's languages array was not treated as legal proof of official status. German and Arabic sets were checked with government or legislative sources. Dutch is the Netherlands' administrative language; Iran's official language is Persian, not Arabic. Neither negative choice has German/Arabic as a national official language.

## Primary-source references

- Australian national flag, Southern Cross and Union Jack: https://www.pmc.gov.au/resources/australian-symbols-booklet/national-symbols/australian-national-flag
- New Zealand ministry flag description (Union Jack, Southern Cross): https://www.mch.govt.nz/our-work/flags-anthems-and-emblems/new-zealand-flag
- Papua New Guinea embassy flag description (Bird of Paradise, Southern Cross): https://www.pngembassy.org/flag.html
- Argentina official flag description (32-rayed sun): https://www.argentina.gob.ar/pais/simbolos/bandera
- Uruguay embassy national symbols (rayed sun): https://www.embajadadeuruguay.org/pages/acerca-de-uruguay/simbolos-patrios.php
- Philippines Supreme Court implementing flag rules (eight-rayed sun, stars): https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/10/40780
- Sri Lanka government national flag description (lion and sword): https://www.gov.lk/sri-lanka/country-overview
- Mozambique foreign ministry flag description (weapon crossed with hoe): https://minec.gov.mz/simbolos-nacionais/
- Saudi Press Agency flag description (sword): https://spa.gov.sa/en/N2063157
- Zambia presidency flag description (African Fish Eagle): https://www.sh.gov.zm/national-symbols/
- Albania official embassy national symbols (double-headed eagle): https://ambasadat.gov.al/unesco/en/simbolet-kombetare/
- Mexico government national symbol description (eagle on flag): https://www.gob.mx/conanp/articulos/el-aguila-real-un-simbolo-de-identidad-nacional?idiom=es
- Germany administrative law section 23 (German): https://www.gesetze-im-internet.de/vwvfg/VwVfG.pdf
- Austrian constitution article 8 (German): https://www.ris.bka.gv.at/eli/bgbl/1930/1/A8/NOR40066723
- Swiss Languages Act implementing article 70 (German official): https://www.fedlex.admin.ch/eli/cc/2009/821/en
- Egypt State Information Service (Arabic official): https://africa.sis.gov.eg/english/egypt/basic-information/
- Moroccan National Tourist Office (Arabic and Amazigh official): https://www.visitmorocco.com/en/useful-information/language
- Jordan government (Arabic official): https://jiacc.gov.jo/EN/Pages/About_Jordan



