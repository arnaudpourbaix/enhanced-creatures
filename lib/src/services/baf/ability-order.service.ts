import { SPELL_PRIORITY_ORDER } from "../../../config/spell-priority-order";
import { AbilityAnchor, AbilityEntry, RawCreatureAbility } from "../../model/creature/ability";
import { Creature } from "../../model/creature/creature";
import creatureService from "../creature.service";
import logService from "../log.service";
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
      ...(entries
        .map((e) => {
          if (e.spell) return e.spell.file;
          if (e.abilityId !== undefined) return creature.spell(e.abilityId).file;
          return undefined;
        })
        .filter((f) => f !== undefined) as string[]),
    ]);
    const memorizedFiles = creatureService.memorizedSpellFiles(creature);
    const autoFiles = memorizedFiles.filter((file) => !explicitFiles.has(file));

    // A memorized spell missing from SPELL_PRIORITY_ORDER isn't an error - it just casts
    // last, after everything explicitly ordered (Infinity sorts after every real index).
    // Still worth a warning: silently deprioritizing something is easy to miss otherwise.
    const ordered: OrderedAbility[] = autoFiles
      .map((file) => {
        const index = SPELL_PRIORITY_ORDER.indexOf(file);
        if (index === -1) {
          logService.warn(
            `${translationService.from(creature.name)}: spell '${file}' is memorized but is missing from SPELL_PRIORITY_ORDER - casting last by default. Add it there to give it a real priority.`,
          );
        }
        return { identity: file, index: index === -1 ? Infinity : index };
      })
      .sort((a, b) => a.index - b.index)
      .map(({ identity }): OrderedAbility => ({ identity, ability: { preset: identity } }));

    for (const entry of entries) {
      const identity = entry.spell ? entry.spell.file : creature.spell(entry.abilityId!).file;
      const ability: RawCreatureAbility = entry.spell
        ? { preset: entry.spell.file }
        : creature.ability(entry.abilityId!);
      this.splice(ordered, { identity, ability }, entry, creature);
    }

    return ordered.map((o) => o.ability);
  }

  private validateEntries(entries: AbilityEntry[]): void {
    for (const entry of entries) {
      if ((entry.spell !== undefined) === (entry.abilityId !== undefined)) {
        throw new Error(
          `Ability entry must set exactly one of 'spell' or 'abilityId': ${JSON.stringify(entry)}`,
        );
      }
      const positions = [entry.insertBefore, entry.insertAfter, entry.insertFirst, entry.insertLast];
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
