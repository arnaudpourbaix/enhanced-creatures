import { SPELLS } from "../../config/spells/spell-database";
import { AdditionalCode } from "../../src/model/script/script";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Fey, FeyIds } from "./kin";

class NymphEntry extends CreatureEntry<Fey> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Nymph, kin, MonsterFamilyEnum.Fey);
    this.addCreature(() => this.nymph());
  }

  createCreature(id: MonsterEnum): Fey {
    return new Fey(id);
  }

  /**
   * Nymph
   */
  private nymph() {
    const nymph = this.create({
      monster: MonsterEnum.Nymph,
      name: "monster.fey.name.nymph",
      files: [],
      data: {
        level1: { pnpValue: 3, value: 7, type: "caster" }, // can employ druidical priest spells at 7th ability level
        strength: 10,
        dexterity: 17,
        constitution: 12,
        intelligence: 16,
        wisdom: 12,
        charisma: 19,
        ac: 7,
        apr: 0,
        xpv: 1400,
        alignment: "NEUTRAL_GOOD",
        morale: 7,
        general: "HUMANOID",
        race: "FAIRY",
        class: "DRUID", // FAIRY_NYMPH
        gender: "FEMALE",
        size: { value: "Medium", tall: true, long: false },
        movement: 12,
        immunities: ["fey"],
        items: { remove: ["DAGG01", "B1-6", "DVNYMPH", "ANTIWEB", "DAGG02", "HGNYMPH"] },
        script: { remove: ["BDNYMP01", "NYMPH", "DVNYMPH", "HGNYMPH"] },
        spells: {
          memorized: [
            {
              file: this.spell(FeyIds.PriestDimensionDoor).file,
              memorizedCount: 1,
            },
            { file: this.spell(FeyIds.AnimalFriendship).file, memorizedCount: 1 },
            { file: this.spell(FeyIds.BlindingBeauty).file, memorizedCount: 1 },
            { file: SPELLS.Priest.CureLightWounds.file, memorizedCount: 1 },
            { file: SPELLS.Priest.Bless.file, memorizedCount: 1 },
            { file: SPELLS.Priest.Entangle.file, memorizedCount: 1 },
            { file: SPELLS.Priest.Barkskin.file, memorizedCount: 1 },
            { file: SPELLS.Priest.CharmPersonOrAnimal.file, memorizedCount: 1 },
            { file: SPELLS.Priest.CallLightning.file, memorizedCount: 1 },
            { file: SPELLS.Priest.SummonInsects.file, memorizedCount: 1 },
            { file: SPELLS.Priest.CallWoodlandBeeings.file, memorizedCount: 1 },
          ],
        },
        effects: {
          remove: [EffectTypeEnum.ProtectionFromSpell],
        },
      },
    });
    nymph.addTrait({ immunities: ["magicResistance"] });
    nymph.setAttack({ melee: false });
    nymph.setBehavior({
      abilities: [
        this.ability(FeyIds.BlindingBeauty),
        this.ability(FeyIds.PriestDimensionDoor),
        {
          preset: SPELLS.Priest.CallWoodlandBeeings.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.Bless.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.Barkskin.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.CallLightning.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.SummonInsects.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.Entangle.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        {
          preset: SPELLS.Priest.CharmPersonOrAnimal.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
        this.ability(FeyIds.AnimalFriendship),
        {
          preset: SPELLS.Priest.CureLightWounds.file,
          spell: {
            type: "force",
            remove: true,
          },
        },
      ],
      additionalCodes: [this.nymphTrackTarget()],
    });
    nymph.setAdjustments([
      {
        files: ["BDNYMP02"],
        data: { alignment: "NEUTRAL_EVIL" },
      },
      {
        files: ["ABELA"],
        data: { spells: { removeMemorized: true } },
      },
      {
        files: ["OHDNYMPH"],
        data: { level1: { pnpValue: 4, value: 7, type: "caster" } },
      },
    ]);
    return nymph;
  }

  private nymphTrackTarget(): AdditionalCode {
    return {
      location: "trackTargets",
      triggers: [
        {
          name: "Or",
          triggers: [
            {
              name: "HaveSpellRES",
              params: [SPELLS.Priest.CallLightning.file],
            },
            {
              name: "HaveSpellRES",
              params: [SPELLS.Priest.CharmPersonOrAnimal.file],
            },
            {
              name: "HaveSpellRES",
              params: [SPELLS.Priest.SummonInsects.file],
            },
          ],
        },
      ],
      actions: [],
    };
  }
}

export const createNymphEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new NymphEntry(kins.get(KinEnum.Fey));
