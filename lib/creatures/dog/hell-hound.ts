import { SPELLS } from "../../config/spells/spell-database";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import {
  EffectDamageTypeEnum,
  EffectFlagsEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
  SpellFlagEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { PartialSpellHeader } from "../../src/model/spell-item/spell-item";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Dog, DogIds } from "./kin";

class HellHound extends Dog {
  /**
   * Hell Hound Breath Fire
   */
  createBreathFire() {
    const headers: PartialSpellHeader[] = [4, 5, 6, 7].map((level) => ({
      type: ItemAbilityTypeEnum.Melee,
      minLevel: level,
      range: 10,
      // projectile: "dvburnhd",
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Fire,
          amount: level,
          saveTypes: [SaveTypeEnum.Breath, SaveTypeEnum.BypassMirrorImage],
          flags: [EffectFlagsEnum.SaveForHalf],
        },
      ],
    }));
    return this.addSpell({
      name: "monster.dog.ability.breathFire.name",
      description: "monster.dog.ability.breathFire.description",
      id: DogIds.BreathFire,
      memorizedCount: 1,
      icon: SPELLS.Wizard.BurningHands.file,
      options: {
        renew: 1,
      },
      castingSound: "CAS_M08",
      flags: [SpellFlagEnum.BreakSanctuary],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 3 }],
        spell: {
          type: "force",
          remove: true,
        },
        range: 10,
      },
      keywords: ["fire", "area"],
      headers,
    });
  }
}

class HellHoundEntry extends CreatureEntry<HellHound> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.HellHound, kin);
    this.addCreature(() => this.hellHound());
  }

  createCreature(id: MonsterEnum): HellHound {
    return new HellHound(id);
  }

  /**
   * Hell Hound
   */
  private hellHound() {
    const hellHound = this.create({
      monster: MonsterEnum.HellHound,
      name: "monster.dog.name.hellHound",
      files: [],
      data: {
        level1: 4,
        strength: 17,
        dexterity: 12,
        constitution: 14,
        intelligence: 7,
        wisdom: 13,
        charisma: 6,
        ac: 4,
        apr: 1,
        xpv: 420,
        alignment: "LAWFUL_EVIL",
        morale: 13,
        general: "MONSTER",
        race: "DOG",
        class: "DOG_WAR",
        gender: "MALE",
        size: { value: "Medium", tall: false, long: true },
        movement: 12,
        items: {
          remove: ["P1-10", "HELLHO", "SEEINVIS"],
        },
        script: { remove: ["HELHOU01"] },
        immunities: ["outsider", "planarEssence"],
      },
    });
    hellHound.addTrait({
      immunities: ["fire", "backstab", "seeInvisible"],
    });
    hellHound.createBreathFire();
    // The hell hound can continue to exhale flame while biting.
    // If the hell hound rolls a natural 20 on its attack roll, it grabs a victim in its jaws and breathes fire on the victim.
    hellHound.createJaws({
      diceThrown: 1,
      diceSize: 10,
      castSpell: {
        probability1: 5,
        spell: this.spell(DogIds.BreathFire).file,
        doc: "both",
      },
      grab: {
        probability: 5,
        trigger: "probability",
      },
    });
    hellHound.setBehavior({
      abilities: [this.ability(DogIds.BreathFire)],
    });
    hellHound.setAdjustments([{ files: ["HELLHO01", "OBSFIR05"], data: { level1: 7, xpv: 1400 } }]);
    return hellHound;
  }
}

export const createHellHoundEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new HellHoundEntry(kins.get(KinEnum.Dog));
