import { CreatureFamily } from "../../src/model/creature/family";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { ghast, ghoul, ghoulLord } from "./ghouls";
import { greaterMummy, mummy } from "./mummies";
import {
  archerSkeleton,
  baneguard,
  bonebat,
  skeleton,
  skeletonMonster,
  skeletonWarrior,
} from "./skeletons";
import { banshee, ghost, greaterShadow, shadow, spectre } from "./spectral";
import { Undead } from "./undead-creature";

export class UndeadFamily extends CreatureFamily<Undead> {
  constructor() {
    super(MonsterFamilyEnum.Undead);
    this.addCreature(() => banshee(this));
    // this.addCreature(() => deathKnight(this));
    // this.addCreature(() => deathShade(this));
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
    this.addCreature(() => archerSkeleton(this));
    this.addCreature(() => skeletonMonster(this));
    this.addCreature(() => skeletonWarrior(this));
    this.addCreature(() => spectre(this));
    this.addCreature(() => ghost(this));
    // this.addCreature(() => wight(this));
    // this.addCreature(() => wraith(this));
    // this.addCreature(() => zombie(this));
    // this.addCreature(() => zombieJuju(this));
    // this.addCreature(() => zombieSea(this));
  }
  createCreature(id: MonsterEnum): Undead {
    return new Undead(id);
  }
}

export const createUndeads = () => new UndeadFamily();
