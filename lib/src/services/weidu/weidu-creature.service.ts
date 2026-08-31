import { GLOBAL_CONFIG } from "../../../config/generate";
import { SPELLBOOK_MODS } from "../../../config/mods";
import { CR, TAB } from "../../model/constants";
import { CreatureAdjustment } from "../../model/creature/adjustment";
import { Creature, CreatureAutoGenerate, CreatureNewFile } from "../../model/creature/creature";
import { Game, GAME_IS_CONDITION } from "../../model/creature/game";
import {
  CREATURE_DATA_FIELDS,
  CreatureData,
  CreatureScriptEdit,
  MemorizedSpell,
} from "../../model/creature/data";
import { EquippedItem, WEAPON_SLOTS } from "../../model/creature/item";
import { ImmunityName } from "../../model/final/immunity";
import { StringReference } from "../../model/final/stringref";
import { CodeLine } from "../../model/misc";
import { ProficiencyTypeEnum } from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { State } from "../../state";
import immunityService from "../effects/immunity.service";
import itemService from "../item.service";
import logService from "../log.service";
import translationService from "../translation.service";
import utils from "../utils/utils.service";
import { AbstractWeiduService } from "./abstract-weidu.service";
import weiduEffectService from "./weidu-effect.service";
import weiduFamilyService from "./weidu-family.service";
import weiduItemService from "./weidu-item.service";
import weiduProjectileService from "./weidu-projectile.service";
import weiduSpellService from "./weidu-spell.service";

class WeiduCreatureService extends AbstractWeiduService {
  generateWeiduScript(creature: Creature): void {
    const lines = this.initLines();
    this.add(lines, `// ${translationService.from(creature.name)}`);
    if (creature.data.script.location !== "None") this.compileScripts(lines, creature);
    weiduProjectileService.createProjectiles(lines, creature.projectiles);
    weiduEffectService.createEffectFiles(lines, creature.effectFiles);
    weiduSpellService.createSpells(lines, creature.spells);
    weiduItemService.createItems(lines, creature.items);
    this.handleScriptEdits(lines, creature);
    this.createNewFiles(lines, 0, creature);
    if (creature.data.movement.hasItem()) {
      this.addMovementSpeedToItem(lines, 0, creature);
    }
    this.patchCreatures(lines, 0, creature);
    const content = lines.map((l) => `${TAB.repeat(l.tab)}${l.code}`).join(CR);
    utils.writeFile(
      `${utils.getFamilyFolder(creature.family)}/${creature.id.toString(16)}.tpa`,
      content,
    );
    weiduFamilyService.createOrUpdateMainFile(creature.family, creature);
  }

  private handleScriptEdits(lines: CodeLine[], creature: Creature) {
    if (!creature.data.script.edits) return;
    for (const edit of creature.data.script.edits) {
      this.handleScriptEdit(lines, edit);
    }
  }

  private handleScriptEdit(lines: CodeLine[], edit: CreatureScriptEdit) {
    this.add(lines, "ACTION_FOR_EACH ~file~ IN");
    for (const file of edit.files) this.add(lines, `"${file}"`, 1);
    this.add(lines, "BEGIN", 0);
    this.add(lines, `ACTION_IF FILE_EXISTS_IN_GAME ~%file%.bcs~ BEGIN`, 1);
    this.add(lines, `COPY_EXISTING ~%file%.bcs~ ~override~`, 2);
    this.add(lines, `DECOMPILE_AND_PATCH BEGIN`, 3);
    for (const replace of edit.replaces) {
      this.add(lines, `REPLACE_TEXTUALLY ~${replace[0]}~ ~${replace[1]}~`, 4);
    }
    this.add(lines, `END`, 3);
    this.add(lines, `BUT_ONLY`, 2);
    this.add(lines, `END`, 1);
    this.add(lines, `END`, 0);
    this.add(lines, ``, 0);
  }

  private compileScripts(lines: CodeLine[], creature: Creature) {
    this.add(
      lines,
      `COMPILE ~%MOD_FOLDER%/${this.getScriptName(creature, {
        withPath: true,
        ext: true,
      })}~`,
    );
    if (creature.adjustments.some((a) => a.summon))
      this.add(
        lines,
        `COMPILE ~%MOD_FOLDER%/${this.getScriptName(creature, {
          withPath: true,
          summon: true,
          ext: true,
        })}~`,
      );
    this.add(lines, "");
  }

  private createNewFiles(lines: CodeLine[], tab: number, creature: Creature) {
    for (const entry of creature.newFiles) {
      if (!entry.copyFromExisting && !entry.copyFrom)
        throw new Error(`newFiles entry needs either copyFromExisting or copyFrom !`);
      for (const file of entry.files) {
        this.addNewFile(lines, tab, creature, entry, file);
      }
    }
  }

  private addNewFile(
    lines: CodeLine[],
    tab: number,
    creature: Creature,
    entry: CreatureNewFile,
    file: string,
  ) {
    const copy = entry.copyFromExisting
      ? `COPY_EXISTING ~${entry.copyFromExisting}.cre~`
      : `COPY ~%MOD_FOLDER%/${utils.getFamilyFolder(creature.family)}/assets/${entry.copyFrom ?? ""}.cre~`;
    this.add(lines, `${copy} ~override/${file}.cre~`, tab);
    if (entry.stringRef) {
      this.writeName(lines, tab, entry.stringRef);
    }
  }

  private writeName(lines: CodeLine[], tab: number, stringRef: StringReference) {
    for (const offset of ["0x8", "0xc"]) {
      this.add(lines, `WRITE_LONG ${offset} ${utils.resolveStringRef(stringRef) ?? ""}`, tab + 1);
    }
  }

  private addMovementSpeedToItem(lines: CodeLine[], tab: number, creature: Creature) {
    if (!creature.data.movement.hasItem())
      throw new Error(`Movement has no item to attach speed to !`);
    this.add(lines, "// Attach movement speed to item", tab);
    this.add(lines, `COPY_EXISTING ~${creature.data.movement.itemFile}.ITM~  ~override~`, tab);
    this.add(
      lines,
      `LPF ADD_ITEM_EQEFFECT INT_VAR opcode=176 target=1 timing=2 parameter1=${creature.data.movement.getGameValue()} parameter2=1 global=1 END`,
      tab + 1,
    );
    this.add(lines, "", tab);
  }

  private patchCreatures(lines: CodeLine[], tab: number, creature: Creature) {
    // The whole per-file block (FILE_EXISTS_IN_GAME -> COPY_EXISTING -> body ->
    // BUT_ONLY_IF_IT_CHANGES) is emitted once as an action function; each per-game loop below just
    // calls it per file, rather than duplicating the ~200-line body once per game group.
    const fn = `jam${creature.id.toString(16)}_patch`;
    this.add(lines, `DEFINE_ACTION_FUNCTION ${fn}`, tab);
    this.add(lines, `STR_VAR file = ~~`, tab);
    this.add(lines, `BEGIN`, tab);
    this.add(lines, `ACTION_IF FILE_EXISTS_IN_GAME ~%file%.cre~ BEGIN`, tab + 1);
    this.add(lines, `COPY_EXISTING ~%file%.cre~ ~override~`, tab + 2);
    this.patchCreatureBody(lines, tab + 3, creature);
    this.add(lines, `BUT_ONLY_IF_IT_CHANGES`, tab + 2);
    this.add(lines, `END`, tab + 1);
    this.add(lines, `END`, tab);
    this.add(lines, "", tab);

    const groups: { game?: Game; names: string[] }[] = [
      { game: undefined, names: [] },
      { game: "bg1", names: [] },
      { game: "bg2", names: [] },
    ];
    for (const f of creature.files) {
      const group = groups.find((g) => g.game === f.game);
      if (!group) {
        throw new Error(`unexpected game value on creature file ${f.name}: ${String(f.game)}`);
      }
      group.names.push(f.name);
    }
    for (const group of groups) {
      if (!group.names.length) continue;
      if (group.game) {
        this.add(lines, `ACTION_IF ${GAME_IS_CONDITION[group.game]} BEGIN`, tab);
        this.patchCreatureFileLoop(lines, tab + 1, group.names, fn);
        this.add(lines, "END", tab);
      } else {
        this.patchCreatureFileLoop(lines, tab, group.names, fn);
      }
    }
  }

  /** The per-file patch body: everything between COPY_EXISTING and BUT_ONLY_IF_IT_CHANGES. */
  private patchCreatureBody(lines: CodeLine[], tab: number, creature: Creature) {
    this.add(lines, `LPF FJ_CRE_VALIDITY END`, tab);
    this.removeEffects(lines, tab, creature);
    this.removeKnownSpells(lines, tab, creature);
    this.removeMemorizedSpells(lines, tab, creature);
    this.removeItems(lines, tab, creature.data);
    this.addItemSlots({
      lines,
      tab,
      creature,
      data: creature.data,
    });
    this.addMemorizedSpells(lines, tab, creature.data);
    // if (creature.data.proficiencies.length) {
    this.add(lines, `LPF clear_proficiencies END`, tab);
    // }
    this.addProficiencies(lines, tab, creature.data);
    this.addImmunities(lines, tab, creature.data.immunities, creature.adjustments);
    for (const effect of creature.data.effects.list) {
      weiduEffectService.addEffect({
        lines,
        tab,
        effect,
        type: "CRE",
        global: true,
      });
    }
    this.patchCreature({
      lines,
      tab,
      creature,
      data: creature.data,
      autoGenerate: creature.autoGenerate,
      enforce: true,
    });
    if (creature.data.script.location !== "None") {
      this.patchScripts(lines, tab, creature);
    }
    this.handleAdjustments(lines, tab, creature);
  }

  private patchCreatureFileLoop(lines: CodeLine[], tab: number, names: string[], fn: string) {
    this.add(lines, "ACTION_FOR_EACH ~file~ IN", tab);
    for (const file of names) this.add(lines, `"${file}"`, tab + 1);
    this.add(lines, "BEGIN", tab);
    this.add(lines, `LAF ${fn} STR_VAR file END`, tab + 1);
    this.add(lines, "END", tab);
  }

  private removeItems(lines: CodeLine[], tab: number, data: CreatureData) {
    for (const item of data.items.remove) {
      this.add(lines, `REMOVE_CRE_ITEM ~${item}~`, tab);
    }
  }

  private removeAllEffects(lines: CodeLine[], tab: number, creature: Creature) {
    const files = creature.fileNames.reduce<string[]>((acc, file) => {
      const defaultValue = !!creature.data.effects.remove;
      const adj = creature.adjustments.find(
        (a) =>
          a.files.includes(file) &&
          typeof a.data.effects.remove === "boolean" &&
          a.data.effects.remove !== defaultValue,
      );
      const remove = adj?.data.effects.remove ?? defaultValue;
      if (remove) acc.push(file);
      return acc;
    }, []);
    this.executeCodeWithIncludedFiles(lines, tab, `LPF REMOVE_MOST_CRE_EFFECTS END`, files);
  }

  private removeEffects(lines: CodeLine[], tab: number, creature: Creature) {
    if (typeof creature.data.effects.remove === "boolean") {
      this.removeAllEffects(lines, tab, creature);
    } else if (Array.isArray(creature.data.effects.remove)) {
      this.removeEffectOpcodes(lines, tab, creature.data.effects.remove, creature.fileNames);
    }
    for (const adjustment of creature.adjustments) {
      if (Array.isArray(adjustment.data.effects.remove)) {
        this.removeEffectOpcodes(lines, tab, adjustment.data.effects.remove, adjustment.files);
      }
    }
  }

  private removeEffectOpcodes(
    lines: CodeLine[],
    tab: number,
    opcodes: EffectTypeEnum[],
    files: string[],
  ) {
    const param = opcodes.join(" ");
    this.executeCodeWithIncludedFiles(
      lines,
      tab,
      `LPF DELETE_CRE_EFFECT INT_VAR opcode_to_delete=${param} END`,
      files,
    );
  }

  private removeKnownSpells(lines: CodeLine[], tab: number, creature: Creature) {
    const files = [
      ...creature.adjustments.reduce((acc, adjustement) => {
        // data is required by CreatureAdjustment's type, but defended anyway - real adjustments
        // can omit it (see handleAdjustments()'s "neither data nor summon" skip below).
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (adjustement.data?.spells.removeKnown === false) {
          for (const f of adjustement.files) acc.add(f);
        }
        return acc;
      }, new Set<string>()),
    ];
    this.executeCodeWithExcludedFiles(lines, tab, `REMOVE_KNOWN_SPELLS`, files);
  }

  private removeMemorizedSpells(lines: CodeLine[], tab: number, creature: Creature) {
    const files = [
      ...creature.adjustments.reduce((acc, adjustement) => {
        // data is required by the type, but defended anyway (same reason as removeKnownSpells above)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (adjustement.data?.spells.removeMemorized === false) {
          for (const f of adjustement.files) acc.add(f);
        }
        return acc;
      }, new Set<string>()),
    ];
    const code = this.removeMemorizedSpell(creature.data.spells.removeMemorized);
    if (code) this.executeCodeWithExcludedFiles(lines, tab, code, files);
  }

  private removeMemorizedSpell(value: string[] | boolean | undefined): string {
    if (!Array.isArray(value)) return value ? "REMOVE_MEMORIZED_SPELLS" : "";
    const names = value.map((v) => `~${v}~`).join(" ");
    return `REMOVE_MEMORIZED_SPELL ${names}`;
  }

  private addProficiencies(lines: CodeLine[], tab: number, data: CreatureData) {
    if (!data.proficiencies.length) return;
    for (const prof of data.proficiencies)
      this.add(lines, `SET_BG2_PROFICIENCY ~${ProficiencyTypeEnum[prof.type]}~ ${prof.value}`, tab);
  }

  private addImmunities(
    lines: CodeLine[],
    tab: number,
    immunities: ImmunityName[],
    adjustments: CreatureAdjustment[],
  ) {
    for (const name of immunities) {
      const immunity = State.immunities.find((i) => i.name === name);
      if (!immunity) throw new Error(`Immunity ${name} not found !`);
      if (!immunity.itemSlot) {
        const files = immunityService.getOverrides(name, adjustments);
        this.executeCodeWithExcludedFiles(
          lines,
          tab,
          `LPF ${utils.getImmunityFunctionName(name)} END`,
          files,
        );
      }
    }
  }

  private addItemSlots(p: {
    lines: CodeLine[];
    tab: number;
    data: CreatureData;
    creature?: Creature;
  }) {
    let isEquip = false;
    for (const item of p.data.items.equipped) {
      const slots = itemService.getItemSlots(item.slot);
      if (!slots.length) {
        logService.warn(
          `No slot defined for equipped item ${item.file}, check if it is used by an adjustment`,
        );
        continue;
      }
      const isWeapon = slots.every((slot) => WEAPON_SLOTS.some((s) => s.slot === slot));
      const noWeaponFiles = this.getNoWeaponFiles(p.creature);
      const flags = this.getItemFlags(item);
      const quantity = `#${item.quantity ?? 0}`;
      const equip = isWeapon && !isEquip ? "EQUIP" : "";
      const macro = slots.length > 1 ? "ADD_CRE_ITEM" : "REPLACE_CRE_ITEM";
      const code = `${macro} ~${
        item.file
      }~ ${quantity} #0 #0 ${flags} ~${slots.join(" ")}~ ${equip}`;
      this.addConditionalSourceRes(p.lines, code, p.tab, noWeaponFiles, true);
      if (isWeapon) isEquip = true;
    }
  }

  private getNoWeaponFiles(creature?: Creature): string[] {
    return (creature ? creature.adjustments : []).reduce<string[]>((acc, a) => {
      if (a.noWeapon) acc.push(...a.files);
      return acc;
    }, []);
  }

  private getItemFlags(item: EquippedItem): string {
    const flagsArray: string[] = [];
    if (item.undroppable === true || item.undroppable === undefined) flagsArray.push("UNDROPPABLE");
    if (item.unstealable === true) flagsArray.push("UNSTEALABLE");
    if (!flagsArray.length) flagsArray.push("NONE");
    return `~${flagsArray.join("&")}~`;
  }

  private addMemorizedSpells(lines: CodeLine[], tab: number, data: CreatureData) {
    const spellbooks = data.spells.spellbooks;
    if (spellbooks?.length) {
      // A spellbook variant with no weiduCheck (e.g. Vanilla) is the mutually-exclusive fallback
      // of the chain below - used only when none of the mod-gated variants match - not an extra
      // variant stacked on top of whichever one did match.
      const fallback = spellbooks.find((sb) => !SPELLBOOK_MODS[sb.mod].weiduCheck);
      const conditional = spellbooks
        .map((sb) => ({ spellbook: sb, weiduCheck: SPELLBOOK_MODS[sb.mod].weiduCheck }))
        .filter((sb): sb is typeof sb & { weiduCheck: string } => !!sb.weiduCheck);

      if (conditional.length) {
        conditional.forEach(({ spellbook, weiduCheck }, index) => {
          const keyword = index === 0 ? "PATCH_IF" : "END ELSE PATCH_IF";
          this.add(lines, `${keyword} ${weiduCheck} BEGIN`, tab);
          this.addMemorizedSpellList(lines, tab + 1, spellbook.memorized);
        });
        if (fallback) {
          this.add(lines, "END ELSE BEGIN", tab);
          this.addMemorizedSpellList(lines, tab + 1, fallback.memorized);
        }
        this.add(lines, "END", tab);
      } else if (fallback) {
        this.addMemorizedSpellList(lines, tab, fallback.memorized);
      }
    }
    // The base `memorized` list is always installed regardless of which spellbook variant (if
    // any) matched - it may hold content unrelated to this feature entirely, e.g. kit-injected
    // innate abilities (see kit.service.ts's applyKitAbilities), which must never be gated
    // behind a PATCH_IF/ELSE branch.
    this.addMemorizedSpellList(lines, tab, data.spells.memorized);
  }

  private addMemorizedSpellList(lines: CodeLine[], tab: number, list: MemorizedSpell[]) {
    for (const m of list) {
      const infos = utils.getSpellInfos(m.file);
      const level = m.level ?? infos.level - 1;
      const spell = State.spells.find((s) => s.file === m.file);
      const comment = spell ? `// ${translationService.from(spell.name)}` : "";
      let code = `ADD_MEMORIZED_SPELL ~${m.file}~ #${level} ~${infos.type}~ (${m.memorizedCount ?? 1}) ${comment}`;
      if (m.memorizedCount === 0) code = `REMOVE_MEMORIZED_SPELL ~${m.file}~`;
      this.add(lines, code, tab);
    }
  }

  private patchCreature(p: {
    lines: CodeLine[];
    tab: number;
    data: CreatureData;
    autoGenerate: CreatureAutoGenerate;
    enforce: boolean;
    creature: Creature;
  }) {
    if (p.creature.notEnforceFiles.length) {
      this.add(
        p.lines,
        `PATCH_DEFINE_ARRAY notEnforceFiles BEGIN ${p.creature.notEnforceFiles.join(" ")} END`,
        p.tab,
      );
    }
    this.add(p.lines, `LPF patchCreature`, p.tab);
    this.add(p.lines, `INT_VAR`, p.tab + 1);
    for (const data of CREATURE_DATA_FIELDS) {
      if (!!data.value && p.data[data.key] !== undefined) {
        const value = data.value(p.data);
        if (value !== undefined) {
          this.add(p.lines, `${data.key}=${value}`, p.tab + 2);
        }
      }
    }
    if (p.enforce) this.add(p.lines, `enforce=1`, p.tab + 2);
    if (p.creature.attack.dualWielding) this.add(p.lines, `perfect2weapon=1`, p.tab + 2);
    if (p.creature.notEnforceFiles.length) {
      this.add(p.lines, "STR_VAR", p.tab + 1);
      this.add(p.lines, "notEnforceFiles", p.tab + 2);
    }
    this.add(p.lines, "END", p.tab);
  }

  private patchScripts(lines: CodeLine[], tab: number, creature: Creature) {
    const summonAdjustments = creature.adjustments.filter((a) => a.summon);
    const dedupeFiles = (adjustments: CreatureAdjustment[]) => [
      ...new Set(adjustments.flatMap((a) => a.files)),
    ];
    // Untagged summon files get the summon script in both games; game-tagged ones get it only
    // in their game and the normal script otherwise (see the ELSE branch below).
    const summonFiles = dedupeFiles(summonAdjustments.filter((a) => !a.game));
    const gameSummonFiles = (["bg1", "bg2"] as const).map((game) => ({
      game,
      files: dedupeFiles(summonAdjustments.filter((a) => a.game === game)),
    }));
    // Every summon file (tagged or not) is excluded from the base-script assignment below; the
    // tagged ones are re-assigned per game right after.
    const allSummonFiles = [...summonFiles, ...gameSummonFiles.flatMap((g) => g.files)];
    const locationFiles = [
      ...new Set(
        creature.adjustments
          .filter((a) => !!a.data.script.location && a.data.script.location !== "None")
          .map((a) => a.files)
          .flat(),
      ),
    ];
    const noScriptFiles = [
      ...new Set(
        creature.adjustments
          .filter((a) => a.data.script.location === "None")
          .map((a) => a.files)
          .flat(),
      ),
    ];
    const scriptName = this.getScriptName(creature, {});
    const summonScriptName = this.getScriptName(creature, { summon: true });
    this.patchScript({
      lines,
      tab,
      script: scriptName,
      slot: creature.data.script.location,
      removeScripts: creature.data.script.remove,
      files: [],
      skipFiles: [...allSummonFiles, ...locationFiles, ...noScriptFiles],
      logging: creature.logging,
    });
    if (summonFiles.length) {
      this.patchScript({
        lines,
        tab,
        script: summonScriptName,
        slot: creature.data.script.location,
        removeScripts: creature.data.script.remove,
        files: summonFiles,
        skipFiles: [],
        logging: creature.logging,
      });
    }
    for (const { game, files } of gameSummonFiles) {
      if (!files.length) continue;
      const assign = (script: string) => {
        this.patchScript({
          lines,
          files,
          script,
          tab: tab + 1,
          slot: creature.data.script.location,
          removeScripts: creature.data.script.remove,
          skipFiles: [],
          logging: creature.logging,
        });
      };
      this.add(lines, `PATCH_IF ${GAME_IS_CONDITION[game]} BEGIN`, tab);
      assign(summonScriptName);
      this.add(lines, `END ELSE BEGIN`, tab);
      assign(scriptName);
      this.add(lines, `END`, tab);
    }
    for (const adjustment of creature.adjustments) {
      if (adjustment.data.script.location && adjustment.data.script.location !== "None") {
        this.patchScript({
          lines,
          tab,
          script: scriptName,
          slot: adjustment.data.script.location,
          removeScripts: [...creature.data.script.remove, ...adjustment.data.script.remove],
          files: adjustment.files,
          skipFiles: [],
          logging: creature.logging,
        });
      }
    }
  }

  private patchScript(p: {
    lines: CodeLine[];
    tab: number;
    script: string;
    slot?: string;
    removeScripts: string[];
    files: string[];
    skipFiles: string[];
    logging: boolean;
  }) {
    const slotLog = p.slot ? ` to slot ${p.slot}` : "";
    this.add(p.lines, `// Assigning ${p.script}${slotLog}`, p.tab);
    let removeScripts = "";
    let skipFiles = "";
    let files = "";
    // genericScriptsToRemove is a real, permanently non-empty ~90-entry array (see
    // weidu-creature.service.test.ts's audit note), so this condition is always true - kept
    // as documentation of intent rather than simplified away.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (p.removeScripts.length || GLOBAL_CONFIG.tpaConstants.genericScriptsToRemove) {
      const scripts = [...p.removeScripts, ...GLOBAL_CONFIG.tpaConstants.genericScriptsToRemove];
      this.add(p.lines, `CLEAR_ARRAY skipFiles`, p.tab);
      this.add(p.lines, `CLEAR_ARRAY removeScripts`, p.tab);
      this.add(p.lines, `CLEAR_ARRAY files`, p.tab);
      this.add(p.lines, `PATCH_DEFINE_ARRAY removeScripts BEGIN ${scripts.join(" ")} END`, p.tab);
      removeScripts = " removeScripts";
    }
    if (p.skipFiles.length && !p.files.length) {
      this.add(p.lines, `PATCH_DEFINE_ARRAY skipFiles BEGIN ${p.skipFiles.join(" ")} END`, p.tab);
      skipFiles = " skipFiles";
    }
    if (p.files.length) {
      this.add(p.lines, `PATCH_DEFINE_ARRAY files BEGIN ${p.files.join(" ")} END`, p.tab);
      files = " files";
    }
    const slot = p.slot ? ` slot=${p.slot}` : "";
    this.add(
      p.lines,
      `LPF patchCreatureScript INT_VAR logging=${
        p.logging ? 1 : 0
      } STR_VAR${slot}${files}${removeScripts}${skipFiles} script=${p.script} END`,
      p.tab,
    );
  }

  private handleAdjustments(lines: CodeLine[], tab: number, creature: Creature) {
    // Adjustment files are checked against creature.files during creatureFactory.validate() -
    // see creatureService.checkAdjustmentFiles() - so an invalid creature never reaches here.
    for (const adjustment of creature.adjustments) {
      // data is required by the type, but real adjustments can omit it (see the "skips
      // adjustments with neither data nor summon" test for this method).
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (adjustment.data || adjustment.summon) {
        this.handleAdjustment(lines, tab, creature, adjustment);
      }
    }
  }

  private handleAdjustment(
    lines: CodeLine[],
    tab: number,
    creature: Creature,
    adjustment: CreatureAdjustment,
  ) {
    const gameGuard = adjustment.game ? GAME_IS_CONDITION[adjustment.game] : undefined;
    if (gameGuard) {
      this.add(lines, `PATCH_IF ${gameGuard} BEGIN `, tab);
      tab++;
    }
    this.startConditionalSourceRes(lines, tab, adjustment.files, false);
    tab++;
    // data is required by the type, but defended anyway (same reason as handleAdjustments above)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (adjustment.data?.movement) {
      this.add(
        lines,
        `LPF set_movement_speed INT_VAR value=${adjustment.data.movement.getGameValue()} END`,
        tab,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (adjustment.data)
      this.patchCreatureAdjustement({
        lines,
        tab,
        creature,
        data: adjustment.data,
        parent: creature.data,
        autoGenerate: creature.autoGenerate,
        summon: adjustment.summon,
      });
    if (adjustment.scriptName && adjustment.files.length > 1)
      throw new Error(
        `Adjustement can't have a script name if it has several files: ${adjustment.files.join(" ")}`,
      );
    if (adjustment.scriptName) {
      this.writeAscii(lines, 0x280, 32, adjustment.files[0]);
    }
    if (adjustment.stringRef) {
      this.writeName(lines, tab, adjustment.stringRef);
    }
    this.add(lines, "END", tab - 1);
    if (gameGuard) {
      // Guard's closing END must align with its PATCH_IF, emitted at the entry tab (tab - 2 here).
      this.add(lines, "END", tab - 2);
    }
  }

  private writeCreatureDataField(
    lines: CodeLine[],
    tab: number,
    data: CreatureData,
    field: (typeof CREATURE_DATA_FIELDS)[number],
  ) {
    if (!field.value || !field.fields || data[field.key] === undefined) return;
    const value = field.value(data);
    if (value === undefined) return;
    for (const f of field.fields) {
      this.add(
        lines,
        `${this.getWrite(f.size)} 0x${f.index.toString(16)} ${value} // ${field.key}`,
        tab,
      );
    }
  }

  private patchCreatureAdjustement(p: {
    lines: CodeLine[];
    tab: number;
    data: CreatureData;
    parent?: CreatureData;
    autoGenerate: CreatureAutoGenerate;
    summon: boolean;
    creature: Creature;
  }) {
    if (p.summon) {
      p.data.xpv = 0;
    }
    for (const data of CREATURE_DATA_FIELDS) {
      this.writeCreatureDataField(p.lines, p.tab, p.data, data);
    }
    this.removeItems(p.lines, p.tab, p.data);
    this.addItemSlots({
      lines: p.lines,
      tab: p.tab,
      data: p.data,
    });
    if (p.data.spells.removeMemorized) {
      const code = this.removeMemorizedSpell(p.data.spells.removeMemorized);
      this.add(p.lines, code, p.tab);
    }
    this.addImmunities(p.lines, p.tab, p.data.immunities, []);
    this.addMemorizedSpells(p.lines, p.tab, p.data);
    this.addProficiencies(p.lines, p.tab, p.data);
    for (const effect of p.data.effects.list) {
      weiduEffectService.addEffect({
        effect,
        lines: p.lines,
        tab: p.tab,
        type: "CRE",
        global: true,
      });
    }
  }

  getScriptName(
    creature: Creature,
    options: { withPath?: boolean; summon?: boolean; ext?: boolean },
  ) {
    const path = options.withPath ? `${utils.getFamilyFolder(creature.family)}/` : "";
    const ext = options.ext === true ? ".baf" : "";
    const name = `jam${creature.id.toString(16)}${options.summon ? "su" : ""}${ext}`;
    return `${path}${name}`;
  }
}

const weiduCreatureService = new WeiduCreatureService();
export default weiduCreatureService;
