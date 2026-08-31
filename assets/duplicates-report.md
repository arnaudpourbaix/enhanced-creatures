# bg1 / bg2 creature conflicts

177 file(s) exist in both bg1 and bg2 but differ (case-insensitively) on a column other than `origin`.

Full rows: bg1-duplicates.csv / bg2-duplicates.csv.

## Level differences (44)

| file     | creature                      | bg1 | bg2 | Δ   |
| -------- | ----------------------------- | --- | --- | --- |
| WISH01   | Dao / Djinni                  | 8   | 25  | +17 |
| SWAAIR02 | Air Elemental                 | 12  | 24  | +12 |
| SWAEAR02 | Earth Elemental               | 12  | 24  | +12 |
| SWAFIR02 | Fire Elemental                | 12  | 24  | +12 |
| XZAR     | Xzar                          | 1   | 13  | +12 |
| DEMPIT01 | Pit Fiend                     | 13  | 24  | +11 |
| DEMOSUM2 | Balor                         | 14  | 24  | +10 |
| TAZOK    | Tazok                         | 9   | 19  | +10 |
| ORC03    | Orc Priest                    | 3   | 12  | +9  |
| TELALU1  | Alu-Fiend                     | 20  | 12  | -8  |
| DEMOSUM3 | Glabrezu                      | 10  | 17  | +7  |
| EFREETSU | Efreeti                       | 5   | 12  | +7  |
| ORC04    | Orc Leader / Orc Mage         | 5   | 12  | +7  |
| DEMOSUM1 | Marilith                      | 14  | 20  | +6  |
| DEMSUC01 | Succubus                      | 6   | 12  | +6  |
| DJINNISU | Djinni                        | 5   | 11  | +6  |
| SPIDFGSU | Kitthix                       | 2   | 8   | +6  |
| DEMPITSU | Pit Fiend                     | 20  | 24  | +4  |
| GORF     | Gorf / Gorf the Squisher      | 9   | 5   | -4  |
| MINDFL01 | Mind Flayer                   | 8   | 12  | +4  |
| SPIDSM01 | Small Spider                  | 1   | 5   | +4  |
| SUMDJINN | Djinni                        | 7   | 11  | +4  |
| SWAAIR01 | Air Elemental                 | 12  | 16  | +4  |
| SWAEAR01 | Earth Elemental               | 12  | 16  | +4  |
| SWAFIR01 | Fire Elemental                | 12  | 16  | +4  |
| CATLIOWP | Joolon                        | 5   | 8   | +3  |
| HOBGOBSU | Hobgoblin Elite               | 1   | 4   | +3  |
| DEMGLASU | Glabrezu                      | 15  | 17  | +2  |
| DEMNABSU | Nabassu                       | 10  | 12  | +2  |
| DOGWISU  | Wild Dog / Rabid Dog          | 1   | 3   | +2  |
| KOBOLDSU | Kobold Commando               | 1   | 3   | +2  |
| ORC02    | Orc Archer                    | 3   | 5   | +2  |
| SUMEFREE | Efreeti                       | 10  | 12  | +2  |
| TASLOISU | Tasloi / Tasloi Elite Trooper | 1   | 3   | +2  |
| TROLL01  | Troll                         | 6   | 8   | +2  |
| XVARTSU  | Xvart / Xvart Protector       | 1   | 3   | +2  |
| BASILGSU | Greater Basilisk              | 10  | 9   | -1  |
| BASILLSU | Lesser Basilisk               | 6   | 7   | +1  |
| ORC01    | Orc Warrior / Orc             | 3   | 4   | +1  |
| ORC05    | Orc Shaman / Orog             | 6   | 5   | -1  |
| ORC06    | Orc Raider / Orog             | 4   | 5   | +1  |
| SKELWA   | Skeleton Warrior              | 9   | 10  | +1  |
| TROLFR01 | Freshwater Troll              | 5   | 6   | +1  |
| TROLSP01 | Spectral Troll                | 8   | 9   | +1  |

## Origin differences (171)

| bg1        | bg2 | files |
| ---------- | --- | ----- |
| bg1        | bg2 | 161   |
| NTOTSC     | bg2 | 8     |
| ac_quest   | bg2 | 1     |
| stratagems | bg2 | 1     |

### Files where a mod touched one side (10)

| file     | creature                                                   | bg1        | bg2 |
| -------- | ---------------------------------------------------------- | ---------- | --- |
| GHASTF01 | Fell Ghast                                                 | NTOTSC     | bg2 |
| GOLSTO01 | I am quite sure that the membership of a thieves' guild w… | stratagems | bg2 |
| HGSAL01  | Fire Salamander / Salamander                               | NTOTSC     | bg2 |
| SHADOW01 | Shadow Warrior / Shadow                                    | NTOTSC     | bg2 |
| SKELAR01 | Skeleton Archer                                            | NTOTSC     | bg2 |
| SKELAR02 | Skeleton Archer                                            | ac_quest   | bg2 |
| SKELWA01 | Skeleton Warrior                                           | NTOTSC     | bg2 |
| SPIDWR01 | Wraith Spider                                              | NTOTSC     | bg2 |
| VAMFLF01 | Fledgling Vampire                                          | NTOTSC     | bg2 |
| ZOMBJU01 | Zombie                                                     | NTOTSC     | bg2 |

## Overview

| file     | creature                                                   | #   | differing columns                                                                                                                       |
| -------- | ---------------------------------------------------------- | --- | --------------------------------------------------------------------------------------------------------------------------------------- |
| ORC06    | Orc Raider / Orog                                          | 13  | class, anim, dialog, level, overrideScript, classScript, generalScript, defaultScript, lring, weapon1, weapon2, xpv, name               |
| VAMFLM01 | Fledgling Vampire                                          | 13  | class, deathvar, dialog, overrideScript, classScript, raceScript, generalScript, defaultScript, lring, rring, weapon2, weapon3, weapon4 |
| ORC05    | Orc Shaman / Orog                                          | 12  | class, anim, dialog, level, overrideScript, classScript, generalScript, defaultScript, helmet, weapon1, xpv, name                       |
| GORF     | Gorf / Gorf the Squisher                                   | 11  | general, class, anim, dialog, level, gender, overrideScript, defaultScript, weapon1, xpv, name                                          |
| ORC01    | Orc Warrior / Orc                                          | 11  | class, dialog, level, overrideScript, classScript, generalScript, defaultScript, weapon1, weapon2, xpv, name                            |
| ORC02    | Orc Archer                                                 | 11  | class, anim, level, overrideScript, classScript, generalScript, defaultScript, helmet, weapon1, weapon2, xpv                            |
| SPIDSM01 | Small Spider                                               | 11  | class, deathvar, level, gender, overrideScript, classScript, raceScript, generalScript, defaultScript, weapon1, xpv                     |
| XZAR     | Xzar                                                       | 11  | deathvar, dialog, level, overrideScript, classScript, raceScript, generalScript, defaultScript, helmet, weapon1, xpv                    |
| ORC04    | Orc Leader / Orc Mage                                      | 10  | class, anim, level, overrideScript, classScript, raceScript, defaultScript, weapon1, xpv, name                                          |
| TASLOISU | Tasloi / Tasloi Elite Trooper                              | 10  | level, sex, allegiance, overrideScript, classScript, defaultScript, helmet, weapon2, xpv, name                                          |
| TAZOK    | Tazok                                                      | 9   | level, allegiance, overrideScript, classScript, defaultScript, helmet, amulet, weapon1, xpv                                             |
| TROLSP01 | Spectral Troll                                             | 9   | general, level, overrideScript, classScript, raceScript, generalScript, defaultScript, amulet, xpv                                      |
| VAMFLF01 | Fledgling Vampire                                          | 9   | class, generalScript, defaultScript, lring, rring, weapon2, weapon3, weapon4, xpv                                                       |
| CATLIOWP | Joolon                                                     | 8   | level, sex, allegiance, defaultScript, lring, rring, weapon1, xpv                                                                       |
| ORC03    | Orc Priest                                                 | 8   | level, overrideScript, classScript, generalScript, defaultScript, weapon1, weapon2, xpv                                                 |
| XVARTSU  | Xvart / Xvart Protector                                    | 8   | level, sex, allegiance, overrideScript, defaultScript, helmet, xpv, name                                                                |
| MEPMAG01 | Magma Mephit                                               | 7   | deathvar, gender, overrideScript, classScript, raceScript, generalScript, defaultScript                                                 |
| PETTIN   | Ettin                                                      | 7   | dialog, overrideScript, classScript, raceScript, generalScript, defaultScript, weapon1                                                  |
| PLANWISH | Fallen Planetar                                            | 7   | general, anim, gender, sex, overrideScript, defaultScript, helmet                                                                       |
| TROLFR01 | Freshwater Troll                                           | 7   | level, overrideScript, classScript, raceScript, generalScript, defaultScript, amulet                                                    |
| TROLL01  | Troll                                                      | 7   | level, overrideScript, classScript, raceScript, generalScript, defaultScript, amulet                                                    |
| WISH01   | Dao / Djinni                                               | 7   | deathvar, level, generalScript, defaultScript, rring, xpv, name                                                                         |
| CATJAG01 | Panther                                                    | 6   | deathvar, allegiance, overrideScript, classScript, generalScript, defaultScript                                                         |
| CATLIM01 | Mountain Lion                                              | 6   | deathvar, allegiance, overrideScript, classScript, generalScript, defaultScript                                                         |
| DEMPIT01 | Pit Fiend                                                  | 6   | anim, level, gender, overrideScript, classScript, defaultScript                                                                         |
| GHOULSU  | Ghoul                                                      | 6   | gender, sex, allegiance, raceScript, defaultScript, xpv                                                                                 |
| HOBGOBSU | Hobgoblin Elite                                            | 6   | dialog, level, sex, overrideScript, raceScript, defaultScript                                                                           |
| KOBOLDSU | Kobold Commando                                            | 6   | level, sex, overrideScript, raceScript, defaultScript, helmet                                                                           |
| SKELWA   | Skeleton Warrior                                           | 6   | anim, level, overrideScript, classScript, defaultScript, lring                                                                          |
| SKELWA02 | Skeleton Warrior                                           | 6   | anim, overrideScript, classScript, defaultScript, lring, rring                                                                          |
| BEARBRSU | Brown Bear                                                 | 5   | sex, overrideScript, raceScript, defaultScript, weapon1                                                                                 |
| DJINNISU | Djinni                                                     | 5   | level, gender, sex, overrideScript, lring                                                                                               |
| EFREETSU | Efreeti                                                    | 5   | anim, level, gender, sex, defaultScript                                                                                                 |
| IGIBBER  | Gibberling                                                 | 5   | deathvar, overrideScript, defaultScript, amulet, weapon1                                                                                |
| JELLMUSU | Mustard Jelly                                              | 5   | sex, overrideScript, defaultScript, weapon2, xpv                                                                                        |
| SHADOW01 | Shadow Warrior / Shadow                                    | 5   | anim, overrideScript, raceScript, defaultScript, name                                                                                   |
| SKELWA03 | Skeleton Warrior                                           | 5   | anim, overrideScript, defaultScript, lring, rring                                                                                       |
| SPIDFGSU | Kitthix                                                    | 5   | class, anim, level, sex, defaultScript                                                                                                  |
| SUMEFREE | Efreeti                                                    | 5   | anim, level, gender, defaultScript, xpv                                                                                                 |
| BASILGSU | Greater Basilisk                                           | 4   | level, sex, overrideScript, xpv                                                                                                         |
| BASILLSU | Lesser Basilisk                                            | 4   | level, sex, overrideScript, xpv                                                                                                         |
| BEARBL   | Black Bear                                                 | 4   | deathvar, overrideScript, generalScript, defaultScript                                                                                  |
| BEARBLSU | Black Bear                                                 | 4   | sex, overrideScript, raceScript, defaultScript                                                                                          |
| DEMNABSU | Nabassu                                                    | 4   | anim, level, sex, defaultScript                                                                                                         |
| DOGWISU  | Wild Dog / Rabid Dog                                       | 4   | level, sex, overrideScript, name                                                                                                        |
| ELEARG01 | Greater Earth Elemental                                    | 4   | gender, sex, defaultScript, xpv                                                                                                         |
| ELEARPR2 | Greater Earth Elemental / Earth Elemental                  | 4   | general, sex, overrideScript, name                                                                                                      |
| ELEARPR3 | Elder Earth Elemental / Earth Elemental                    | 4   | general, sex, overrideScript, name                                                                                                      |
| HGSAL01  | Fire Salamander / Salamander                               | 4   | race, class, defaultScript, name                                                                                                        |
| SCHLUM   | Schlumpsha the Sewer King                                  | 4   | class, overrideScript, defaultScript, weapon2                                                                                           |
| SHAWOL01 | Shade Wolf                                                 | 4   | gender, overrideScript, generalScript, defaultScript                                                                                    |
| SUMDJINN | Djinni                                                     | 4   | level, gender, lring, xpv                                                                                                               |
| TOMEGOL4 | Juggernaut Golem                                           | 4   | anim, lring, weapon1, xpv                                                                                                               |
| WOLFDI   | Dire Wolf                                                  | 4   | deathvar, overrideScript, generalScript, defaultScript                                                                                  |
| BEARBR   | Brown Bear                                                 | 3   | overrideScript, generalScript, defaultScript                                                                                            |
| CARRIO   | Carrion Crawler                                            | 3   | deathvar, overrideScript, xpv                                                                                                           |
| DECK615  | Demon Knight                                               | 3   | gender, defaultScript, lring                                                                                                            |
| DEMOSUM1 | Marilith                                                   | 3   | level, shield, amulet                                                                                                                   |
| DEMOSUM2 | Balor                                                      | 3   | level, gender, shield                                                                                                                   |
| DEMPITSU | Pit Fiend                                                  | 3   | anim, level, overrideScript                                                                                                             |
| DW-ICE12 | Ice Paraelemental                                          | 3   | general, sex, classScript                                                                                                               |
| DW-ICE16 | Greater Ice Paraelemental                                  | 3   | general, sex, classScript                                                                                                               |
| DW-ICE24 | Elder Ice Paraelemental                                    | 3   | general, sex, classScript                                                                                                               |
| ELEARPR  | Earth Elemental                                            | 3   | general, sex, overrideScript                                                                                                            |
| ELEARSU4 | Elder Earth Elemental / Earth Elemental                    | 3   | general, sex, name                                                                                                                      |
| ELEARSUW | Lesser Earth Elemental / Earth Elemental                   | 3   | general, sex, name                                                                                                                      |
| ELFIRPR2 | Greater Fire Elemental / Fire Elemental                    | 3   | sex, overrideScript, name                                                                                                               |
| ELFIRPR3 | Elder Fire Elemental / Fire Elemental                      | 3   | sex, overrideScript, name                                                                                                               |
| JELLGR   | Gray Ooze                                                  | 3   | class, defaultScript, weapon2                                                                                                           |
| MEPEAR01 | Earth Mephit                                               | 3   | raceScript, generalScript, defaultScript                                                                                                |
| OTYUGH   | Otyugh                                                     | 3   | overrideScript, raceScript, defaultScript                                                                                               |
| WOLFDISU | Dire Wolf                                                  | 3   | sex, overrideScript, weapon1                                                                                                            |
| WOLFWISU | Winter Wolf                                                | 3   | sex, overrideScript, xpv                                                                                                                |
| BEHOLD01 | Beholder                                                   | 2   | defaultScript, lring                                                                                                                    |
| BJORNI   | Bjornin                                                    | 2   | overrideScript, defaultScript                                                                                                           |
| CARRIOSU | Mutated Crawler                                            | 2   | sex, overrideScript                                                                                                                     |
| DEMGLASU | Glabrezu                                                   | 2   | level, overrideScript                                                                                                                   |
| DEMOSUM3 | Glabrezu                                                   | 2   | level, gender                                                                                                                           |
| DEMOSUM4 | Cambion                                                    | 2   | defaultScript, lring                                                                                                                    |
| ELAIRSUW | Air Elemental                                              | 2   | general, sex                                                                                                                            |
| ELFIRPR  | Fire Elemental                                             | 2   | sex, overrideScript                                                                                                                     |
| ELFIRSU4 | Elder Fire Elemental / Fire Elemental                      | 2   | sex, name                                                                                                                               |
| ELFIRSUW | Lesser Fire Elemental / Fire Elemental                     | 2   | sex, name                                                                                                                               |
| GOLSTO01 | I am quite sure that the membership of a thieves' guild w… | 2   | defaultScript, name                                                                                                                     |
| ICMYC01  | Myconid                                                    | 2   | gender, defaultScript                                                                                                                   |
| JELLYGR  | Green Slime                                                | 2   | class, defaultScript                                                                                                                    |
| JONDALW  | Jondal                                                     | 2   | class, defaultScript                                                                                                                    |
| KOBCAP01 | Kobold Captain                                             | 2   | class, defaultScript                                                                                                                    |
| MINDFL01 | Mind Flayer                                                | 2   | level, defaultScript                                                                                                                    |
| PLYOGRE  | Ogre                                                       | 2   | gender, sex                                                                                                                             |
| PLYSALA  | Fire Salamander / Salamander                               | 2   | gender, name                                                                                                                            |
| PLYSPID2 | Giant Spider                                               | 2   | deathvar, defaultScript                                                                                                                 |
| PPDJINN  | Genie                                                      | 2   | defaultScript, weapon1                                                                                                                  |
| SKELAR02 | Skeleton Archer                                            | 2   | gender, defaultScript                                                                                                                   |
| SKELWA01 | Skeleton Warrior                                           | 2   | overrideScript, defaultScript                                                                                                           |
| SLAYSH01 | Slayer Shadow                                              | 2   | gender, overrideScript                                                                                                                  |
| SPIDSW01 | Sword Spider                                               | 2   | overrideScript, defaultScript                                                                                                           |
| SPIDWR01 | Wraith Spider                                              | 2   | overrideScript, defaultScript                                                                                                           |
| SWAAIR01 | Air Elemental                                              | 2   | general, level                                                                                                                          |
| SWAAIR02 | Air Elemental                                              | 2   | general, level                                                                                                                          |
| SWAEAR01 | Earth Elemental                                            | 2   | general, level                                                                                                                          |
| SWAEAR02 | Earth Elemental                                            | 2   | general, level                                                                                                                          |
| SWAFIR02 | Fire Elemental                                             | 2   | general, level                                                                                                                          |
| TELALU1  | Alu-Fiend                                                  | 2   | level, weapon1                                                                                                                          |
| TELICESA | Ice Salamander / Frost Salamander                          | 2   | defaultScript, name                                                                                                                     |
| TTKOB    | Kobold                                                     | 2   | defaultScript, weapon1                                                                                                                  |
| WEREGRDR | Greater Werewolf                                           | 2   | overrideScript, lring                                                                                                                   |
| WEREWO01 | Werewolf                                                   | 2   | overrideScript, defaultScript                                                                                                           |
| WISH02   | Djinni                                                     | 2   | gender, xpv                                                                                                                             |
| WOLFGR01 | Greater Wolfwere                                           | 2   | overrideScript, defaultScript                                                                                                           |
| WOLFWE01 | Wolfwere                                                   | 2   | overrideScript, defaultScript                                                                                                           |
| WOLFWWSU | Winter Wolf                                                | 2   | sex, overrideScript                                                                                                                     |
| WORGSU   | Worg                                                       | 2   | sex, overrideScript                                                                                                                     |
| BALOR01  | Balor                                                      | 1   | defaultScript                                                                                                                           |
| CATLIOSU | Lion                                                       | 1   | sex                                                                                                                                     |
| DECK622  | Death Shade                                                | 1   | defaultScript                                                                                                                           |
| DECKFELE | Fire Elemental                                             | 1   | defaultScript                                                                                                                           |
| DEMSUC01 | Succubus                                                   | 1   | level                                                                                                                                   |
| DW#WATE3 | But no, this is nothing I can give you. Neither as a rewa… | 1   | name                                                                                                                                    |
| ETTERCSU | Ettercap                                                   | 1   | overrideScript                                                                                                                          |
| GHASTF01 | Fell Ghast                                                 | 1   | defaultScript                                                                                                                           |
| GHASTSU  | Skeleton                                                   | 1   | sex                                                                                                                                     |
| GLOBSHAM | Shambling Mound                                            | 1   | general                                                                                                                                 |
| JELLMU   | Mustard Jelly                                              | 1   | defaultScript                                                                                                                           |
| JELLOC   | Ochre Jelly                                                | 1   | defaultScript                                                                                                                           |
| JONDAL3  | Jondalar                                                   | 1   | defaultScript                                                                                                                           |
| MISTPO01 | Poison Mist                                                | 1   | defaultScript                                                                                                                           |
| MISTPOSU | Poison Mist                                                | 1   | defaultScript                                                                                                                           |
| NYMPHSU  | Nymph                                                      | 1   | general                                                                                                                                 |
| OGRELESU | Ogrillon                                                   | 1   | overrideScript                                                                                                                          |
| OGRESU   | Ogre                                                       | 1   | overrideScript                                                                                                                          |
| PLYBEAR2 | Black Bear                                                 | 1   | deathvar                                                                                                                                |
| REEVOR3  | Reevor                                                     | 1   | defaultScript                                                                                                                           |
| RR#SHM02 | None whatsoever. / Shambling Mound                         | 1   | name                                                                                                                                    |
| SHADFI02 | Devil Shade                                                | 1   | gender                                                                                                                                  |
| SHIRON   | Iron Golem                                                 | 1   | anim                                                                                                                                    |
| SKELAR01 | Skeleton Archer                                            | 1   | defaultScript                                                                                                                           |
| SKELDED  |                                                            | 1   | lring                                                                                                                                   |
| SKELE2   | Skeleton                                                   | 1   | defaultScript                                                                                                                           |
| SMSPID02 | Vortex Spider                                              | 1   | defaultScript                                                                                                                           |
| SPBEAR1  | Spirit Bear                                                | 1   | overrideScript                                                                                                                          |
| SPBEAR2  | Spirit Bear                                                | 1   | overrideScript                                                                                                                          |
| SPBEAR3  | Spirit Bear                                                | 1   | overrideScript                                                                                                                          |
| SPBEAR4  | Spirit Bear                                                | 1   | overrideScript                                                                                                                          |
| SPBEAR5  | Spirit Bear                                                | 1   | overrideScript                                                                                                                          |
| SPIRLION | Spirit Lion                                                | 1   | race                                                                                                                                    |
| SPLION1  | Spirit Lion                                                | 1   | overrideScript                                                                                                                          |
| SPLION2  | Spirit Lion                                                | 1   | overrideScript                                                                                                                          |
| SPLION3  | Spirit Lion                                                | 1   | overrideScript                                                                                                                          |
| SPLION4  | Spirit Lion                                                | 1   | overrideScript                                                                                                                          |
| SPLION5  | Spirit Lion                                                | 1   | overrideScript                                                                                                                          |
| SPSNAK1  | Spirit Snake                                               | 1   | overrideScript                                                                                                                          |
| SPSNAK2  | Spirit Snake                                               | 1   | overrideScript                                                                                                                          |
| SPSNAK3  | Spirit Snake                                               | 1   | overrideScript                                                                                                                          |
| SPSNAK4  | Spirit Snake                                               | 1   | overrideScript                                                                                                                          |
| SPSNAK5  | Spirit Snake                                               | 1   | overrideScript                                                                                                                          |
| SPWOLF1  | Spirit Wolf                                                | 1   | overrideScript                                                                                                                          |
| SPWOLF2  | Spirit Wolf                                                | 1   | overrideScript                                                                                                                          |
| SPWOLF3  | Spirit Wolf                                                | 1   | overrideScript                                                                                                                          |
| SPWOLF4  | Spirit Wolf                                                | 1   | overrideScript                                                                                                                          |
| SPWOLF5  | Spirit Wolf                                                | 1   | overrideScript                                                                                                                          |
| STALKE   | Invisible Stalker                                          | 1   | class                                                                                                                                   |
| SUMELAIR | Lesser Air Elemental                                       | 1   | xpv                                                                                                                                     |
| SUMELEAR | Lesser Earth Elemental                                     | 1   | xpv                                                                                                                                     |
| SUMELFIR | Lesser Fire Elemental                                      | 1   | xpv                                                                                                                                     |
| SWAFIR01 | Fire Elemental                                             | 1   | level                                                                                                                                   |
| TELELFIR | Greater Fire Elemental                                     | 1   | defaultScript                                                                                                                           |
| TETHTO3  | Tethtoril                                                  | 1   | defaultScript                                                                                                                           |
| TOMEGOL1 | Flesh Golem                                                | 1   | xpv                                                                                                                                     |
| TOMEGOL2 | Clay Golem                                                 | 1   | xpv                                                                                                                                     |
| TOMEGOL3 | Stone Golem                                                | 1   | xpv                                                                                                                                     |
| TTGIBB   | Gibberling                                                 | 1   | defaultScript                                                                                                                           |
| TTSKEL   | Skeleton                                                   | 1   | defaultScript                                                                                                                           |
| TTSPID   | Wraith Spider                                              | 1   | defaultScript                                                                                                                           |
| UMBHUL01 | Umber Hulk                                                 | 1   | defaultScript                                                                                                                           |
| WEREWODR | Werewolf                                                   | 1   | overrideScript                                                                                                                          |
| ZOMBJU01 | Zombie                                                     | 1   | defaultScript                                                                                                                           |

## Details

### BALOR01 — Balor

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melge | dw2ms2ge |

### BASILGSU — Greater Basilisk

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| level          | 10       | 9        |
| sex            | SUMMONED | MALE     |
| overrideScript | None     | basilgsu |
| xpv            | 0        | 1200     |

### BASILLSU — Lesser Basilisk

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| level          | 6        | 7        |
| sex            | SUMMONED | MALE     |
| overrideScript | None     | basillsu |
| xpv            | 0        | 400      |

### BEARBL — Black Bear

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| deathvar       | bearbl   | None     |
| overrideScript | None     | SUMSHT02 |
| generalScript  | None     | HUNTER   |
| defaultScript  | dw1melmo | dw2mc2mo |

### BEARBLSU — Black Bear

| column         | bg1       | bg2       |
| -------------- | --------- | --------- |
| sex            | SUMMONED  | MALE      |
| overrideScript | BEAR      | SUMSHT02  |
| raceScript     | BDSUM00   | _(empty)_ |
| defaultScript  | _(empty)_ | BDSUM00   |

### BEARBR — Brown Bear

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| overrideScript | None     | SUMSHT02 |
| generalScript  | None     | hunter   |
| defaultScript  | dw1melmo | dw2mc2mo |

### BEARBRSU — Brown Bear

| column         | bg1       | bg2       |
| -------------- | --------- | --------- |
| sex            | SUMMONED  | MALE      |
| overrideScript | BEAR      | SUMSHT02  |
| raceScript     | BDSUM00   | _(empty)_ |
| defaultScript  | _(empty)_ | BDSUM00   |
| weapon1        | B1-8      | B1-8M1    |

### BEHOLD01 — Beholder

| column        | bg1      | bg2       |
| ------------- | -------- | --------- |
| defaultScript | dw1melge | _(empty)_ |
| lring         | BEHOLDER | _(empty)_ |

### BJORNI — Bjornin

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| overrideScript | dw#urbhl | SHOUT    |
| defaultScript  | dw1melge | dw2mp2ge |

### CARRIO — Carrion Crawler

| column         | bg1      | bg2  |
| -------------- | -------- | ---- |
| deathvar       | carrio   | None |
| overrideScript | dw#gpshm | None |
| xpv            | 420      | 975  |

### CARRIOSU — Mutated Crawler

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| sex            | SUMMONED | MALE     |
| overrideScript | None     | CARRIOSU |

### CATJAG01 — Panther

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| deathvar       | CATJAG01  | None     |
| allegiance     | NEUTRAL   | ENEMY    |
| overrideScript | _(empty)_ | GENSHT01 |
| classScript    | BDGRSHTV  | None     |
| generalScript  | BDANIMN   | None     |
| defaultScript  | BDNONIN   | dw2mp2mo |

### CATLIM01 — Mountain Lion

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| deathvar       | CATLIM01  | None     |
| allegiance     | NEUTRAL   | ENEMY    |
| overrideScript | _(empty)_ | GENSHT01 |
| classScript    | BDGRSHTV  | None     |
| generalScript  | BDANIMN   | None     |
| defaultScript  | BDNONIN   | dw2mp2mo |

### CATLIOSU — Lion

| column | bg1      | bg2  |
| ------ | -------- | ---- |
| sex    | SUMMONED | MALE |

### CATLIOWP — Joolon

| column        | bg1        | bg2       |
| ------------- | ---------- | --------- |
| level         | 5          | 8         |
| sex           | FEMALE     | MALE      |
| allegiance    | CONTROLLED | ALLY      |
| defaultScript | BDSUM00    | dw2mp2mo  |
| lring         | FIGRING1   | IMMUNE1   |
| rring         | IMMUNE1    | _(empty)_ |
| weapon1       | CATLIO     | FIGLION   |
| xpv           | 650        | 0         |

### DECK615 — Demon Knight

| column        | bg1       | bg2      |
| ------------- | --------- | -------- |
| gender        | MALE      | NIETHER  |
| defaultScript | dw1melge  | dw2ms2ge |
| lring         | _(empty)_ | ringdemn |

### DECK622 — Death Shade

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melge | dw2ms2ge |

### DECKFELE — Fire Elemental

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melge | dw2mc2ge |

### DEMGLASU — Glabrezu

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| level          | 15       | 17       |
| overrideScript | DVGLABRE | demglasu |

### DEMNABSU — Nabassu

| column        | bg1      | bg2         |
| ------------- | -------- | ----------- |
| anim          | TANARRI  | FIEND_GREEN |
| level         | 10       | 12          |
| sex           | SUMMONED | MALE        |
| defaultScript | dw1melge | dw2mc2ge    |

### DEMOSUM1 — Marilith

| column | bg1       | bg2    |
| ------ | --------- | ------ |
| level  | 14        | 20     |
| shield | _(empty)_ | marili |
| amulet | _(empty)_ | ipsion |

### DEMOSUM2 — Balor

| column | bg1       | bg2      |
| ------ | --------- | -------- |
| level  | 14        | 24       |
| gender | MALE      | NIETHER  |
| shield | _(empty)_ | dw#balwp |

### DEMOSUM3 — Glabrezu

| column | bg1  | bg2     |
| ------ | ---- | ------- |
| level  | 10   | 17      |
| gender | MALE | NIETHER |

### DEMOSUM4 — Cambion

| column        | bg1     | bg2      |
| ------------- | ------- | -------- |
| defaultScript | aesgar  | dw#mg156 |
| lring         | RNGDEMN | RINGDEMN |

### DEMPIT01 — Pit Fiend

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| anim           | TANARRI   | RAVER    |
| level          | 13        | 24       |
| gender         | MALE      | NIETHER  |
| overrideScript | _(empty)_ | dempit   |
| classScript    | _(empty)_ | none     |
| defaultScript  | dw1melge  | dw2mp2ge |

### DEMPITSU — Pit Fiend

| column         | bg1     | bg2      |
| -------------- | ------- | -------- |
| anim           | TANARRI | RAVER    |
| level          | 20      | 24       |
| overrideScript | DVPITSU | dempitsu |

### DEMSUC01 — Succubus

| column | bg1 | bg2 |
| ------ | --- | --- |
| level  | 6   | 12  |

### DJINNISU — Djinni

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| level          | 5         | 11       |
| gender         | SUMMONED  | MALE     |
| sex            | SUMMONED  | MALE     |
| overrideScript | None      | DJINNISU |
| lring          | _(empty)_ | DW#DJINN |

### DOGWISU — Wild Dog / Rabid Dog

| column         | bg1      | bg2       |
| -------------- | -------- | --------- |
| level          | 1        | 3         |
| sex            | SUMMONED | MALE      |
| overrideScript | WILDDOG  | dogwisu   |
| name           | Wild Dog | Rabid Dog |

### DW-ICE12 — Ice Paraelemental

| column      | bg1      | bg2           |
| ----------- | -------- | ------------- |
| general     | MONSTER  | GIANTHUMANOID |
| sex         | SUMMONED | MALE          |
| classScript | None     | ELEARPR       |

### DW-ICE16 — Greater Ice Paraelemental

| column      | bg1      | bg2           |
| ----------- | -------- | ------------- |
| general     | MONSTER  | GIANTHUMANOID |
| sex         | SUMMONED | MALE          |
| classScript | None     | ELEARPR2      |

### DW-ICE24 — Elder Ice Paraelemental

| column      | bg1      | bg2           |
| ----------- | -------- | ------------- |
| general     | MONSTER  | GIANTHUMANOID |
| sex         | SUMMONED | MALE          |
| classScript | None     | ELEARPR3      |

### DW#WATE3 — But no, this is nothing I can give you. Neither as a rewa…

| column | bg1                                                                                                                                        | bg2                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| name   | But no, this is nothing I can give you. Neither as a reward, nor as a promise of more. I am not the man who does it like this, <CHARNAME>. | Greater Water Elemental |

### EFREETSU — Efreeti

| column        | bg1         | bg2           |
| ------------- | ----------- | ------------- |
| anim          | DJINNI_LEGS | EFREETI_NOBLE |
| level         | 5           | 12            |
| gender        | SUMMONED    | MALE          |
| sex           | SUMMONED    | MALE          |
| defaultScript | BDSUM00     | _(empty)_     |

### ELAIRSUW — Air Elemental

| column  | bg1      | bg2           |
| ------- | -------- | ------------- |
| general | MONSTER  | GIANTHUMANOID |
| sex     | SUMMONED | MALE          |

### ELEARG01 — Greater Earth Elemental

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| gender        | SUMMONED | NIETHER  |
| sex           | SUMMONED | MALE     |
| defaultScript | dw1melge | dw2mc2ge |
| xpv           | 0        | 10000    |

### ELEARPR — Earth Elemental

| column         | bg1      | bg2           |
| -------------- | -------- | ------------- |
| general        | MONSTER  | GIANTHUMANOID |
| sex            | SUMMONED | MALE          |
| overrideScript | None     | ELEARPR       |

### ELEARPR2 — Greater Earth Elemental / Earth Elemental

| column         | bg1                     | bg2             |
| -------------- | ----------------------- | --------------- |
| general        | MONSTER                 | GIANTHUMANOID   |
| sex            | SUMMONED                | MALE            |
| overrideScript | None                    | ELEARPR2        |
| name           | Greater Earth Elemental | Earth Elemental |

### ELEARPR3 — Elder Earth Elemental / Earth Elemental

| column         | bg1                   | bg2             |
| -------------- | --------------------- | --------------- |
| general        | MONSTER               | GIANTHUMANOID   |
| sex            | SUMMONED              | MALE            |
| overrideScript | None                  | ELEARPR3        |
| name           | Elder Earth Elemental | Earth Elemental |

### ELEARSU4 — Elder Earth Elemental / Earth Elemental

| column  | bg1                   | bg2             |
| ------- | --------------------- | --------------- |
| general | MONSTER               | GIANTHUMANOID   |
| sex     | SUMMONED              | MALE            |
| name    | Elder Earth Elemental | Earth Elemental |

### ELEARSUW — Lesser Earth Elemental / Earth Elemental

| column  | bg1                    | bg2             |
| ------- | ---------------------- | --------------- |
| general | MONSTER                | GIANTHUMANOID   |
| sex     | SUMMONED               | MALE            |
| name    | Lesser Earth Elemental | Earth Elemental |

### ELFIRPR — Fire Elemental

| column         | bg1      | bg2     |
| -------------- | -------- | ------- |
| sex            | SUMMONED | MALE    |
| overrideScript | None     | ELFIRPR |

### ELFIRPR2 — Greater Fire Elemental / Fire Elemental

| column         | bg1                    | bg2            |
| -------------- | ---------------------- | -------------- |
| sex            | SUMMONED               | MALE           |
| overrideScript | None                   | ELFIRPR2       |
| name           | Greater Fire Elemental | Fire Elemental |

### ELFIRPR3 — Elder Fire Elemental / Fire Elemental

| column         | bg1                  | bg2            |
| -------------- | -------------------- | -------------- |
| sex            | SUMMONED             | MALE           |
| overrideScript | None                 | ELFIRPR3       |
| name           | Elder Fire Elemental | Fire Elemental |

### ELFIRSU4 — Elder Fire Elemental / Fire Elemental

| column | bg1                  | bg2            |
| ------ | -------------------- | -------------- |
| sex    | SUMMONED             | MALE           |
| name   | Elder Fire Elemental | Fire Elemental |

### ELFIRSUW — Lesser Fire Elemental / Fire Elemental

| column | bg1                   | bg2            |
| ------ | --------------------- | -------------- |
| sex    | SUMMONED              | MALE           |
| name   | Lesser Fire Elemental | Fire Elemental |

### ETTERCSU — Ettercap

| column         | bg1  | bg2      |
| -------------- | ---- | -------- |
| overrideScript | None | ettercsu |

### GHASTF01 — Fell Ghast

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melge | dw2mp2ge |

### GHASTSU — Skeleton

| column | bg1      | bg2  |
| ------ | -------- | ---- |
| sex    | SUMMONED | MALE |

### GHOULSU — Ghoul

| column        | bg1       | bg2      |
| ------------- | --------- | -------- |
| gender        | SUMMONED  | NIETHER  |
| sex           | SUMMONED  | MALE     |
| allegiance    | ENEMY     | ALLY     |
| raceScript    | _(empty)_ | None     |
| defaultScript | dw1melge  | dw2mc2ge |
| xpv           | 0         | 175      |

### GLOBSHAM — Shambling Mound

| column  | bg1   | bg2           |
| ------- | ----- | ------------- |
| general | PLANT | GIANTHUMANOID |

### GOLSTO01 — I am quite sure that the membership of a thieves' guild w…

| column        | bg1                                                                                                                                                                                                                          | bg2         |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| defaultScript | WDASIGHT                                                                                                                                                                                                                     | _(empty)_   |
| name          | I am quite sure that the membership of a thieves' guild would include several people capable of whatever you ask. Danger of being recognized seems a minor concern if one is able to not be seen at all. Why do you need me? | Stone Golem |

### GORF — Gorf / Gorf the Squisher

| column         | bg1           | bg2               |
| -------------- | ------------- | ----------------- |
| general        | GIANTHUMANOID | HUMANOID          |
| class          | OGRE          | FIGHTER           |
| anim           | OGRE          | HALF_OGRE         |
| dialog         | None          | gorf1             |
| level          | 9             | 5                 |
| gender         | NIETHER       | MALE              |
| overrideScript | dw#gpsht      | gorf              |
| defaultScript  | dw1melge      | dw2mc2ge          |
| weapon1        | OGRE1         | BLUN01            |
| xpv            | 2000          | 2500              |
| name           | Gorf          | Gorf the Squisher |

### HGSAL01 — Fire Salamander / Salamander

| column        | bg1             | bg2             |
| ------------- | --------------- | --------------- |
| race          | ELEMENTAL       | SALAMANDER      |
| class         | ELEMENTAL_FIRE  | SALAMANDER_FIRE |
| defaultScript | dw1melmo        | dw2mp2mo        |
| name          | Fire Salamander | Salamander      |

### HOBGOBSU — Hobgoblin Elite

| column         | bg1       | bg2       |
| -------------- | --------- | --------- |
| dialog         | _(empty)_ | None      |
| level          | 1         | 4         |
| sex            | SUMMONED  | MALE      |
| overrideScript | HOBGOBA   | hobgobsu  |
| raceScript     | HOBGOBSU  | _(empty)_ |
| defaultScript  | None      | BDSUM00   |

### ICMYC01 — Myconid

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| gender        | MALE     | NIETHER  |
| defaultScript | dw1melmo | dw2mc2mo |

### IGIBBER — Gibberling

| column         | bg1      | bg2           |
| -------------- | -------- | ------------- |
| deathvar       | None     | AataqahGibber |
| overrideScript | GIBBER   | AATAQFGT      |
| defaultScript  | dw1melmo | dw2ms2mo      |
| amulet         | GOPOOF   | _(empty)_     |
| weapon1        | GIBBERIL | S1-8          |

### JELLGR — Gray Ooze

| column        | bg1       | bg2       |
| ------------- | --------- | --------- |
| class         | GREY_OOZE | MAGE      |
| defaultScript | dw1ranmo  | dw2rm2mo  |
| weapon2       | DW#OOZEG  | _(empty)_ |

### JELLMU — Mustard Jelly

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1ranmo | dw2rc2mo |

### JELLMUSU — Mustard Jelly

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| sex            | SUMMONED  | MALE     |
| overrideScript | None      | jellmusu |
| defaultScript  | dw1ranmo  | dw2rc2mo |
| weapon2        | _(empty)_ | DW#JELMU |
| xpv            | 0         | 500      |

### JELLOC — Ochre Jelly

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1ranmo | dw2rc2mo |

### JELLYGR — Green Slime

| column        | bg1         | bg2      |
| ------------- | ----------- | -------- |
| class         | GREEN_SLIME | MAGE     |
| defaultScript | dw1melmo    | dw2mc2mo |

### JONDAL3 — Jondalar

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melge | dw2mc2ge |

### JONDALW — Jondal

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| class         | WOLFWERE | WEREWOLF |
| defaultScript | dw1melge | dw2ms2ge |

### KOBCAP01 — Kobold Captain

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| class         | PALADIN  | KOBOLD   |
| defaultScript | dw1ranpa | dw2rs2ge |

### KOBOLDSU — Kobold Commando

| column         | bg1       | bg2       |
| -------------- | --------- | --------- |
| level          | 1         | 3         |
| sex            | SUMMONED  | MALE      |
| overrideScript | KOBOLDAL  | None      |
| raceScript     | BDSUM00   | _(empty)_ |
| defaultScript  | _(empty)_ | BDSUM00   |
| helmet         | _(empty)_ | HELM01    |

### MEPEAR01 — Earth Mephit

| column        | bg1       | bg2      |
| ------------- | --------- | -------- |
| raceScript    | _(empty)_ | None     |
| generalScript | _(empty)_ | None     |
| defaultScript | dw1melge  | dw2mc2ge |

### MEPMAG01 — Magma Mephit

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| deathvar       | MEPMAG01  | None     |
| gender         | MALE      | NIETHER  |
| overrideScript | _(empty)_ | GENSHT01 |
| classScript    | BDENSHTV  | None     |
| raceScript     | MEPMAG    | None     |
| generalScript  | _(empty)_ | None     |
| defaultScript  | BDFIG00   | MEPMAG   |

### MINDFL01 — Mind Flayer

| column        | bg1      | bg2       |
| ------------- | -------- | --------- |
| level         | 8        | 12        |
| defaultScript | dw1melge | _(empty)_ |

### MISTPO01 — Poison Mist

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melmo | dw2ms2mo |

### MISTPOSU — Poison Mist

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melmo | dw2ms2mo |

### NYMPHSU — Nymph

| column  | bg1          | bg2      |
| ------- | ------------ | -------- |
| general | GENERAL_ITEM | HUMANOID |

### OGRELESU — Ogrillon

| column         | bg1  | bg2      |
| -------------- | ---- | -------- |
| overrideScript | None | ogrelesu |

### OGRESU — Ogre

| column         | bg1  | bg2    |
| -------------- | ---- | ------ |
| overrideScript | None | ogresu |

### ORC01 — Orc Warrior / Orc

| column         | bg1         | bg2       |
| -------------- | ----------- | --------- |
| class          | FIGHTER     | ORC       |
| dialog         | _(empty)_   | None      |
| level          | 3           | 4         |
| overrideScript | _(empty)_   | GENSHT01  |
| classScript    | BDENSHTV    | None      |
| generalScript  | _(empty)_   | None      |
| defaultScript  | BDFIG00     | dw2ms2ba  |
| weapon1        | HALB01      | _(empty)_ |
| weapon2        | _(empty)_   | SW1H01    |
| xpv            | 120         | 95        |
| name           | Orc Warrior | Orc       |

### ORC02 — Orc Archer

| column         | bg1       | bg2             |
| -------------- | --------- | --------------- |
| class          | FIGHTER   | ORC             |
| anim           | ORC_RANGE | ORC_ELITE_RANGE |
| level          | 3         | 5               |
| overrideScript | _(empty)_ | GENSHT01        |
| classScript    | BDENSHTV  | None            |
| generalScript  | _(empty)_ | None            |
| defaultScript  | BDARCH00  | dw2rs2ge        |
| helmet         | _(empty)_ | HELM01          |
| weapon1        | BOW01     | BOW03           |
| weapon2        | SPER01    | SW1H07          |
| xpv            | 120       | 35              |

### ORC03 — Orc Priest

| column         | bg1       | bg2       |
| -------------- | --------- | --------- |
| level          | 3         | 12        |
| overrideScript | _(empty)_ | GENSHT01  |
| classScript    | BDENSHTV  | None      |
| generalScript  | _(empty)_ | None      |
| defaultScript  | BDPRI00   | dw#pr179  |
| weapon1        | STAF01    | BLUN04    |
| weapon2        | SLNG01    | _(empty)_ |
| xpv            | 175       | 2000      |

### ORC04 — Orc Leader / Orc Mage

| column         | bg1             | bg2        |
| -------------- | --------------- | ---------- |
| class          | FIGHTER         | MAGE       |
| anim           | ORC_ELITE_MELEE | ORC_SHAMAN |
| level          | 5               | 12         |
| overrideScript | _(empty)_       | GENSHT01   |
| classScript    | BDENSHTV        | None       |
| raceScript     | _(empty)_       | None       |
| defaultScript  | BDFIG00         | dw#mg399   |
| weapon1        | HALB01          | BLUN04     |
| xpv            | 150             | 1000       |
| name           | Orc Leader      | Orc Mage   |

### ORC05 — Orc Shaman / Orog

| column         | bg1        | bg2       |
| -------------- | ---------- | --------- |
| class          | SHAMAN     | ORC       |
| anim           | ORC_SHAMAN | OROG      |
| dialog         | _(empty)_  | None      |
| level          | 6          | 5         |
| overrideScript | _(empty)_  | GENSHT01  |
| classScript    | BDENSHTV   | None      |
| generalScript  | _(empty)_  | None      |
| defaultScript  | BDSHM00    | dw2ms2ba  |
| helmet         | HELMNOAN   | _(empty)_ |
| weapon1        | STAF01     | SW2H01    |
| xpv            | 420        | 600       |
| name           | Orc Shaman | Orog      |

### ORC06 — Orc Raider / Orog

| column         | bg1           | bg2        |
| -------------- | ------------- | ---------- |
| class          | FIGHTER_THIEF | ORC        |
| anim           | ORC_MELEE     | OROG_ELITE |
| dialog         | _(empty)_     | None       |
| level          | 4             | 5          |
| overrideScript | _(empty)_     | GENSHT01   |
| classScript    | BDENSHTV      | None       |
| generalScript  | _(empty)_     | None       |
| defaultScript  | BDFIG00       | dw2ms2ge   |
| lring          | MAGE01        | _(empty)_  |
| weapon1        | SW1H07        | _(empty)_  |
| weapon2        | _(empty)_     | SW1H01     |
| xpv            | 135           | 175        |
| name           | Orc Raider    | Orog       |

### OTYUGH — Otyugh

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| overrideScript | _(empty)_ | GENSHT01 |
| raceScript     | GENSHT01  | None     |
| defaultScript  | dw1melmo  | dw2mc2mo |

### PETTIN — Ettin

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| dialog         | _(empty)_ | None     |
| overrideScript | _(empty)_ | None     |
| classScript    | BDENSHTV  | None     |
| raceScript     | _(empty)_ | None     |
| generalScript  | _(empty)_ | None     |
| defaultScript  | BDFIG00   | dw2mc2ge |
| weapon1        | B1-12M3   | B3-12    |

### PLANWISH — Fallen Planetar

| column         | bg1           | bg2             |
| -------------- | ------------- | --------------- |
| general        | GIANTHUMANOID | MONSTER         |
| anim           | DEVA_MONADIC  | MAGE_FEMALE_ELF |
| gender         | NIETHER       | FEMALE          |
| sex            | MALE          | FEMALE          |
| overrideScript | plangood      | planet          |
| defaultScript  | planet        | dw2ms2mo        |
| helmet         | _(empty)_     | DVWINGS         |

### PLYBEAR2 — Black Bear

| column   | bg1    | bg2  |
| -------- | ------ | ---- |
| deathvar | bearbl | None |

### PLYOGRE — Ogre

| column | bg1     | bg2  |
| ------ | ------- | ---- |
| gender | NIETHER | MALE |
| sex    | 158     | MALE |

### PLYSALA — Fire Salamander / Salamander

| column | bg1             | bg2        |
| ------ | --------------- | ---------- |
| gender | NIETHER         | MALE       |
| name   | Fire Salamander | Salamander |

### PLYSPID2 — Giant Spider

| column        | bg1      | bg2       |
| ------------- | -------- | --------- |
| deathvar      | None     | _(empty)_ |
| defaultScript | dw1melmo | dw2mp2mo  |

### PPDJINN — Genie

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melge | dw2mc2ge |
| weapon1       | B3-18    | B3-18M3  |

### REEVOR3 — Reevor

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melge | dw2ms2ge |

### RR#SHM02 — None whatsoever. / Shambling Mound

| column | bg1              | bg2             |
| ------ | ---------------- | --------------- |
| name   | None whatsoever. | Shambling Mound |

### SCHLUM — Schlumpsha the Sewer King

| column         | bg1      | bg2       |
| -------------- | -------- | --------- |
| class          | NO_CLASS | MAGE      |
| overrideScript | dw#gpsht | SHOUT     |
| defaultScript  | dw1ranmo | dw2rm2mo  |
| weapon2        | DW#SCHLU | _(empty)_ |

### SHADFI02 — Devil Shade

| column | bg1  | bg2     |
| ------ | ---- | ------- |
| gender | MALE | NIETHER |

### SHADOW01 — Shadow Warrior / Shadow

| column         | bg1            | bg2      |
| -------------- | -------------- | -------- |
| anim           | SHADOW_SMALL   | SHADOW   |
| overrideScript | GENSHT01       | D0QPSHAD |
| raceScript     | None           | GENSHT01 |
| defaultScript  | dw1melge       | dw2ms2ge |
| name           | Shadow Warrior | Shadow   |

### SHAWOL01 — Shade Wolf

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| gender         | MALE     | NIETHER  |
| overrideScript | None     | grpsht01 |
| generalScript  | None     | CBMALDES |
| defaultScript  | dw1melge | dw2mp2ge |

### SHIRON — Iron Golem

| column | bg1        | bg2            |
| ------ | ---------- | -------------- |
| anim   | GOLEM_IRON | GOLEM_IRON_IWD |

### SKELAR01 — Skeleton Archer

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1ranmo | dw2rs2mo |

### SKELAR02 — Skeleton Archer

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| gender        | MALE     | NIETHER  |
| defaultScript | dw1ranmo | dw2rs2mo |

### SKELDED — 

| column | bg1    | bg2       |
| ------ | ------ | --------- |
| lring  | RING99 | _(empty)_ |

### SKELE2 — Skeleton

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melmo | dw2mc2mo |

### SKELWA — Skeleton Warrior

| column         | bg1      | bg2              |
| -------------- | -------- | ---------------- |
| anim           | SKELETON | SKELETON_WARRIOR |
| level          | 9        | 10               |
| overrideScript | dw#gpshm | gensht01         |
| classScript    | None     | GENSHT01         |
| defaultScript  | dw1melge | dw2ms2ge         |
| lring          | RING99   | RING95           |

### SKELWA01 — Skeleton Warrior

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| overrideScript | None     | gensht01 |
| defaultScript  | dw1melge | dw2ms2ge |

### SKELWA02 — Skeleton Warrior

| column         | bg1       | bg2              |
| -------------- | --------- | ---------------- |
| anim           | SKELETON  | SKELETON_WARRIOR |
| overrideScript | dw#gpshm  | gensht01         |
| classScript    | None      | CBMALDES         |
| defaultScript  | dw1melge  | dw2ms2ge         |
| lring          | RING99    | _(empty)_        |
| rring          | _(empty)_ | RING95           |

### SKELWA03 — Skeleton Warrior

| column         | bg1       | bg2              |
| -------------- | --------- | ---------------- |
| anim           | SKELETON  | SKELETON_MONSTER |
| overrideScript | dw#gpshm  | gensht01         |
| defaultScript  | dw1range  | dw2rs2ge         |
| lring          | RING99    | _(empty)_        |
| rring          | _(empty)_ | RING95           |

### SLAYSH01 — Slayer Shadow

| column         | bg1  | bg2      |
| -------------- | ---- | -------- |
| gender         | 12   | EXTRA4   |
| overrideScript | None | D0QPSHAD |

### SMSPID02 — Vortex Spider

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melmo | dw2mp2mo |

### SPBEAR1 — Spirit Bear

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPBEAR2 — Spirit Bear

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPBEAR3 — Spirit Bear

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPBEAR4 — Spirit Bear

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPBEAR5 — Spirit Bear

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPIDFGSU — Kitthix

| column        | bg1         | bg2          |
| ------------- | ----------- | ------------ |
| class         | SPIDER_HUGE | SPIDER_SWORD |
| anim          | SPIDER_HUGE | SPIDER_SWORD |
| level         | 2           | 8            |
| sex           | SUMMONED    | MALE         |
| defaultScript | BDSUM00     | dw2mp2mo     |

### SPIDSM01 — Small Spider

| column         | bg1       | bg2         |
| -------------- | --------- | ----------- |
| class          | NO_CLASS  | SPIDER_HUGE |
| deathvar       | SPIDSM01  | None        |
| level          | 1         | 5           |
| gender         | MALE      | NIETHER     |
| overrideScript | _(empty)_ | dw#sphlp    |
| classScript    | BDENSHTV  | None        |
| raceScript     | _(empty)_ | None        |
| generalScript  | _(empty)_ | None        |
| defaultScript  | BDNONIN   | dw2mp2mo    |
| weapon1        | SPIDHU1   | SPIDSW1     |
| xpv            | 65        | 300         |

### SPIDSW01 — Sword Spider

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| overrideScript | None     | dw#sphlp |
| defaultScript  | dw1melmo | dw2mp2mo |

### SPIDWR01 — Wraith Spider

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| overrideScript | None     | dw#sphlp |
| defaultScript  | dw1melmo | dw2mp2mo |

### SPIRLION — Spirit Lion

| column | bg1     | bg2 |
| ------ | ------- | --- |
| race   | NO_RACE | CAT |

### SPLION1 — Spirit Lion

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPLION2 — Spirit Lion

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPLION3 — Spirit Lion

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPLION4 — Spirit Lion

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPLION5 — Spirit Lion

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPSNAK1 — Spirit Snake

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPSNAK2 — Spirit Snake

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPSNAK3 — Spirit Snake

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPSNAK4 — Spirit Snake

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPSNAK5 — Spirit Snake

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPWOLF1 — Spirit Wolf

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPWOLF2 — Spirit Wolf

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPWOLF3 — Spirit Wolf

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPWOLF4 — Spirit Wolf

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### SPWOLF5 — Spirit Wolf

| column         | bg1     | bg2       |
| -------------- | ------- | --------- |
| overrideScript | SPIRDTH | _(empty)_ |

### STALKE — Invisible Stalker

| column | bg1      | bg2    |
| ------ | -------- | ------ |
| class  | NO_CLASS | RANGER |

### SUMDJINN — Djinni

| column | bg1       | bg2      |
| ------ | --------- | -------- |
| level  | 7         | 11       |
| gender | NIETHER   | MALE     |
| lring  | _(empty)_ | DW#DJINN |
| xpv    | 5000      | 0        |

### SUMEFREE — Efreeti

| column        | bg1      | bg2           |
| ------------- | -------- | ------------- |
| anim          | DJINNI   | EFREETI_NOBLE |
| level         | 10       | 12            |
| gender        | SUMMONED | MALE          |
| defaultScript | BDSUM00  | efreet01      |
| xpv           | 8000     | 0             |

### SUMELAIR — Lesser Air Elemental

| column | bg1  | bg2 |
| ------ | ---- | --- |
| xpv    | 2000 | 0   |

### SUMELEAR — Lesser Earth Elemental

| column | bg1  | bg2 |
| ------ | ---- | --- |
| xpv    | 3000 | 0   |

### SUMELFIR — Lesser Fire Elemental

| column | bg1  | bg2 |
| ------ | ---- | --- |
| xpv    | 2000 | 0   |

### SWAAIR01 — Air Elemental

| column  | bg1     | bg2           |
| ------- | ------- | ------------- |
| general | MONSTER | GIANTHUMANOID |
| level   | 12      | 16            |

### SWAAIR02 — Air Elemental

| column  | bg1     | bg2           |
| ------- | ------- | ------------- |
| general | MONSTER | GIANTHUMANOID |
| level   | 12      | 24            |

### SWAEAR01 — Earth Elemental

| column  | bg1     | bg2           |
| ------- | ------- | ------------- |
| general | MONSTER | GIANTHUMANOID |
| level   | 12      | 16            |

### SWAEAR02 — Earth Elemental

| column  | bg1     | bg2           |
| ------- | ------- | ------------- |
| general | MONSTER | GIANTHUMANOID |
| level   | 12      | 24            |

### SWAFIR01 — Fire Elemental

| column | bg1 | bg2 |
| ------ | --- | --- |
| level  | 12  | 16  |

### SWAFIR02 — Fire Elemental

| column  | bg1           | bg2     |
| ------- | ------------- | ------- |
| general | GIANTHUMANOID | MONSTER |
| level   | 12            | 24      |

### TASLOISU — Tasloi / Tasloi Elite Trooper

| column         | bg1       | bg2                  |
| -------------- | --------- | -------------------- |
| level          | 1         | 3                    |
| sex            | SUMMONED  | MALE                 |
| allegiance     | ENEMY     | CONTROLLED           |
| overrideScript | None      | tasloisu             |
| classScript    | None      | _(empty)_            |
| defaultScript  | dw1melge  | dw2rp2ge             |
| helmet         | _(empty)_ | HELM01               |
| weapon2        | _(empty)_ | SLNG01               |
| xpv            | 0         | 5                    |
| name           | Tasloi    | Tasloi Elite Trooper |

### TAZOK — Tazok

| column         | bg1       | bg2       |
| -------------- | --------- | --------- |
| level          | 9         | 19        |
| allegiance     | NEUTRAL   | ENEMY     |
| overrideScript | RR#PICKP  | D9TAZOKK  |
| classScript    | TAZOK     | GENSHT01  |
| defaultScript  | dw1melbe  | dw2ms2be  |
| helmet         | _(empty)_ | HELM01    |
| amulet         | MIHP1     | _(empty)_ |
| weapon1        | SW2H01    | SW2H12    |
| xpv            | 4000      | 12000     |

### TELALU1 — Alu-Fiend

| column  | bg1    | bg2    |
| ------- | ------ | ------ |
| level   | 20     | 12     |
| weapon1 | SW1H52 | SW1H76 |

### TELELFIR — Greater Fire Elemental

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melge | dw2mc2ge |

### TELICESA — Ice Salamander / Frost Salamander

| column        | bg1            | bg2              |
| ------------- | -------------- | ---------------- |
| defaultScript | dw1melmo       | dw2mp2mo         |
| name          | Ice Salamander | Frost Salamander |

### TETHTO3 — Tethtoril

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melge | dw2mm2ge |

### TOMEGOL1 — Flesh Golem

| column | bg1  | bg2 |
| ------ | ---- | --- |
| xpv    | 2000 | 0   |

### TOMEGOL2 — Clay Golem

| column | bg1  | bg2 |
| ------ | ---- | --- |
| xpv    | 8000 | 0   |

### TOMEGOL3 — Stone Golem

| column | bg1  | bg2 |
| ------ | ---- | --- |
| xpv    | 8000 | 0   |

### TOMEGOL4 — Juggernaut Golem

| column  | bg1        | bg2            |
| ------- | ---------- | -------------- |
| anim    | GOLEM_IRON | GOLEM_IRON_IWD |
| lring   | IMMUNE1    | IMMUNE2        |
| weapon1 | _(empty)_  | GOLTOME4       |
| xpv     | 13000      | 0              |

### TROLFR01 — Freshwater Troll

| column         | bg1       | bg2       |
| -------------- | --------- | --------- |
| level          | 5         | 6         |
| overrideScript | TROLL01   | TROLFR01  |
| classScript    | BDENSHTV  | None      |
| raceScript     | _(empty)_ | None      |
| generalScript  | _(empty)_ | GENSHT01  |
| defaultScript  | BDFIG00   | dw2mp2ge  |
| amulet         | MONHP1    | _(empty)_ |

### TROLL01 — Troll

| column         | bg1       | bg2       |
| -------------- | --------- | --------- |
| level          | 6         | 8         |
| overrideScript | TROLL01   | gensht01  |
| classScript    | BDENSHTV  | TROLL01   |
| raceScript     | _(empty)_ | None      |
| generalScript  | _(empty)_ | None      |
| defaultScript  | BDFIG00   | wtatroll  |
| amulet         | MONHP1    | _(empty)_ |

### TROLSP01 — Spectral Troll

| column         | bg1       | bg2           |
| -------------- | --------- | ------------- |
| general        | UNDEAD    | GIANTHUMANOID |
| level          | 8         | 9             |
| overrideScript | TROLL01   | TROLSP01      |
| classScript    | BDENSHTV  | None          |
| raceScript     | _(empty)_ | None          |
| generalScript  | _(empty)_ | GENSHT01      |
| defaultScript  | BDFIG00   | dw2mp2ge      |
| amulet         | MONHP1    | _(empty)_     |
| xpv            | 1500      | 3500          |

### TTGIBB — Gibberling

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melmo | dw2ms2mo |

### TTKOB — Kobold

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melge | dw2ms2ge |
| weapon1       | TTSWORD5 | SW1H07   |

### TTSKEL — Skeleton

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melmo | dw2ms2mo |

### TTSPID — Wraith Spider

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melmo | dw2mp2mo |

### UMBHUL01 — Umber Hulk

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melmo | dw2mc2mo |

### VAMFLF01 — Fledgling Vampire

| column        | bg1       | bg2           |
| ------------- | --------- | ------------- |
| class         | VAMPIRE   | FIGHTER_THIEF |
| generalScript | VAMPIR01  | D0QPVAFL      |
| defaultScript | dw1melge  | _(empty)_     |
| lring         | VAMPREG   | IMMUNE2       |
| rring         | _(empty)_ | VAMPREG       |
| weapon2       | _(empty)_ | DW#BLDD       |
| weapon3       | _(empty)_ | DW#VMWOL      |
| weapon4       | _(empty)_ | DW#VMBAT      |
| xpv           | 8500      | 8000          |

### VAMFLM01 — Fledgling Vampire

| column         | bg1       | bg2           |
| -------------- | --------- | ------------- |
| class          | VAMPIRE   | FIGHTER_THIEF |
| deathvar       | VAMFLM01  | None          |
| dialog         | _(empty)_ | None          |
| overrideScript | _(empty)_ | GENSHT01      |
| classScript    | BDENSHTV  | None          |
| raceScript     | _(empty)_ | None          |
| generalScript  | BDVAMP01  | D0QPVAFL      |
| defaultScript  | BDFIG00   | _(empty)_     |
| lring          | VAMPREG   | IMMUNE2       |
| rring          | IMMUNE1   | VAMPREG       |
| weapon2        | _(empty)_ | DW#BLDD       |
| weapon3        | _(empty)_ | DW#VMWOL      |
| weapon4        | _(empty)_ | DW#VMBAT      |

### WEREGRDR — Greater Werewolf

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| overrideScript | _(empty)_ | grpsht01 |
| lring          | RINGLOUP  | RINGWOLF |

### WEREWO01 — Werewolf

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| overrideScript | None     | grpsht01 |
| defaultScript  | dw1melge | dw2ms2ge |

### WEREWODR — Werewolf

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| overrideScript | _(empty)_ | grpsht01 |

### WISH01 — Dao / Djinni

| column        | bg1       | bg2     |
| ------------- | --------- | ------- |
| deathvar      | None      | WISH01  |
| level         | 8         | 25      |
| generalScript | DAO01     | None    |
| defaultScript | dw1melge  | None    |
| rring         | _(empty)_ | RIDRING |
| xpv           | 5000      | 0       |
| name          | Dao       | Djinni  |

### WISH02 — Djinni

| column | bg1      | bg2     |
| ------ | -------- | ------- |
| gender | SUMMONED | NIETHER |
| xpv    | 5000     | 0       |

### WOLFDI — Dire Wolf

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| deathvar       | None     | wolfdi   |
| overrideScript | dw#gpshm | None     |
| generalScript  | None     | hunter   |
| defaultScript  | dw1melmo | dw2mp2mo |

### WOLFDISU — Dire Wolf

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| sex            | SUMMONED | MALE     |
| overrideScript | None     | wolfdisu |
| weapon1        | P1-8     | P1-8M1   |

### WOLFGR01 — Greater Wolfwere

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| overrideScript | None     | grpsht01 |
| defaultScript  | dw1melge | dw2mc2ge |

### WOLFWE01 — Wolfwere

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| overrideScript | None     | grpsht01 |
| defaultScript  | dw1melge | dw2ms2ge |

### WOLFWISU — Winter Wolf

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| sex            | SUMMONED | MALE     |
| overrideScript | None     | wolfwisu |
| xpv            | 0        | 975      |

### WOLFWWSU — Winter Wolf

| column         | bg1      | bg2      |
| -------------- | -------- | -------- |
| sex            | SUMMONED | MALE     |
| overrideScript | None     | wolfwwsu |

### WORGSU — Worg

| column         | bg1      | bg2    |
| -------------- | -------- | ------ |
| sex            | SUMMONED | MALE   |
| overrideScript | None     | worgsu |

### XVARTSU — Xvart / Xvart Protector

| column         | bg1       | bg2             |
| -------------- | --------- | --------------- |
| level          | 1         | 3               |
| sex            | SUMMONED  | MALE            |
| allegiance     | ENEMY     | CONTROLLED      |
| overrideScript | dw#prsht  | None            |
| defaultScript  | dw1melge  | dw2ms2ge        |
| helmet         | _(empty)_ | HELM01          |
| xpv            | 0         | 15              |
| name           | Xvart     | Xvart Protector |

### XZAR — Xzar

| column         | bg1       | bg2      |
| -------------- | --------- | -------- |
| deathvar       | xzar      | Lyros    |
| dialog         | xzar      | LYROS    |
| level          | 1         | 13       |
| overrideScript | XZAR      | SHOUT    |
| classScript    | dw#urbhl  | LYROS    |
| raceScript     | MAGE5     | SHOUTDLG |
| generalScript  | WTASIGHT  | None     |
| defaultScript  | DPLAYER   | None     |
| helmet         | _(empty)_ | HELMNOAN |
| weapon1        | DAGG01    | STAF07   |
| xpv            | 0         | 4500     |

### ZOMBJU01 — Zombie

| column        | bg1      | bg2      |
| ------------- | -------- | -------- |
| defaultScript | dw1melmo | dw2mc2mo |
