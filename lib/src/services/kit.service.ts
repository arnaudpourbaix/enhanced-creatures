import { KITS } from "../../config/kit-ability";
import { CreatureAdjustment } from "../model/creature/adjustment";
import { BaseCreature, Creature } from "../model/creature/creature";
import { Level } from "../model/creature/data";
import { KitAbility, KitConfig } from "../model/creature/kit";
import { ImmunityName } from "../model/final/immunity";
import logService from "./log.service";
import spellService from "./spell.service";
import translationService from "./translation.service";

class KitService {
  applyKit(creature: Creature, baseCreature: BaseCreature | undefined) {
    const base = baseCreature ?? creature;
    const rootKit =
      KITS.find((k) => creature.data.kit === k.name) ??
      this.resolveInheritedKit(creature, baseCreature);
    const childKit = KITS.find((k) => base.data.kit === k.name);
    const kit = childKit ?? rootKit;
    if (!kit) return;
    if (rootKit && childKit && rootKit.name !== childKit.name && baseCreature) {
      this.removeKit(baseCreature, rootKit);
    }
    const level = this.resolveLevel(creature, baseCreature);
    const previousLevel = this.resolvePreviousLevel(creature, baseCreature);
    this.applyKitImmunities(creature, base, kit.immunities(level.pnpValue));
    this.applyKitAbilities(creature, base, kit.abilities, level.pnpValue, previousLevel.pnpValue);
  }

  /**
   * The kit already in effect for this block, set by an earlier adjustment that shares one of
   * its files. Adjustments are checked in isolation but stack at patch time, so a later
   * pure-`{ level1: N }` block still needs to know the kit an earlier block gave it - e.g.
   * ogres.ts's bg2 Tazok `{ level1: 19 }` after the `{ kit: "BERSERKER" }` block, which must
   * then emit `count(19) - count(9)` extra rages rather than nothing.
   */
  private resolveInheritedKit(
    creature: Creature,
    adjustment: BaseCreature | undefined,
  ): KitConfig | undefined {
    if (!adjustment) return undefined;
    const current = adjustment as CreatureAdjustment;
    let kit: KitConfig | undefined;
    for (const prior of creature.adjustments) {
      if (prior === current) break;
      if (prior.files.some((f) => current.files.includes(f))) {
        kit = KITS.find((k) => prior.data.kit === k.name) ?? kit;
      }
    }
    return kit;
  }

  /**
   * The level a kit sees for THIS block. `check()` runs `applyKit` on each adjustment in
   * isolation, but adjustments stack cumulatively at patch time - so a kit block that omits its
   * own `level1` (e.g. ogres.ts's Tazok `{ kit: "BERSERKER" }`, whose level 9 is set by an
   * earlier `{ files: [...TAZOK...], level1: 9 }` block) inherits the level from the most recent
   * earlier adjustment sharing one of its files, not the base creature's starting level.
   */
  private resolveLevel(creature: Creature, adjustment: BaseCreature | undefined): Level {
    if (!adjustment) return creature.data.level1;
    const current = adjustment as CreatureAdjustment;
    return current.data.level1 ?? this.resolvePreviousLevel(creature, adjustment);
  }

  /**
   * The cumulative level in effect just BEFORE this block runs - the base creature's level,
   * overridden by each earlier adjustment (in list order) that sets `level1` and shares a file
   * with this block. `applyKitAbilities` subtracts this block's memorized count so overlapping
   * leveled blocks each add only their own increment instead of re-counting from the base level.
   */
  private resolvePreviousLevel(creature: Creature, adjustment: BaseCreature | undefined): Level {
    let level = creature.data.level1;
    if (!adjustment) return level;
    const current = adjustment as CreatureAdjustment;
    for (const prior of creature.adjustments) {
      if (prior === current) break;
      if (prior.data.level1 && prior.files.some((f) => current.files.includes(f))) {
        level = prior.data.level1;
      }
    }
    return level;
  }

  applyKitImmunities(creature: Creature, baseCreature: BaseCreature, immunities: ImmunityName[]) {
    // immunities is required by CreatureData, but defended anyway - see kit.service.test.ts's
    // "initializes baseCreature.data.immunities when unset".
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    baseCreature.data.immunities ??= [];
    for (const name of immunities) {
      if (
        !creature.data.immunities.includes(name) &&
        !baseCreature.data.immunities.includes(name)
      ) {
        baseCreature.data.immunities.push(name);
      }
    }
  }

  applyKitAbilities(
    creature: Creature,
    baseCreature: BaseCreature,
    abilities: KitAbility[],
    level: number,
    previousLevel: number = creature.data.level1.pnpValue,
  ) {
    for (const ability of abilities) {
      let memorizedCount = ability.count(level);
      if (!baseCreature.data.kit) {
        memorizedCount -= ability.count(previousLevel);
      }
      const spell = spellService.getSpellInfo(ability.resource);
      const name = spell.name ? translationService.from(spell.name) : ability.resource;
      if (memorizedCount > 0) {
        logService.info(`adding ${name} (x${memorizedCount}) to memorized spells`);
        baseCreature.data.spells.memorized.push({
          file: ability.resource,
          memorizedCount,
        });
      }
      if (!creature.behavior.abilities.some((a) => a.resource === spell.file)) {
        logService.info(`adding ${name} to abilities`);
        creature.setBehavior({ abilities: [{ preset: ability.resource }] });
      }
    }
  }

  removeKit(baseCreature: BaseCreature, kit: KitConfig) {
    if (typeof baseCreature.data.spells.removeMemorized === "boolean") {
      throw new Error(`removeMemorized already set`);
    }
    // safe as ??= only here: the boolean case (where `false` must not be overwritten) already
    // threw above, so removeMemorized can only be string[] | undefined at this point.
    baseCreature.data.spells.removeMemorized ??= [];
    for (const ability of kit.abilities) {
      baseCreature.data.spells.removeMemorized.push(ability.resource);
    }
  }
}

const kitService = new KitService();
export default kitService;
