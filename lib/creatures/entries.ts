import { Creature } from "../src/model/creature/creature";
import { CreatureEntry } from "../src/model/creature/entry";
import { CreatureKin } from "../src/model/creature/kin";
import { KinEnum } from "./kin";
import { createAnkhegEntry } from "./ankheg";
import { createBasiliskEntry } from "./basilisk";
import { createCarrionCrawlerEntry } from "./carrion-crawler";
import { createEttercapEntry } from "./ettercap";
import { createEttinEntry } from "./ettin";
import { createMinotaurEntry } from "./minotaur";
import { createTreantEntry } from "./treant";
import { createGiantPoisonousSnakeEntry } from "./giant-poisonous-snake";
import { createWyvernEntry } from "./wyvern";
import { createBlackBearEntry } from "./bear/black-bear";
import { createBrownBearEntry } from "./bear/brown-bear";
import { createCaveBearEntry } from "./bear/cave-bear";
import { createGrizzlyBearEntry } from "./bear/grizzly-bear";
import { createPolarBearEntry } from "./bear/polar-bear";
import { createCheetahEntry } from "./cat/cheetah";
import { createGiantLynxEntry } from "./cat/giant-lynx";
import { createJaguarEntry } from "./cat/jaguar";
import { createLeopardEntry } from "./cat/leopard";
import { createLionEntry } from "./cat/lion";
import { createMountainLionEntry } from "./cat/mountain-lion";
import { createSpottedLionEntry } from "./cat/spotted-lion";
import { createWildTigerEntry } from "./cat/wild-tiger";
import { createHellcatEntry } from "./cat/hellcat";
import { createDisplacerBeastEntry } from "./cat/displacer-beast";
import { createWildDogEntry } from "./dog/wild-dog";
import { createWarDogEntry } from "./dog/war-dog";
import { createBlinkDogEntry } from "./dog/blink-dog";
import { createSpectralHoundEntry } from "./dog/spectral-hound";
import { createMoonDogEntry } from "./dog/moon-dog";
import { createHellHoundEntry } from "./dog/hell-hound";
import { createWolfEntry } from "./wolf/wolf";
import { createDireWolfEntry } from "./wolf/dire-wolf";
import { createDreadWolfEntry } from "./wolf/dread-wolf";
import { createVampiricWolfEntry } from "./wolf/vampiric-wolf";
import { createWinterWolfEntry } from "./wolf/winter-wolf";
import { createWorgEntry } from "./wolf/worg";
import { createHelmedHorrorEntry } from "./construct/helmed-horror";
import { createBattleHorrorEntry } from "./construct/battle-horror";
import { createDoomSayerEntry } from "./construct/doom-sayer";
import { createDoomGuardEntry } from "./construct/doom-guard";
import { createFleshGolemEntry } from "./golem/flesh-golem";
import { createSandGolemEntry } from "./golem/sand-golem";
import { createClayGolemEntry } from "./golem/clay-golem";
import { createStoneGolemEntry } from "./golem/stone-golem";
import { createIronGolemEntry } from "./golem/iron-golem";
import { createBoneGolemEntry } from "./golem/bone-golem";
import { createJuggernautGolemEntry } from "./golem/juggernaut-golem";
import { createSnowGolemEntry } from "./golem/snow-golem";
import { createMagicGolemEntry } from "./golem/magic-golem";
import { createAdamantiteGolemEntry } from "./golem/adamantite-golem";
import { createWaxGolemEntry } from "./golem/wax-golem";
import { createOgreEntry } from "./ogre/ogre";
import { createOgrillonEntry } from "./ogre/ogrillon";
import { createHalfOgreEntry } from "./ogre/half-ogre";
import { createOgreMageEntry } from "./ogre/ogre-mage";
import { createOgreBerserkerEntry } from "./ogre/ogre-berserker";
import { createOgreShamanEntry } from "./ogre/ogre-shaman";
import { createDryadEntry } from "./fey/dryad";
import { createHamadryadEntry } from "./fey/hamadryad";
import { createNymphEntry } from "./fey/nymph";
import { createSirineEntry } from "./fey/sirine";
import { createNereidEntry } from "./fey/nereid";
import { createBlackPuddingEntry } from "./ooze/black-pudding";
import { createWhitePuddingEntry } from "./ooze/white-pudding";
import { createMustardJellyEntry } from "./ooze/mustard-jelly";
import { createFissionSlimeEntry } from "./ooze/fission-slime";
import { createGrayOozeEntry } from "./ooze/gray-ooze";
import { createOchreJellyEntry } from "./ooze/ochre-jelly";
import { createGreenSlimeEntry } from "./ooze/green-slime";
import { createOliveSlimeEntry } from "./ooze/olive-slime";
import { createOliveSlimeCreatureEntry } from "./ooze/olive-slime-creature";
import { createSlitheringTrackerEntry } from "./ooze/slithering-tracker";
import { createGargantuanSpiderEntry } from "./spider/gargantuan-spider";
import { createGhostwalkSpiderEntry } from "./spider/ghostwalk-spider";
import { createGiantSpiderEntry } from "./spider/giant-spider";
import { createHairySpiderEntry } from "./spider/hairy-spider";
import { createHugeSpiderEntry } from "./spider/huge-spider";
import { createHuntingSpiderEntry } from "./spider/hunting-spider";
import { createPhaseSpiderEntry } from "./spider/phase-spider";
import { createSwordSpiderEntry } from "./spider/sword-spider";
import { createVortexSpiderEntry } from "./spider/vortex-spider";
import { createWraithSpiderEntry } from "./spider/wraith-spider";
import { createBansheeEntry } from "./banshee";
import { createGhoulEntry } from "./ghoul";
import { createGhastEntry } from "./ghast";
import { createMummyEntry } from "./mummy";
import { createShadowEntry } from "./shadow";
import { createBaneguardEntry } from "./baneguard";
import { createBonebatEntry } from "./bonebat";
import { createSkeletonEntry } from "./skeleton/skeleton";
import { createSpikeSkeletonEntry } from "./skeleton/spike-skeleton";
import { createArcherSkeletonEntry } from "./skeleton/archer-skeleton";
import { createGiantSkeletonEntry } from "./skeleton/giant-skeleton";
import { createSkeletonMonsterEntry } from "./skeleton/skeleton-monster";
import { createSkeletonWarriorEntry } from "./skeleton-warrior";
import { createDeathKnightEntry } from "./death-knight";
import { createSpectreEntry } from "./spectre";
import { createGhostEntry } from "./ghost";
import { createWightEntry } from "./wight";
import { createWraithEntry } from "./wraith";
import { createZombieEntry } from "./zombie";
import { createVampireEntry } from "./vampire";

/**
 * Entry factories, in install order. Each receives the built kins, to hand its own kin to the
 * entry (`kins.get(KinEnum.Fey)`).
 *
 * Load-bearing orders (a later entry reads what an earlier one built): Helmed Horror < Battle Horror <
 * Doom Sayer; Ogre < Ogre Shaman; Skeleton < Spike, Archer and Giant Skeletons, Skeleton Monster.
 */
export const entryFactories: ((kins: Map<KinEnum, CreatureKin>) => CreatureEntry<Creature>)[] = [
  createAnkhegEntry,
  createBasiliskEntry,
  createCarrionCrawlerEntry,
  createEttercapEntry,
  createEttinEntry,
  createMinotaurEntry,
  createTreantEntry,
  createGiantPoisonousSnakeEntry,
  createWyvernEntry,
  createBlackBearEntry,
  createBrownBearEntry,
  createCaveBearEntry,
  createGrizzlyBearEntry,
  createPolarBearEntry,
  createCheetahEntry,
  createGiantLynxEntry,
  createJaguarEntry,
  createLeopardEntry,
  createLionEntry,
  createMountainLionEntry,
  createSpottedLionEntry,
  createWildTigerEntry,
  createHellcatEntry,
  createDisplacerBeastEntry,
  createWildDogEntry,
  createWarDogEntry,
  createBlinkDogEntry,
  createSpectralHoundEntry,
  createMoonDogEntry,
  createHellHoundEntry,
  createWolfEntry,
  createDireWolfEntry,
  createDreadWolfEntry,
  createVampiricWolfEntry,
  createWinterWolfEntry,
  createWorgEntry,
  createHelmedHorrorEntry,
  createBattleHorrorEntry,
  createDoomSayerEntry,
  createDoomGuardEntry,
  createFleshGolemEntry,
  createSandGolemEntry,
  createClayGolemEntry,
  createStoneGolemEntry,
  createIronGolemEntry,
  createBoneGolemEntry,
  createJuggernautGolemEntry,
  createSnowGolemEntry,
  createMagicGolemEntry,
  createAdamantiteGolemEntry,
  createWaxGolemEntry,
  createOgreEntry,
  createOgrillonEntry,
  createHalfOgreEntry,
  createOgreMageEntry,
  createOgreBerserkerEntry,
  createOgreShamanEntry,
  createDryadEntry,
  createHamadryadEntry,
  createNymphEntry,
  createSirineEntry,
  createNereidEntry,
  createBlackPuddingEntry,
  createWhitePuddingEntry,
  createMustardJellyEntry,
  createFissionSlimeEntry,
  createGrayOozeEntry,
  createOchreJellyEntry,
  createGreenSlimeEntry,
  createOliveSlimeEntry,
  createOliveSlimeCreatureEntry,
  createSlitheringTrackerEntry,
  createGargantuanSpiderEntry,
  createGhostwalkSpiderEntry,
  createGiantSpiderEntry,
  createHairySpiderEntry,
  createHugeSpiderEntry,
  createHuntingSpiderEntry,
  createPhaseSpiderEntry,
  createSwordSpiderEntry,
  createVortexSpiderEntry,
  createWraithSpiderEntry,
  createBansheeEntry,
  createGhoulEntry,
  createGhastEntry,
  createMummyEntry,
  createShadowEntry,
  createBaneguardEntry,
  createBonebatEntry,
  createSkeletonEntry,
  createSpikeSkeletonEntry,
  createArcherSkeletonEntry,
  createGiantSkeletonEntry,
  createSkeletonMonsterEntry,
  createSkeletonWarriorEntry,
  createDeathKnightEntry,
  createSpectreEntry,
  createGhostEntry,
  createWightEntry,
  createWraithEntry,
  createZombieEntry,
  createVampireEntry,
];
