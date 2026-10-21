import { SPELL_STATES } from "../../../config/common";
import { GLOBAL_CONFIG } from "../../../config/generate";
import { CHECKED_IMMUNITY_STATES, IMMUNITY_STATES } from "../../../config/immunity-config";
import { COMMON_PROJECTILES } from "../../../spells/projectiles";
import { CR, TAB } from "../../model/constants";
import { EquippedItem, JEWEL_SLOTS } from "../../model/creature/item";
import { ImmunityConfig } from "../../model/final/immunity";
import { ItemFlagEnum } from "../../model/spell-item/effect.enums";
import utils from "../utils/utils.service";
import { AbstractWeiduService } from "./abstract-weidu.service";
import weiduProjectileService from "./weidu-projectile.service";

class WeiduCoreService extends AbstractWeiduService {
  private lines = this.initLines();

  writeFile(): void {
    const content = this.lines.map((l) => `${TAB.repeat(l.tab)}${l.code}`).join(CR);
    utils.writeFile(GLOBAL_CONFIG.files.coreMonsters, content);
  }

  generateSpellStates() {
    // the immunities' states come with EE Fixpack (or SCS...): added when missing
    const immunityStates = [...new Set(IMMUNITY_STATES.map(({ state }) => state))];
    for (const state of [...Object.values(SPELL_STATES), ...immunityStates]) {
      this.add(
        this.lines,
        `LAF ADD_IDS_ENTRY STR_VAR idsFile = "splstate.ids" identifier = "${state}" END`,
        0,
      );
    }
    this.add(this.lines, ``, 0);
  }

  /**
   * Every game spell or item granting an immunity (opcode 101: a kit ability, a ring...) also sets
   * the immunity's spell state the AI checks (see CHECKED_IMMUNITY_STATES), so it sees a party's
   * protections. Like EE Fixpack's immunities_via_324, which does it for most of them: the state
   * is deleted before being cloned from the immunity, so neither that nor a reinstall doubles it.
   * This mod's own files (ja*) already set theirs.
   */
  generateImmunityStates() {
    if (!GLOBAL_CONFIG.enableImmunityStates) return;
    const opcodes = [...new Set(CHECKED_IMMUNITY_STATES.map(({ opcode }) => opcode))];
    const add = (code: string, tab: number) => {
      this.add(this.lines, code, tab);
    };
    add(`// Immunity spell states for the game's spells and items`, 0);
    // resolved once, not for each file granting an immunity
    for (const { state } of CHECKED_IMMUNITY_STATES) {
      add(`OUTER_SET state_${state} = IDS_OF_SYMBOL (~splstate~ ~${state}~)`, 0);
    }
    add(`COPY_EXISTING_REGEXP GLOB ~^.+\\.\\(itm\\|spl\\)$~ ~override~`, 0);
    add(
      `PATCH_IF (SOURCE_SIZE > 0x71) AND (~%SOURCE_RES%~ STRING_COMPARE_REGEXP ~^ja.*~) BEGIN`,
      1,
    );
    add(`READ_ASCII 0 signature (8)`, 2);
    add(
      `PATCH_IF (~%signature%~ STRING_EQUAL ~ITM V1  ~) OR (~%signature%~ STRING_EQUAL ~SPL V1  ~) BEGIN`,
      2,
    );
    for (const opcode of opcodes) add(`SET immune_${opcode} = 0`, 3);
    add(`READ_LONG 0x6a fx_offset`, 3);
    add(`FOR (offset = fx_offset; offset + 0x30 <= SOURCE_SIZE; offset += 0x30) BEGIN`, 3);
    add(`PATCH_IF (SHORT_AT offset = 101) BEGIN`, 4);
    add(`SET immune_to = LONG_AT (offset + 8)`, 5);
    for (const opcode of opcodes) {
      add(`PATCH_IF (immune_to = ${opcode}) BEGIN SET immune_${opcode} = 1 END`, 5);
    }
    add(`END`, 4);
    add(`END`, 3);
    for (const { state, opcode } of CHECKED_IMMUNITY_STATES) {
      add(`PATCH_IF immune_${opcode} BEGIN`, 3);
      add(`LPF DELETE_EFFECT INT_VAR match_opcode=328 match_parameter2=state_${state} END`, 4);
      add(
        `LPF CLONE_EFFECT INT_VAR match_opcode=101 match_parameter2=${opcode} opcode=328 parameter1=0 parameter2=state_${state} special=1 END`,
        4,
      );
      add(`END`, 3);
    }
    add(`END`, 2);
    add(`END`, 1);
    add(`BUT_ONLY`, 0);
    add(``, 0);
  }

  generateProjectiles() {
    weiduProjectileService.createProjectiles(this.lines, COMMON_PROJECTILES);
  }

  generateItem(itemSlot: EquippedItem, immunity: ImmunityConfig) {
    const criticalHitImmunity = utils.hasCriticalHitImmunity(immunity);
    this.add(this.lines, `// ${immunity.name}`);
    this.add(this.lines, `CREATE ITM "${itemSlot.file}"`, 0);
    this.write(this.lines, 0x64, 4, "0x72", 1);
    let flags = 2 ** ItemFlagEnum.NotCopyable;
    if (itemSlot.slot === "HELMET") {
      this.write(this.lines, 0x1c, 2, 72, 1);
    } else if (criticalHitImmunity) {
      flags += 2 ** ItemFlagEnum.ToggleCriticalHit;
    }
    this.write(this.lines, 0x18, 4, flags, 1);
    this.write(this.lines, 0x3a, 8, this.getIcon(itemSlot), 1);
    if (immunity.stringRef) {
      this.writeStringRef(this.lines, 0x8, immunity.stringRef, 1);
      this.writeStringRef(this.lines, 0xc, immunity.stringRef, 1);
    }
    if (immunity.description) {
      this.writeStringRef(this.lines, 0x50, immunity.description, 1);
    }
    this.add(this.lines, `COPY_EXISTING ~${itemSlot.file}.itm~ ~override~`, 0);
    this.add(this.lines, `LPF ${utils.getImmunityFunctionName(immunity.name)} END`, 1);
    this.add(this.lines, "", 0);
  }

  getIcon(itemSlot: EquippedItem) {
    if (itemSlot.slot === JEWEL_SLOTS) return "IRING16";
    switch (itemSlot.slot) {
      case "ARMOR":
        return "IPLAT01";
      case "HELMET":
        return "IHELM01";
      case "AMULET":
        return "IAMUL01";
      case "LRING":
      case "RRING":
        return "IRING16";
      case "BOOTS":
        return "IBOOT01";
      default:
        return undefined;
    }
  }
}

const weiduCoreService = new WeiduCoreService();
export default weiduCoreService;
