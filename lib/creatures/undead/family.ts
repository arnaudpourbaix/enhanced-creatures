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
    this.addCreature(() => ghoul(this));
    this.addCreature(() => ghast(this));
    this.addCreature(() => ghoulLord(this));
    this.addCreature(() => mummy(this));
    this.addCreature(() => greaterMummy(this));
    this.addCreature(() => shadow(this));
    this.addCreature(() => greaterShadow(this));
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
    this.addCreature(() => zombie(this));
    this.addCreature(() => jujuZombie(this));
    this.addCreature(() => zombieLord(this));
    this.addCreature(() => seaZombie(this));
    this.addCreature(() => fledglingVampire(this));
    this.addCreature(() => matureVampire(this));
    this.addCreature(() => oldVampire(this));
    this.addCreature(() => veryOldVampire(this));
    this.addCreature(() => ancientVampire(this));
    this.addCreature(() => eminentVampire(this));
    this.addCreature(() => patriarchVampire(this));
  }
  createCreature(id: MonsterEnum): Undead {
    return new Undead(id);
  }

  protected override afterBuild(creature: Undead): void {
    applyTurnLevel(creature);
  }
}

export const createUndeads = () => new UndeadFamily();
