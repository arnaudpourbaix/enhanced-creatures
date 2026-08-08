import logService from "../log.service";
import { ImmunityConfig, ImmunityName } from "../../model/final/immunity";
import { Durations } from "../../model/game-data/durations";
import {
  ArmorClassBonusEffect,
  CastingTimeModifierEffect,
  CastSpellEffect,
  CharmCreatureEffect,
  CurrentHPbonusEffect,
  DamageEffect,
  DiseaseEffect,
  Effect,
  IdsEffect,
  InvisibilityEffect,
  LevelDrainEffect,
  ModifierTypeEffect,
  PoisonEffect,
  RegenerationEffect,
  SleepEffect,
  StatisticModifierEffect,
} from "../../model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  CharmTypeEnum,
  DiseaseTypeEnum,
  EffectBonusToEnum,
  EffectDamageTypeEnum,
  EffectIDSFileEnum,
  EffectModifierTypeEnum,
  InvisibilityTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PoisonTypeEnum,
  RegenerationTypeEnum,
  SaveTypeEnum,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { Item, Spell, SpellHeader, Weapon } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import translationService from "../translation.service";

class DescriptionService {
  generateCreatureItems(items: Item[]): void {
    for (const item of items) {
      if (!item.description && item.header) this.generateWeaponDescription(item as Weapon);
      else if (!item.description && item.trait) this.generateItemTraitDescription(item);
    }
  }

  generateCreatureSpells(spells: Spell[]): void {
    for (const spell of spells) {
      if (!spell.description && spell.headers.length === 1)
        this.generateSpellDescription(spell, spell.headers[0]);
    }
  }

  generateImmunity(immunity: ImmunityConfig): void {
    if (immunity.description) return; // don't override
    const results: string[] = [];
    results.push(...this.getImmunitiesDescription(immunity.immunities));
    // effects is required by ImmunityConfig, but defended anyway (deliberate, see IMPROVEMENT_ROADMAP.md)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    for (const effect of immunity.effects ?? []) {
      results.push(...this.getEffectDescription(effect, ItemAbilityTargetEnum.Caster));
    }
    if (results.length) immunity.description = translationService.addCustomTranslation(results);
  }

  private getImmunitiesDescription(immunities: ImmunityName[], onlyName = false): string[] {
    const results: string[] = [];
    for (const name of immunities) {
      const immunity = State.immunities.find((i) => i.name === name);
      if (!immunity) continue;
      if (!immunity.stringRef && !immunity.description) this.generateImmunity(immunity);
      if (immunity.description && !onlyName)
        results.push(translationService.from(immunity.description));
      else if (immunity.stringRef) results.push(translationService.from(immunity.stringRef));
    }
    return results;
  }

  private generateWeaponDescription(item: Weapon) {
    const desc: string[] = [];
    const type = item.header.type === ItemAbilityTypeEnum.Melee ? "Melee" : "Ranged";
    if (item.header.bonusToHit) {
      desc.push(`THAC0: ${this.getSignedNumber(item.header.bonusToHit)}`);
    }
    const damage = this.getDiceValue({
      ...item.header,
      value: item.header.damageBonus,
    });
    if (damage) {
      const damageTypeLabel =
        item.header.damageType !== undefined ? AbilityDamageTypeEnum[item.header.damageType] : "";
      desc.push(`${type} damage: ${damage} (${damageTypeLabel})`);
    }
    const damageEffects = item.header.effects.filter((e) => e.opcode === EffectTypeEnum.Damage);
    const otherEffects = item.header.effects.filter((e) => e.opcode !== EffectTypeEnum.Damage);
    desc.push(
      ...this.getEffectsDescription(
        damageEffects,
        item.header.target ?? ItemAbilityTargetEnum.None,
      ),
    );
    if ((damage || damageEffects.length) && item.header.speed !== undefined) {
      desc.push(`Speed Factor: ${item.header.speed}`);
    }
    if (item.enchantment && item.enchantment > 0) {
      desc.push(`Enchantment: ${item.enchantment}`);
    }
    if (item.header.range) {
      desc.push(`Range: ${item.header.range} feet`);
    }
    desc.push(...this.getImmunitiesDescription(item.immunities));
    desc.push(
      ...this.getEffectsDescription(
        [...item.effects, ...otherEffects],
        item.header.target ?? ItemAbilityTargetEnum.None,
      ),
    );
    if (desc.length && item.stringRef) {
      desc.unshift(translationService.from(item.stringRef), "");
    }
    item.description = translationService.addCustomTranslation(desc);
  }

  private generateItemTraitDescription(item: Item) {
    const desc: string[] = [];
    // desc.push(translationService.from(item.stringRef!), "");
    desc.push(...this.getImmunitiesDescription(item.immunities, true));
    desc.push(...this.getEffectsDescription(item.effects, ItemAbilityTargetEnum.Caster));
    item.description = translationService.addCustomTranslation(desc);
  }

  private generateSpellDescription(spell: Spell, header: SpellHeader) {
    const desc: string[] = this.getEffectsDescription(
      header.effects,
      header.target ?? ItemAbilityTargetEnum.None,
    );
    spell.description = translationService.addCustomTranslation(desc);
  }

  private getEffectsDescription(effects: Effect[], target: ItemAbilityTargetEnum): string[] {
    const results: string[] = [];
    for (const effect of effects) {
      if (effect.opcode === EffectTypeEnum.CastSpell) {
        results.push(...this.getItemSpellDescription(effect));
      } else {
        results.push(...this.getEffectDescription(effect, target));
      }
    }
    return results;
  }

  private getItemSpellDescription(effect: CastSpellEffect): string[] {
    const spell = State.spells.find((s) => s.file === effect.resource);
    const name = spell ? translationService.from(spell.name) : (effect.resource ?? "");
    const saveText = this.getSaveText(effect);
    const probability = this.getProbability(effect);
    const condition = saveText || probability;
    const description = spell?.description ?? "";
    const text = `Cast spell ${name}${condition}${description ? ":" : ""}`;
    const results: string[] = ["", text];
    if (description) {
      results.push(translationService.from(description));
    }
    return results;
  }

  // Same shape as effect.service.ts's getEffect() opcode dispatch (see SONARJS_ROADMAP.md):
  // switched from an if/else-if chain to a switch, which Sonar's cognitive-complexity metric
  // counts as a single flat construct rather than one increment per branch - the domain
  // complexity (one branch per WeiDU opcode) is inherent and not something splitting into more
  // functions would reduce, just relocate.
  private getEffectDescription(effect: Effect, target: ItemAbilityTargetEnum): string[] {
    switch (effect.opcode) {
      case EffectTypeEnum.Panic:
        return this.getPanic(effect);
      case EffectTypeEnum.Damage:
        return this.getDamage(effect);
      case EffectTypeEnum.Poison:
        return this.getPoison(effect);
      case EffectTypeEnum.Disease:
        return this.getDisease(effect);
      case EffectTypeEnum.ArmorClassBonus:
        return this.getArmorClassBonus(effect);
      case EffectTypeEnum.Paralyze:
      case EffectTypeEnum.Hold:
        return this.getParalyze(effect, target);
      case EffectTypeEnum.InvisibilityDetection:
        return ["Can see invisible creatures."];
      case EffectTypeEnum.Blur:
        return ["Blur (visual effect only)"];
      // case EffectTypeEnum.Translucency:
      //   return ["Translucent"];
      case EffectTypeEnum.CurrentHPbonus:
        return this.getCurrentHPbonus(effect);
      case EffectTypeEnum.LevelDrain:
        return this.getLevelDrain(effect);
      case EffectTypeEnum.Sleep:
        return this.getSleep(effect);
      case EffectTypeEnum.Slow:
        return this.getSlow(effect, target);
      case EffectTypeEnum.Haste:
        return this.getHaste(effect, target);
      case EffectTypeEnum.Teleport:
        return this.getTeleport();
      case EffectTypeEnum.CharmCreature:
      case EffectTypeEnum.CharmControlCreature:
        return this.getCharm(effect, target);
      case EffectTypeEnum.AttackDamageBonus:
      case EffectTypeEnum.MovementRateBonus:
      case EffectTypeEnum.MovementRateBonus2:
      case EffectTypeEnum.Thac0Bonus:
      case EffectTypeEnum.OffhandThac0Bonus:
        return this.getModifierType(effect);
      case EffectTypeEnum.MirrorImageEffect:
        return [`Mirror image (${effect.amount})`];
      case EffectTypeEnum.Infravision:
        return [`Darkvision out to 60 feet`];
      case EffectTypeEnum.Invisibility:
        return this.getInvisibility(effect);
      case EffectTypeEnum.Regeneration:
        return this.getRegeneration(effect);
      case EffectTypeEnum.CastingTimeModifier:
        return this.getCastingTimeModifier(effect);
      default:
        if (this.getStatisticText(effect)) {
          return this.getStatisticModifier(effect as StatisticModifierEffect);
        }
        return [];
    }
  }

  getSaveText(effect: { saveTypes?: SaveTypeEnum[]; saveBonus?: number }): string {
    let save = "";
    const type = effect.saveTypes?.[0];
    if (type === SaveTypeEnum.ParalyzePoisonDeath) save = "poison/death";
    else if (type === SaveTypeEnum.Breath) save = "breath";
    else if (type === SaveTypeEnum.PetrifyPolymorph) save = "petrify/polymorph";
    else if (type === SaveTypeEnum.RodStaffWand) save = "wand";
    else if (type === SaveTypeEnum.Spell) save = "spell";
    const bonus = effect.saveBonus ? ` at ${this.getSignedNumber(effect.saveBonus)}` : "";
    return save ? ` (saves vs ${save}${bonus})` : "";
  }

  getProbability(effect: Effect): string {
    if (effect.probability2) {
      if (!effect.probability1 || effect.probability2 <= effect.probability1)
        throw new Error(
          `probability2 (${effect.probability2}) must be greater than probability1 (${effect.probability1 ?? "unset"})`,
        );
      return ` (${effect.probability2 - effect.probability1}%)`;
    }
    return effect.probability1 && effect.probability1 < 100 ? ` (${effect.probability1}%)` : "";
  }

  getTarget(target: ItemAbilityTargetEnum): string {
    switch (target) {
      case ItemAbilityTargetEnum.Caster:
        return "caster";
      case ItemAbilityTargetEnum.LivingActor:
        return "target";
      case ItemAbilityTargetEnum.AnyPointWithinRange:
        return "anyone within range";
      default:
        return "";
    }
  }

  getDuration(duration?: number, prefix?: string): string {
    if (!duration) return "";
    prefix ??= "";
    const time = [
      { single: "a day", plural: "days", duration: Durations.day },
      { single: "an hour", plural: "hours", duration: Durations.hour },
      { single: "a turn", plural: "turns", duration: Durations.turn },
      { single: "a round", plural: "rounds", duration: Durations.round },
      { single: "a second", plural: "seconds", duration: 1 },
    ];
    for (const t of time) {
      const count = Math.round(duration / t.duration);
      const modulo = duration % t.duration;
      if (count === 1 && modulo === 0) {
        return `${prefix}${t.single}`;
      } else if (count > 1 && modulo === 0) {
        return `${prefix}${count} ${t.plural}`;
      }
    }
    logService.warn(`unknown duration ${duration}s`);
    return `${duration}s`;
  }

  private getArmorClassBonus(effect: ArmorClassBonusEffect): string[] {
    if (effect.bonusTo === EffectBonusToEnum.SetBaseArmorClassToValue)
      return [`${effect.value} base AC`];
    const results: string[] = [];
    let suffix = "";
    if (effect.bonusTo === EffectBonusToEnum.CrushingWeapons) suffix = "crushing";
    else if (effect.bonusTo === EffectBonusToEnum.SlashingWeapons) suffix = "slashing";
    else if (effect.bonusTo === EffectBonusToEnum.PiercingWeapons) suffix = "piercing";
    else if (effect.bonusTo === EffectBonusToEnum.MissileWeapons) suffix = "missile";
    if (suffix) suffix = ` vs. ${suffix} attacks`;
    const duration = effect.duration ? ` for ${this.getDuration(effect.duration)}` : "";
    results.push(
      `${this.getSignedNumber(effect.value)} AC${suffix}${duration}${this.getSaveText(effect)}`,
    );
    return results;
  }

  private getInvisibility(effect: InvisibilityEffect): string[] {
    const results: string[] = [];
    if (effect.type === InvisibilityTypeEnum.Improved) results.push("Improved invisibility");
    else results.push(`Invisibility`);
    return results;
  }

  private getRegeneration(effect: RegenerationEffect): string[] {
    if (
      [RegenerationTypeEnum.AmountHPperSecond, RegenerationTypeEnum.AmountHPperSecondBis].includes(
        effect.type,
      )
    )
      return [`Regeneration: ${effect.amount} hp/second`];
    else if (effect.type === RegenerationTypeEnum.AmountHPpercentagePerSecond)
      return [`Regeneration: ${effect.amount}% hp/second`];
    else if (effect.amount === 6) return [`Regeneration: 1 hp/round`];
    const rounds = effect.amount / 6;
    if (rounds > 1 && effect.amount % 6 === 0) return [`Regeneration: 1 hp/${rounds} rounds`];
    return [`Regeneration: 1 hp/${effect.amount} seconds`];
  }

  private getParalyze(effect: IdsEffect, target: ItemAbilityTargetEnum): string[] {
    const results: string[] = [];
    const isUnrestricted = effect.idsFile === EffectIDSFileEnum.EA && effect.idsEntry === "ANYONE";
    const restriction =
      effect.idsEntry && !isUnrestricted
        ? ` (only affects ${this.toPascalCase(effect.idsEntry)})`
        : "";
    results.push(
      `Paralyze ${this.getTarget(target)} for ${this.getDuration(
        effect.duration,
      )}${restriction}${this.getSaveText(effect)}.`,
    );
    return results;
  }

  private toPascalCase(value: string): string {
    return value
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  private getCharm(effect: CharmCreatureEffect, target: ItemAbilityTargetEnum): string[] {
    const results: string[] = [];
    let type = "";
    switch (effect.charmType) {
      case CharmTypeEnum.NeutralCharm:
      case CharmTypeEnum.NeutralCharmNoFeedback:
      case CharmTypeEnum.ThrullCharm:
      case CharmTypeEnum.ThrullCharmNoFeedback:
        type = "Charm";
        break;
      case CharmTypeEnum.NeutralDireCharm:
      case CharmTypeEnum.NeutralDomination:
      case CharmTypeEnum.HostileDireCharm:
      case CharmTypeEnum.HostileDomination:
        type = "Dire Charm";
        break;
      case CharmTypeEnum.Controlled:
        type = "Turn";
        break;
    }
    results.push(
      `${type} ${this.getTarget(target)} for ${this.getDuration(
        effect.duration,
      )}${this.getSaveText(effect)}.`,
    );
    return results;
  }

  private getLevelDrain(effect: LevelDrainEffect): string[] {
    const results: string[] = [];
    results.push(`Drain ${effect.amount} level from target${this.getSaveText(effect)}.`);
    return results;
  }

  private getCastingTimeModifier(effect: CastingTimeModifierEffect): string[] {
    const results: string[] = [];
    results.push(`Casting time: ${effect.value} (${effect.type})`);
    return results;
  }

  private getStatisticModifier(effect: StatisticModifierEffect): string[] {
    const results: string[] = [];
    results.push(this.getStatisticText(effect) ?? "");
    return results;
  }

  private getCurrentHPbonus(effect: CurrentHPbonusEffect): string[] {
    const results: string[] = [];
    const heal = this.getDiceValue(effect);
    results.push(`Heal: ${heal}`);
    return results;
  }

  private getSleep(effect: SleepEffect): string[] {
    const results: string[] = [];
    const wake = effect.wakeOnDamage ? " (wake on damage)" : "";
    results.push(
      `Sleep for ${this.getDuration(effect.duration)}${wake}${this.getSaveText(effect)}`,
    );
    return results;
  }

  private getSlow(effect: Effect, target: ItemAbilityTargetEnum): string[] {
    return [
      `Slow ${this.getTarget(target)} for ${this.getDuration(
        effect.duration,
      )}${this.getSaveText(effect)}`,
    ];
  }

  private getHaste(effect: Effect, target: ItemAbilityTargetEnum): string[] {
    return [
      `Haste ${this.getTarget(target)} for ${this.getDuration(
        effect.duration,
      )}${this.getSaveText(effect)}`,
    ];
  }

  private getTeleport(): string[] {
    return [`Teleport to target`];
  }

  // opcode is typed as the full EffectTypeEnum (not ModifierTypeEffect's own narrower opcode
  // union) so the missing-label default branch stays real: the real dispatcher only ever calls
  // getModifierType() for opcodes already known to be one of the 4 handled here, but this keeps
  // the function itself defensive against being called directly with anything else.
  private getModifierTypeLabel(opcode: EffectTypeEnum): string {
    switch (opcode) {
      case EffectTypeEnum.AttackDamageBonus:
        return "Damage";
      case EffectTypeEnum.MovementRateBonus:
      case EffectTypeEnum.MovementRateBonus2:
        return "Movement rate";
      case EffectTypeEnum.Thac0Bonus:
        return "Thac0";
      case EffectTypeEnum.OffhandThac0Bonus:
        return "Offhand Thac0";
      default:
        return "";
    }
  }

  private getModifierType(effect: ModifierTypeEffect): string[] {
    const type = this.getModifierTypeLabel(effect.opcode);
    if (!type) return [];
    const value = [
      EffectModifierTypeEnum.MultiplyPercent,
      EffectModifierTypeEnum.SetPercentOf,
    ].includes(effect.type)
      ? `${effect.value}%`
      : this.getSignedNumber(effect.value);
    return [
      `${type}:${value}${this.getDuration(effect.duration, " for ")}${this.getSaveText(effect)}`,
    ];
  }

  private getPanic(effect: Effect): string[] {
    const results: string[] = [];
    results.push(`Panic for ${this.getDuration(effect.duration)}${this.getSaveText(effect)}`);
    return results;
  }

  private getDamage(effect: DamageEffect): string[] {
    const results: string[] = [];
    const amount = effect.amount ? this.getSignedNumber(effect.amount) : "";
    if (effect.diceSize && effect.diceThrown) {
      results.push(
        `${EffectDamageTypeEnum[effect.type]} damage: ${effect.diceThrown}D${
          effect.diceSize
        }${amount}`,
      );
    }
    return results;
  }

  private getPoison(effect: PoisonEffect): string[] {
    const text =
      effect.type === PoisonTypeEnum.AmountDamagePerSecond
        ? `${effect.amount} per second`
        : `one damage per ${this.getDuration(effect.amount)}`;
    const results: string[] = [];
    const level =
      effect.diceSize && effect.diceThrown ? `Level ${effect.diceSize}-${effect.diceThrown}: ` : "";
    results.push(
      `${level}Poison: deals ${text} for ${this.getDuration(
        effect.duration,
      )}${this.getSaveText(effect)}.`,
    );
    return results;
  }

  private getDisease(effect: DiseaseEffect): string[] {
    let text = "";
    switch (effect.type) {
      case DiseaseTypeEnum.OneDamagePerSecond:
        text = `one damage per second`;
        break;
      case DiseaseTypeEnum.OneDamagePerAmountSeconds:
        text = `one damage every ${this.getDuration(effect.amount)}`;
        break;
      case DiseaseTypeEnum.AmoundDamagePerRound:
        text = `${effect.amount} damage per round`;
        break;
      case DiseaseTypeEnum.AmountDamagePerSecond:
        text = `${effect.amount} damage per second`;
        break;
      case DiseaseTypeEnum.Contagion:
        text = ``;
        break;
      case DiseaseTypeEnum.MoldTouchDecrement:
        text = ``;
        break;
      case DiseaseTypeEnum.MoldTouchSingle:
        text = ``;
        break;
      case DiseaseTypeEnum.ReduceCharismaByAmount:
        text = `-${effect.amount} charisma`;
        break;
      case DiseaseTypeEnum.ReduceConstitutionByAmount:
        text = `-${effect.amount} constitution`;
        break;
      case DiseaseTypeEnum.ReduceDexterityByAmount:
        text = `-${effect.amount} dexterity`;
        break;
      case DiseaseTypeEnum.ReduceIntelligenceByAmount:
        text = `-${effect.amount} intelligence`;
        break;
      case DiseaseTypeEnum.ReduceStrengthByAmount:
        text = `-${effect.amount} strength`;
        break;
      case DiseaseTypeEnum.ReduceWisdomByAmount:
        text = `-${effect.amount} wisdom`;
        break;
      case DiseaseTypeEnum.SlowEffect:
        text = `slow`;
        break;
    }
    const results: string[] = [];
    results.push(
      `Disease: ${text} for ${this.getDuration(effect.duration)}${this.getSaveText(effect)}.`,
    );
    return results;
  }

  private getDiceValue(payload: { diceThrown?: number; diceSize?: number; value?: number }) {
    const dice =
      payload.diceThrown && payload.diceSize ? `${payload.diceThrown}D${payload.diceSize}` : "";
    const value = payload.value ? this.getSignedNumber(payload.value) : "";
    return dice ? `${dice}${value}` : value.replace(/^\+/, "");
  }

  private getSignedNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return "";
    else if (value <= 0) return `${value}`;
    return `+${value}`;
  }

  getStatisticText(effect: Effect) {
    const opcodes = [
      { opcode: EffectTypeEnum.DexterityBonus, label: "Dexterity" },
      { opcode: EffectTypeEnum.IntelligenceBonus, label: "Intelligence" },
      { opcode: EffectTypeEnum.StrengthBonus, label: "Strength" },
      { opcode: EffectTypeEnum.ConstitutionBonus, label: "Constitution" },
      { opcode: EffectTypeEnum.WisdomBonus, label: "Wisdom" },
      { opcode: EffectTypeEnum.CharismaBonus, label: "Charisma" },
      {
        opcode: EffectTypeEnum.SlashingResistanceModifier,
        label: "Slashing Resistance",
      },
      {
        opcode: EffectTypeEnum.CrushingResistanceModifier,
        label: "Crushing Resistance",
      },
      {
        opcode: EffectTypeEnum.PiercingResistanceModifier,
        label: "Piercing Resistance",
      },
      {
        opcode: EffectTypeEnum.MissilesResistanceModifier,
        label: "Missiles Resistance",
      },
      {
        opcode: EffectTypeEnum.FireResistanceModifier,
        label: "Fire Resistance",
      },
      {
        opcode: EffectTypeEnum.ColdResistanceModifier,
        label: "Cold Resistance",
      },
      {
        opcode: EffectTypeEnum.MagicResistanceModifier,
        label: "Magic Resistance",
      },
      {
        opcode: EffectTypeEnum.MagicalColdResistanceModifier,
        label: "Magical Cold Resistance",
      },
      {
        opcode: EffectTypeEnum.MagicalFireResistanceModifier,
        label: "Magical Fire Resistance",
      },
      {
        opcode: EffectTypeEnum.AcidResistanceModifier,
        label: "Acid Resistance",
      },
      {
        opcode: EffectTypeEnum.PoisonResistanceModifier,
        label: "Poison Resistance",
      },
      {
        opcode: EffectTypeEnum.ElectricityResistanceModifier,
        label: "Electricity Resistance",
      },
      {
        opcode: EffectTypeEnum.MagicDamageResistanceModifier,
        label: "Magic Damage Resistance",
      },
      { opcode: EffectTypeEnum.MaximumHPModifier, label: "Maximum HP" },
      { opcode: EffectTypeEnum.MoraleModifier, label: "Morale" },
      { opcode: EffectTypeEnum.MoraleBreakModifier, label: "Morale Break" },
      { opcode: EffectTypeEnum.FatigueBonus, label: "Fatigue Bonus" },
      {
        opcode: EffectTypeEnum.AllSavingThrowsBonus,
        label: "All Saving Throws",
      },
      { opcode: EffectTypeEnum.SaveVsBreathModifier, label: "Save vs Breath" },
      { opcode: EffectTypeEnum.SaveVsDeathModifier, label: "Save vs Death" },
      {
        opcode: EffectTypeEnum.SaveVsPetrificationModifier,
        label: "Save vs Petrification",
      },
      { opcode: EffectTypeEnum.SaveVsSpellModifier, label: "Save vs Spell" },
      { opcode: EffectTypeEnum.SaveVsWandModifier, label: "Save vs Wand" },
    ];
    const opcode = opcodes.find((o) => o.opcode === effect.opcode);
    if (!opcode) return undefined;
    const eff = effect as StatisticModifierEffect;
    const duration = effect.duration ? ` for ${this.getDuration(effect.duration)}` : "";
    const value = EffectTypeEnum[opcode.opcode].includes("Resistance")
      ? `${eff.value}%`
      : this.getSignedNumber(eff.value);
    return `${opcode.label}: ${value}${duration}${this.getSaveText(effect)}`;
  }
}

const descriptionService = new DescriptionService();
export default descriptionService;
