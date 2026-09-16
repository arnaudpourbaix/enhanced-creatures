import { CreatureFamily } from "../../src/model/creature/family";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { berserker } from "./berserker";
import { halfOgre } from "./half-ogre";
import { Ogre } from "./ogre-creature";
import { ogre } from "./ogre";
import { ogreMage } from "./ogre-mage";
import { ogrillon } from "./ogrillon";
import { shaman } from "./shaman";

export class OgreFamily extends CreatureFamily<Ogre> {
  constructor() {
    super(MonsterFamilyEnum.Ogre);
    this.addCreature(() => ogre(this));
    this.addCreature(() => ogrillon(this));
    this.addCreature(() => halfOgre(this));
    this.addCreature(() => ogreMage(this));
    this.addCreature(() => berserker(this));
    this.addCreature(() => shaman(this));
  }

  createCreature(id: MonsterEnum): Ogre {
    return new Ogre(id);
  }
}

export const createOgres = () => new OgreFamily();
