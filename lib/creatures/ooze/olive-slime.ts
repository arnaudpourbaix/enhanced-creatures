import { NEW_CREATURES } from "../../config/creatures";
import { Durations } from "../../src/model/game-data/durations";
import { EffectDamageTypeEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Slime, SlimeIds } from "./kin";

class OliveSlimeEntry extends CreatureEntry<Slime> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.OliveSlime, kin, MonsterFamilyEnum.Ooze);
    this.addCreature(() => this.oliveSlime());
  }

  createCreature(id: MonsterEnum): Slime {
    return new Slime(id);
  }

  /**
   * Olive Slime
   */
  private oliveSlime() {
    const olive = this.create({
      monster: MonsterEnum.OliveSlime,
      name: "monster.slime.name.olive",
      files: [],
      data: {
        level1: 2,
        bonusHp: 2,
        strength: 4,
        dexterity: 12,
        constitution: 8,
        intelligence: 0,
        wisdom: 3,
        charisma: 1,
        ac: 9,
        apr: 1,
        xpv: 420,
        alignment: "NEUTRAL",
        morale: 10,
        general: "MONSTER",
        race: "SLIME",
        class: "OLIVE_SLIME",
        gender: "NIETHER",
        size: { value: "Small", tall: false, long: true },
        movement: 0,
        immunities: ["ooze"],
        items: {
          remove: ["RING95", "JELLGR1", "JELLGRSU", "DW#JELGR", "GORJELGR", "GORJELFU"],
        },
        script: {
          remove: ["GORJELFU"],
        },
      },
    });
    olive.addTrait({
      // Olive slime is harmed only by acid, freezing cold, fire, or by a cure disease spell.
      // Spells that affect plants will work on olive slime, although entangle will have no practical effect.
      immunities: ["magic", "physicalDamage"],
    });
    olive.createAttachToLivingFlesh({
      id: SlimeIds.AttachToLivingFleshOliveSlime,
      description: "monster.slime.ability.attachToLivingFlesh.descriptionOlive",
      delay: Durations.day,
      resource: NEW_CREATURES.OliveSlimeCreature,
    });
    olive.createPseudopod({
      diceThrown: 0,
      diceSize: 0,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Acid,
          diceThrown: 1,
          diceSize: 4,
        },
      ],
      castSpell: {
        spell: this.spell(SlimeIds.AttachToLivingFleshOliveSlime).file,
        doc: "both",
      },
    });
    olive.setBehavior({
      restHeal: true,
    });
    olive.setAdjustments([
      { files: ["GORJELF2", "GORJELFU"], stringRef: "monster.slime.name.olive" },
    ]);
    return olive;
  }
}

export const createOliveSlimeEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new OliveSlimeEntry(kins.get(KinEnum.Ooze));
