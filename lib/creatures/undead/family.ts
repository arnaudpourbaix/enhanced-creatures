import { EntryEnum } from "../entry";
import { CreatureFamily } from "../../src/model/creature/family";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { deathKnight } from "./death-knight";
import { ghast, ghoul, ghoulLord } from "./ghouls";
import { greaterMummy, mummy } from "./mummies";
import {
  archerSkeleton,
  baneguard,
  bonebat,
  giantSkeleton,
  skeleton,
  skeletonMonster,
  spikeSkeleton,
} from "./skeletons";
import { skeletonWarrior } from "./skeletons-warrior";
import { banshee, ghost, greaterShadow, shadow, spectre, wraith } from "./spectral";
import { applyTurnLevel } from "./turn-level";
import { Undead } from "./undead-creature";
import {
  ancientVampire,
  eminentVampire,
  fledglingVampire,
  matureVampire,
  oldVampire,
  patriarchVampire,
  veryOldVampire,
} from "./vampires";
import { jujuZombie, seaZombie, wight, zombie, zombieLord } from "./zombies";

export class UndeadFamily extends CreatureFamily<Undead> {
  constructor() {
    super(MonsterFamilyEnum.Undead);
    this.addCreature(() => banshee(this));
    this.addEntry(EntryEnum.Ghoul, [() => ghoul(this), () => ghoulLord(this)]);
    this.addCreature(() => ghast(this));
    this.addEntry(EntryEnum.Mummy, [() => mummy(this), () => greaterMummy(this)]);
    this.addEntry(EntryEnum.Shadow, [() => shadow(this), () => greaterShadow(this)]);
    this.addCreature(() => baneguard(this));
    this.addCreature(() => bonebat(this));
    this.addCreature(() => skeleton(this));
    this.addCreature(() => spikeSkeleton(this));
    this.addCreature(() => archerSkeleton(this));
    this.addCreature(() => giantSkeleton(this));
    this.addCreature(() => skeletonMonster(this));
    this.addCreature(() => skeletonWarrior(this));
    this.addCreature(() => deathKnight(this));
    // this.addCreature(() => deathShade(this));
    this.addCreature(() => spectre(this));
    this.addCreature(() => ghost(this));
    this.addCreature(() => wight(this));
    this.addCreature(() => wraith(this));
    this.addEntry(EntryEnum.Zombie, [() => zombie(this), () => zombieLord(this)]);
    this.addCreature(() => jujuZombie(this));
    this.addCreature(() => seaZombie(this));
    this.addEntry(EntryEnum.Vampire, [
      () => fledglingVampire(this),
      () => matureVampire(this),
      () => oldVampire(this),
      () => veryOldVampire(this),
      () => ancientVampire(this),
      () => eminentVampire(this),
      () => patriarchVampire(this),
    ]);
  }
  createCreature(id: MonsterEnum): Undead {
    return new Undead(id);
  }

  protected override afterBuild(creature: Undead): void {
    applyTurnLevel(creature);
  }
}

export const createUndeads = () => new UndeadFamily();
