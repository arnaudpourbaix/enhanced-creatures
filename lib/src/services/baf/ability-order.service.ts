import { AbilityAnchor, AbilityEntry, RawCreatureAbility } from "../../model/creature/ability";
import { Creature } from "../../model/creature/creature";
import creatureService from "../creature.service";
import logService from "../log.service";
import spellComboService from "../spell-combo.service";
import spellProfileService, { SpellProfile } from "../spell-profile.service";
import spellService from "../spell.service";
import castOrderService, { PlannedCast } from "./cast-order.service";
import translationService from "../translation.service";

interface OrderedAbility {
  identity: string;
  ability: RawCreatureAbility;
}

class AbilityOrderService {
  resolve(creature: Creature): RawCreatureAbility[] {
    const entries = creature.pendingAbilityEntries ?? [];
    this.validateEntries(entries);
    const alreadyCastFiles = [
      ...creature.behavior.abilities,
      ...creature.behavior.customCodes.flatMap((c) => c.abilities),
    ].flatMap((a) => creatureService.getAbilityCastFiles(a));
    const explicitFiles = new Set([
      ...alreadyCastFiles,
      ...entries.map((e) => this.cast(e, creature).identity),
    ]);
    const memorizedFiles = creatureService.memorizedSpellFiles(creature);
    // self contingencies have no ability: they are precast (see StatementBuilderService)
    const autoFiles = memorizedFiles.filter(
      (file) => !explicitFiles.has(file) && !spellComboService.isSelfContingencyFile(file),
    );

    // Enemy contingencies come first: they only fire once their condition happens.
    const contingencies = autoFiles.filter((file) =>
      spellComboService.isEnemyContingencyFile(file),
    );
    const profiles = autoFiles
      .filter((file) => !contingencies.includes(file))
      .map((file) => this.profile(file, creature));
    // an entry without a position (an at-will power) takes its place by score, when it has one
    const scoredEntries = new Map<string, AbilityEntry>();
    for (const entry of entries) {
      const profile = this.unplacedProfile(entry, creature);
      if (!profile) continue;
      profiles.push(profile);
      scoredEntries.set(profile.file, entry);
    }
    const plan = castOrderService.plan(profiles);
    this.logPlan(plan);
    const ordered: OrderedAbility[] = [
      ...contingencies.map((file) => ({ identity: file, ability: { preset: file } })),
      ...plan.map((cast): OrderedAbility => {
        const entry = scoredEntries.get(cast.file);
        const ability = entry ? this.cast(entry, creature).ability : { preset: cast.file };
        return { identity: cast.file, ability: { ...ability, probability: cast.probability } };
      }),
    ];

    for (const entry of entries) {
      if ([...scoredEntries.values()].includes(entry)) continue;
      this.splice(ordered, this.cast(entry, creature), entry, creature);
    }

    return ordered.map((o) => o.ability);
  }

  private profile(file: string, creature: Creature): SpellProfile {
    const profile = spellProfileService.profileOf(file, creature);
    if (!profile) throw new Error(`Memorized spell '${file}' has no spell profile`);
    return profile;
  }

  /** The profile of an entry without a position (an at-will power), placed by its score. */
  private unplacedProfile(entry: AbilityEntry, creature: Creature): SpellProfile | undefined {
    const positions = [entry.insertBefore, entry.insertAfter, entry.insertFirst, entry.insertLast];
    if (positions.some((p) => p !== undefined)) return undefined;
    if (entry.power) return spellProfileService.profileOfSpell(entry.power);
    if (entry.abilityId === undefined) return undefined;
    return spellProfileService.profileOf(creature.spell(entry.abilityId).file, creature);
  }

  /** What an entry casts (its file) and the ability casting it. */
  private cast(entry: AbilityEntry, creature: Creature): OrderedAbility {
    if (entry.spell) return { identity: entry.spell.file, ability: { preset: entry.spell.file } };
    if (entry.power) {
      if (!entry.power.ability) throw new Error(`Power ${entry.power.file} has no ability`);
      return { identity: entry.power.file, ability: entry.power.ability };
    }
    if (entry.abilityId === undefined) {
      throw new Error("AbilityEntry must set exactly one of spell/abilityId/power");
    }
    return {
      identity: creature.spell(entry.abilityId).file,
      ability: creature.ability(entry.abilityId),
    };
  }

  /** The creature's cast order, under its log section, for review. */
  private logPlan(plan: PlannedCast[]): void {
    for (const cast of plan) {
      const name = spellService.getSpellName(cast.file) ?? "";
      logService.log(`Cast order: ${cast.file} ${name} ${cast.score} ${cast.probability}%`);
    }
  }

  private validateEntries(entries: AbilityEntry[]): void {
    for (const entry of entries) {
      const kinds = [entry.spell, entry.abilityId, entry.power].filter((k) => k !== undefined);
      if (kinds.length !== 1) {
        throw new Error(
          `Ability entry must set exactly one of 'spell', 'abilityId' or 'power': ${JSON.stringify(entry)}`,
        );
      }
      const positions = [
        entry.insertBefore,
        entry.insertAfter,
        entry.insertFirst,
        entry.insertLast,
      ];
      if (positions.filter((p) => p !== undefined).length > 1) {
        throw new Error(
          `Ability entry must set at most one of insertBefore/insertAfter/insertFirst/insertLast: ${JSON.stringify(entry)}`,
        );
      }
    }
  }

  private splice(
    ordered: OrderedAbility[],
    item: OrderedAbility,
    entry: AbilityEntry,
    creature: Creature,
  ): void {
    if (entry.insertFirst) {
      ordered.unshift(item);
      return;
    }
    const anchor = entry.insertBefore ?? entry.insertAfter;
    if (anchor === undefined) {
      ordered.push(item);
      return;
    }
    const anchorIdentity = this.resolveAnchor(anchor, creature);
    const anchorIndex = ordered.findIndex((o) => o.identity === anchorIdentity);
    if (anchorIndex === -1) {
      logService.error(
        `${translationService.from(creature.name)}: ability anchor '${anchorIdentity}' not found - appending '${item.identity}' at the end instead.`,
      );
      ordered.push(item);
      return;
    }
    ordered.splice(entry.insertBefore !== undefined ? anchorIndex : anchorIndex + 1, 0, item);
  }

  private resolveAnchor(anchor: AbilityAnchor, creature: Creature): string {
    if (typeof anchor === "number") return creature.spell(anchor).file;
    if (typeof anchor === "string") return anchor;
    return anchor.file;
  }
}

const abilityOrderService = new AbilityOrderService();
export default abilityOrderService;
