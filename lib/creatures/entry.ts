import { TranslationKey } from "../translations/i18n";
import { MonsterEnum } from "./monster";

/**
 * Monster entries: one monster in several versions (rank, age or size), as in a monster book.
 * Every creature belongs to exactly one entry: the multi-member entries keep ids 1-9, the
 * single-member entries follow. Ids are stable: they name entry-owned resources (scope `e`).
 */
export enum EntryEnum {
  Basilisk = 1,
  ClayGolem = 2,
  Ghoul = 3,
  Mummy = 4,
  Shadow = 5,
  StoneGolem = 6,
  Vampire = 7,
  Wyvern = 8,
  Zombie = 9,
  Ankheg = 10,
  BlackBear = 11,
  BrownBear = 12,
  CaveBear = 13,
  GrizzlyBear = 14,
  PolarBear = 15,
  CarrionCrawler = 16,
  Cheetah = 17,
  GiantLynx = 18,
  Jaguar = 19,
  Leopard = 20,
  Lion = 21,
  MountainLion = 22,
  SpottedLion = 23,
  WildTiger = 24,
  Hellcat = 25,
  DisplacerBeast = 26,
  HelmedHorror = 27,
  BattleHorror = 28,
  DoomSayer = 29,
  DoomGuard = 30,
  WildDog = 31,
  WarDog = 32,
  BlinkDog = 33,
  SpectralHound = 34,
  MoonDog = 35,
  HellHound = 36,
  Ettercap = 37,
  Ettin = 38,
  Dryad = 39,
  Hamadryad = 40,
  Nymph = 41,
  Sirine = 42,
  Nereid = 43,
  FleshGolem = 44,
  SandGolem = 45,
  IronGolem = 46,
  BoneGolem = 47,
  JuggernautGolem = 48,
  SnowGolem = 49,
  MagicGolem = 50,
  AdamantiteGolem = 51,
  WaxGolem = 52,
  Minotaur = 53,
  Ogre = 54,
  Ogrillon = 55,
  HalfOgre = 56,
  OgreMage = 57,
  OgreBerserker = 58,
  OgreShaman = 59,
  BlackPudding = 60,
  WhitePudding = 61,
  MustardJelly = 62,
  FissionSlime = 63,
  GrayOoze = 64,
  OchreJelly = 65,
  GreenSlime = 66,
  OliveSlime = 67,
  OliveSlimeCreature = 68,
  SlitheringTracker = 69,
  Treant = 70,
  GiantPoisonousSnake = 71,
  GargantuanSpider = 72,
  GhostwalkSpider = 73,
  GiantSpider = 74,
  HairySpider = 75,
  HugeSpider = 76,
  HuntingSpider = 77,
  PhaseSpider = 78,
  SwordSpider = 79,
  VortexSpider = 80,
  WraithSpider = 81,
  Wolf = 82,
  DireWolf = 83,
  DreadWolf = 84,
  VampiricWolf = 85,
  WinterWolf = 86,
  Worg = 87,
  Banshee = 88,
  Ghast = 89,
  Baneguard = 90,
  Bonebat = 91,
  Skeleton = 92,
  SpikeSkeleton = 93,
  ArcherSkeleton = 94,
  GiantSkeleton = 95,
  SkeletonMonster = 96,
  SkeletonWarrior = 97,
  DeathKnight = 98,
  Spectre = 99,
  Ghost = 100,
  Wight = 101,
  Wraith = 102,
}

const ENTRIES: Record<EntryEnum, { name: TranslationKey; members: MonsterEnum[] }> = {
  [EntryEnum.Basilisk]: {
    name: "doc.entry.basilisk",
    members: [MonsterEnum.LesserBasilisk, MonsterEnum.GreaterBasilisk],
  },
  [EntryEnum.ClayGolem]: {
    name: "doc.entry.clayGolem",
    members: [MonsterEnum.ClayGolem, MonsterEnum.LesserClayGolem, MonsterEnum.GreaterClayGolem],
  },
  [EntryEnum.Ghoul]: {
    name: "doc.entry.ghoul",
    members: [MonsterEnum.Ghoul, MonsterEnum.GhoulLord],
  },
  [EntryEnum.Mummy]: {
    name: "doc.entry.mummy",
    members: [MonsterEnum.Mummy, MonsterEnum.GreaterMummy],
  },
  [EntryEnum.Shadow]: {
    name: "doc.entry.shadow",
    members: [MonsterEnum.Shadow, MonsterEnum.GreaterShadow],
  },
  [EntryEnum.StoneGolem]: {
    name: "doc.entry.stoneGolem",
    members: [MonsterEnum.StoneGolem, MonsterEnum.LesserStoneGolem],
  },
  [EntryEnum.Vampire]: {
    name: "doc.entry.vampire",
    members: [
      MonsterEnum.VampireFledgling,
      MonsterEnum.VampireMature,
      MonsterEnum.VampireOld,
      MonsterEnum.VampireVeryOld,
      MonsterEnum.VampireAncient,
      MonsterEnum.VampireEminent,
      MonsterEnum.VampirePatriarch,
    ],
  },
  [EntryEnum.Wyvern]: {
    name: "doc.entry.wyvern",
    members: [MonsterEnum.Wyvern, MonsterEnum.BabyWyvern, MonsterEnum.GreaterWyvern],
  },
  [EntryEnum.Zombie]: {
    name: "doc.entry.zombie",
    members: [
      MonsterEnum.Zombie,
      MonsterEnum.ZombieLord,
      MonsterEnum.ZombieJuju,
      MonsterEnum.ZombieSea,
    ],
  },
  [EntryEnum.Ankheg]: { name: "monster.ankheg.name", members: [MonsterEnum.Ankheg] },
  [EntryEnum.BlackBear]: { name: "monster.bear.name.black", members: [MonsterEnum.BlackBear] },
  [EntryEnum.BrownBear]: { name: "monster.bear.name.brown", members: [MonsterEnum.BrownBear] },
  [EntryEnum.CaveBear]: { name: "monster.bear.name.cave", members: [MonsterEnum.CaveBear] },
  [EntryEnum.GrizzlyBear]: {
    name: "monster.bear.name.grizzly",
    members: [MonsterEnum.GrizzlyBear],
  },
  [EntryEnum.PolarBear]: { name: "monster.bear.name.polar", members: [MonsterEnum.PolarBear] },
  [EntryEnum.CarrionCrawler]: {
    name: "monster.carrionCrawler.name",
    members: [MonsterEnum.CarrionCrawler],
  },
  [EntryEnum.Cheetah]: { name: "monster.cat.name.cheetah", members: [MonsterEnum.Cheetah] },
  [EntryEnum.GiantLynx]: { name: "monster.cat.name.giantLynx", members: [MonsterEnum.GiantLynx] },
  [EntryEnum.Jaguar]: { name: "monster.cat.name.jaguar", members: [MonsterEnum.Jaguar] },
  [EntryEnum.Leopard]: { name: "monster.cat.name.leopard", members: [MonsterEnum.Leopard] },
  [EntryEnum.Lion]: { name: "monster.cat.name.lion", members: [MonsterEnum.Lion] },
  [EntryEnum.MountainLion]: {
    name: "monster.cat.name.mountainLion",
    members: [MonsterEnum.MountainLion],
  },
  [EntryEnum.SpottedLion]: {
    name: "monster.cat.name.spottedLion",
    members: [MonsterEnum.SpottedLion],
  },
  [EntryEnum.WildTiger]: { name: "monster.cat.name.wildTiger", members: [MonsterEnum.WildTiger] },
  [EntryEnum.Hellcat]: { name: "monster.cat.name.hellcat", members: [MonsterEnum.Hellcat] },
  [EntryEnum.DisplacerBeast]: {
    name: "monster.cat.name.displacerBeast",
    members: [MonsterEnum.DisplacerBeast],
  },
  [EntryEnum.HelmedHorror]: {
    name: "monster.construct.name.helmedHorror",
    members: [MonsterEnum.HelmedHorror],
  },
  [EntryEnum.BattleHorror]: {
    name: "monster.construct.name.battleHorror",
    members: [MonsterEnum.BattleHorror],
  },
  [EntryEnum.DoomSayer]: {
    name: "monster.construct.name.doomSayer",
    members: [MonsterEnum.DoomSayer],
  },
  [EntryEnum.DoomGuard]: {
    name: "monster.construct.name.doomGuard",
    members: [MonsterEnum.DoomGuard],
  },
  [EntryEnum.WildDog]: { name: "monster.dog.name.wild", members: [MonsterEnum.WildDog] },
  [EntryEnum.WarDog]: { name: "monster.dog.name.war", members: [MonsterEnum.WarDog] },
  [EntryEnum.BlinkDog]: { name: "monster.dog.name.blink", members: [MonsterEnum.BlinkDog] },
  [EntryEnum.SpectralHound]: {
    name: "monster.dog.name.spectralHound",
    members: [MonsterEnum.SpectralHound],
  },
  [EntryEnum.MoonDog]: { name: "monster.dog.name.moon", members: [MonsterEnum.MoonDog] },
  [EntryEnum.HellHound]: { name: "monster.dog.name.hellHound", members: [MonsterEnum.HellHound] },
  [EntryEnum.Ettercap]: { name: "monster.ettercap.name.ettercap", members: [MonsterEnum.Ettercap] },
  [EntryEnum.Ettin]: { name: "monster.ettin.name.ettin", members: [MonsterEnum.Ettin] },
  [EntryEnum.Dryad]: { name: "monster.fey.name.dryad", members: [MonsterEnum.Dryad] },
  [EntryEnum.Hamadryad]: { name: "monster.fey.name.hamadryad", members: [MonsterEnum.Hamadryad] },
  [EntryEnum.Nymph]: { name: "monster.fey.name.nymph", members: [MonsterEnum.Nymph] },
  [EntryEnum.Sirine]: { name: "monster.fey.name.sirine", members: [MonsterEnum.Sirine] },
  [EntryEnum.Nereid]: { name: "monster.fey.name.nereid", members: [MonsterEnum.Nereid] },
  [EntryEnum.FleshGolem]: { name: "monster.golem.name.flesh", members: [MonsterEnum.FleshGolem] },
  [EntryEnum.SandGolem]: { name: "monster.golem.name.sand", members: [MonsterEnum.SandGolem] },
  [EntryEnum.IronGolem]: { name: "monster.golem.name.iron", members: [MonsterEnum.IronGolem] },
  [EntryEnum.BoneGolem]: { name: "monster.golem.name.bone", members: [MonsterEnum.BoneGolem] },
  [EntryEnum.JuggernautGolem]: {
    name: "monster.golem.name.juggernaut",
    members: [MonsterEnum.JuggernautGolem],
  },
  [EntryEnum.SnowGolem]: { name: "monster.golem.name.snow", members: [MonsterEnum.SnowGolem] },
  [EntryEnum.MagicGolem]: { name: "monster.golem.name.magic", members: [MonsterEnum.MagicGolem] },
  [EntryEnum.AdamantiteGolem]: {
    name: "monster.golem.name.adamantite",
    members: [MonsterEnum.AdamantiteGolem],
  },
  [EntryEnum.WaxGolem]: { name: "monster.golem.name.wax", members: [MonsterEnum.WaxGolem] },
  [EntryEnum.Minotaur]: { name: "monster.minotaur.name.minotaur", members: [MonsterEnum.Minotaur] },
  [EntryEnum.Ogre]: { name: "monster.ogre.name.ogre", members: [MonsterEnum.Ogre] },
  [EntryEnum.Ogrillon]: { name: "monster.ogre.name.ogrillon", members: [MonsterEnum.Ogrillon] },
  [EntryEnum.HalfOgre]: { name: "monster.ogre.name.half", members: [MonsterEnum.HalfOgre] },
  [EntryEnum.OgreMage]: { name: "monster.ogre.name.mage", members: [MonsterEnum.OgreMage] },
  [EntryEnum.OgreBerserker]: {
    name: "monster.ogre.name.berserker",
    members: [MonsterEnum.OgreBerserker],
  },
  [EntryEnum.OgreShaman]: { name: "monster.ogre.name.shaman", members: [MonsterEnum.OgreShaman] },
  [EntryEnum.BlackPudding]: {
    name: "monster.slime.name.black",
    members: [MonsterEnum.BlackPudding],
  },
  [EntryEnum.WhitePudding]: {
    name: "monster.slime.name.white",
    members: [MonsterEnum.WhitePudding],
  },
  [EntryEnum.MustardJelly]: {
    name: "monster.slime.name.mustard",
    members: [MonsterEnum.MustardJelly],
  },
  [EntryEnum.FissionSlime]: {
    name: "monster.slime.name.fission",
    members: [MonsterEnum.FissionSlime],
  },
  [EntryEnum.GrayOoze]: { name: "monster.slime.name.gray", members: [MonsterEnum.GrayOoze] },
  [EntryEnum.OchreJelly]: { name: "monster.slime.name.ochre", members: [MonsterEnum.OchreJelly] },
  [EntryEnum.GreenSlime]: { name: "monster.slime.name.green", members: [MonsterEnum.GreenSlime] },
  [EntryEnum.OliveSlime]: { name: "monster.slime.name.olive", members: [MonsterEnum.OliveSlime] },
  [EntryEnum.OliveSlimeCreature]: {
    name: "monster.slime.name.oliveCreature",
    members: [MonsterEnum.OliveSlimeCreature],
  },
  [EntryEnum.SlitheringTracker]: {
    name: "monster.slime.name.slitheringTracker",
    members: [MonsterEnum.SlitheringTracker],
  },
  [EntryEnum.Treant]: { name: "monster.plant.name.treant", members: [MonsterEnum.Treant] },
  [EntryEnum.GiantPoisonousSnake]: {
    name: "monster.snake.name.giantPoisonous",
    members: [MonsterEnum.GiantPoisonousSnake],
  },
  [EntryEnum.GargantuanSpider]: {
    name: "monster.spider.name.gargantuan",
    members: [MonsterEnum.GargantuanSpider],
  },
  [EntryEnum.GhostwalkSpider]: {
    name: "monster.spider.name.ghostwalk",
    members: [MonsterEnum.GhostwalkSpider],
  },
  [EntryEnum.GiantSpider]: {
    name: "monster.spider.name.giant",
    members: [MonsterEnum.GiantSpider],
  },
  [EntryEnum.HairySpider]: {
    name: "monster.spider.name.hairy",
    members: [MonsterEnum.HairySpider],
  },
  [EntryEnum.HugeSpider]: { name: "monster.spider.name.huge", members: [MonsterEnum.HugeSpider] },
  [EntryEnum.HuntingSpider]: {
    name: "monster.spider.name.hunting",
    members: [MonsterEnum.HuntingSpider],
  },
  [EntryEnum.PhaseSpider]: {
    name: "monster.spider.name.phase",
    members: [MonsterEnum.PhaseSpider],
  },
  [EntryEnum.SwordSpider]: {
    name: "monster.spider.name.sword",
    members: [MonsterEnum.SwordSpider],
  },
  [EntryEnum.VortexSpider]: {
    name: "monster.spider.name.vortex",
    members: [MonsterEnum.VortexSpider],
  },
  [EntryEnum.WraithSpider]: {
    name: "monster.spider.name.wraith",
    members: [MonsterEnum.WraithSpider],
  },
  [EntryEnum.Wolf]: { name: "monster.wolf.name.wolf", members: [MonsterEnum.Wolf] },
  [EntryEnum.DireWolf]: { name: "monster.wolf.name.dire", members: [MonsterEnum.DireWolf] },
  [EntryEnum.DreadWolf]: { name: "monster.wolf.name.dread", members: [MonsterEnum.DreadWolf] },
  [EntryEnum.VampiricWolf]: {
    name: "monster.wolf.name.vampiric",
    members: [MonsterEnum.VampiricWolf],
  },
  [EntryEnum.WinterWolf]: { name: "monster.wolf.name.winter", members: [MonsterEnum.WinterWolf] },
  [EntryEnum.Worg]: { name: "monster.wolf.name.worg", members: [MonsterEnum.Worg] },
  [EntryEnum.Banshee]: { name: "monster.undead.name.banshee", members: [MonsterEnum.Banshee] },
  [EntryEnum.Ghast]: { name: "monster.undead.name.ghast", members: [MonsterEnum.Ghast] },
  [EntryEnum.Baneguard]: {
    name: "monster.undead.name.baneguard",
    members: [MonsterEnum.Baneguard],
  },
  [EntryEnum.Bonebat]: { name: "monster.undead.name.bonebat", members: [MonsterEnum.Bonebat] },
  [EntryEnum.Skeleton]: { name: "monster.undead.name.skeleton", members: [MonsterEnum.Skeleton] },
  [EntryEnum.SpikeSkeleton]: {
    name: "monster.undead.name.spikeSkeleton",
    members: [MonsterEnum.SpikeSkeleton],
  },
  [EntryEnum.ArcherSkeleton]: {
    name: "monster.undead.name.archerSkeleton",
    members: [MonsterEnum.ArcherSkeleton],
  },
  [EntryEnum.GiantSkeleton]: {
    name: "monster.undead.name.giantSkeleton",
    members: [MonsterEnum.GiantSkeleton],
  },
  [EntryEnum.SkeletonMonster]: {
    name: "monster.undead.name.skeletonMonster",
    members: [MonsterEnum.SkeletonMonster],
  },
  [EntryEnum.SkeletonWarrior]: {
    name: "monster.undead.name.skeletonWarrior",
    members: [MonsterEnum.SkeletonWarrior],
  },
  [EntryEnum.DeathKnight]: {
    name: "monster.undead.name.deathKnight",
    members: [MonsterEnum.DeathKnight],
  },
  [EntryEnum.Spectre]: { name: "monster.undead.name.spectre", members: [MonsterEnum.Spectre] },
  [EntryEnum.Ghost]: { name: "monster.undead.name.ghost", members: [MonsterEnum.Ghost] },
  [EntryEnum.Wight]: { name: "monster.undead.name.wight", members: [MonsterEnum.Wight] },
  [EntryEnum.Wraith]: { name: "monster.undead.name.wraith", members: [MonsterEnum.Wraith] },
};

const entryIds = Object.values(EntryEnum).filter((v): v is EntryEnum => typeof v === "number");

function mapEntries<V>(f: (id: EntryEnum) => V): Record<EntryEnum, V> {
  return Object.fromEntries(entryIds.map((id) => [id, f(id)])) as Record<EntryEnum, V>;
}

/** Docs name of a multi-member entry; a single-member entry is named after its creature. */
export const ENTRY_NAMES: Record<EntryEnum, TranslationKey> = mapEntries((id) => ENTRIES[id].name);

/**
 * The creatures of each entry, in declaration (= install and docs) order. Checked against a full
 * build by entry.test.ts: every built creature appears exactly once.
 */
export const ENTRY_MEMBERS: Record<EntryEnum, MonsterEnum[]> = mapEntries(
  (id) => ENTRIES[id].members,
);

/** Entry folder name under `lib/pnp-monster/`: the kebab-case enum key ("clay-golem"). */
export const ENTRY_FOLDERS: Record<EntryEnum, string> = mapEntries((id) =>
  EntryEnum[id].replace(/(?<=[a-z0-9])([A-Z])/g, "-$1").toLowerCase(),
);
