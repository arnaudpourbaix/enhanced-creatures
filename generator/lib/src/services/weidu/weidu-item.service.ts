import { CodeLine } from "../../model/misc";
import { ItemAbilityTypeEnum } from "../../model/spell-item/effect.enums";
import { Item, ItemHeader } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import translationService from "../translation.service";
import utils from "../utils/utils.service";
import { AbstractWeiduService } from "./abstract-weidu.service";
import weiduEffectService from "./weidu-effect.service";

class WeiduItemService extends AbstractWeiduService {
  createItems(lines: CodeLine[], items: Item[]) {
    for (const item of items) {
      this.createItem(lines, item);
      this.add(lines, "", 0);
    }
  }

  createItem(lines: CodeLine[], item: Item) {
    if (item.stringRef) this.add(lines, `// ${translationService.from(item.stringRef)}`);
    this.createItemFileHeader(lines, item);
    this.writeStringRef(lines, 0x8, item.stringRef, 1);
    this.writeStringRef(lines, 0xc, item.stringRef, 1);
    this.writeFlag(lines, 0x18, 4, item.flags, 1);
    this.write(lines, 0x1c, 2, item.category, 1);
    this.writeAscii(lines, 0x22, 2, item.animation, 1);
    this.write(lines, 0x31, 1, item.proficiency, 1);
    this.writeAscii(lines, 0x3a, 8, item.icon, 1);
    this.writeStringRef(lines, 0x50, item.description, 1);
    this.write(lines, 0x60, 4, item.enchantment, 1);
    //this.add(lines, `LPF set_enchantment INT_VAR enchantment = ${item.enchantment} END`, 1);

    if (!item.copyFrom) this.add(lines, `COPY_EXISTING ~${item.file}.itm~ ~override~`, 0);
    this.add(lines, `READ_SHORT 0x68 abicount`, 1);
    this.add(lines, `PATCH_IF (%abicount% > 0) BEGIN`, 1);
    this.writeItemAbilityHeaderPatch(lines, item);
    if (item.header) this.createItemHeader(lines, item.header, 1);
    this.add(lines, `END`, 1);
    for (const effect of item.effects) {
      weiduEffectService.addEffect({
        lines,
        effect,
        tab: 1,
        type: "ITM",
        global: true,
      });
    }
    for (const name of item.immunities) {
      this.add(lines, `LPF ${utils.getImmunityFunctionName(name)} END`, 1);
    }
  }

  private createItemFileHeader(lines: CodeLine[], item: Item) {
    if (item.copyFrom) {
      const immunity = State.immunities.find((i) => i.name === item.copyFrom);
      if (immunity && !immunity.itemSlot)
        throw new Error(`No file configured for immunity ${item.copyFrom}`);
      this.add(
        lines,
        `COPY_EXISTING ~${
          immunity?.itemSlot?.file ?? item.copyFrom
        }.ITM~  ~override/${item.file}.ITM~`,
        0,
      );
    } else {
      this.add(lines, `CREATE ITM "${item.file}"`, 0);
      this.write(lines, 0x64, 4, "0x72", 1);
      if (item.header) {
        this.add(lines, `INSERT_BYTES 0x72 0x38`, 1);
        this.write(lines, 0x68, 2, 1, 1);
        this.write(lines, 0x72, 2, item.header.type, 1);
        this.write(lines, 0x6a, 4, "0xaa", 1);
      }
    }
  }

  private writeItemAbilityHeaderPatch(lines: CodeLine[], item: Item) {
    if (!item.header) return;
    this.write(lines, 0x74, 1, item.header.location, 2);
    this.writeAscii(lines, 0x76, 8, item.icon, 2);
    this.write(lines, 0x7e, 1, item.header.target, 2);
    this.write(lines, 0x80, 2, item.header.range, 2);
    this.write(lines, 0x84, 1, item.header.speed, 2);
    this.write(lines, 0x86, 2, item.header.bonusToHit, 2);
    this.write(lines, 0x88, 1, item.header.diceSize, 2);
    this.write(lines, 0x8a, 1, item.header.diceThrown, 2);
    this.write(lines, 0x8c, 2, item.header.damageBonus, 2);
    this.write(lines, 0x8e, 2, item.header.damageType, 2);
    if (item.header.projectile) {
      if (typeof item.header.projectile !== "string") throw new Error(`Unhandled projectile!`);
      const projectile = `(IDS_OF_SYMBOL (~projectl~ ~${item.header.projectile}~)) + 1`;
      this.write(lines, 0x9c, 2, projectile, 2);
    }
  }

  private createItemHeader(lines: CodeLine[], header: ItemHeader, tab: number) {
    if (header.type === ItemAbilityTypeEnum.Melee) {
      this.write(lines, 0x9e, 2, header.animationSwing?.overhand ?? 34, tab);
      this.write(lines, 0xa0, 2, header.animationSwing?.backhand ?? 33, tab);
      this.write(lines, 0xa2, 2, header.animationSwing?.thrust ?? 33, tab);
    } else if (header.type === ItemAbilityTypeEnum.Ranged) {
      this.write(lines, 0x38, 2, 1, tab);
      this.write(lines, 0xa4, 2, 1, tab);
      this.write(lines, 0x9e, 2, header.animationSwing?.overhand ?? 0, tab);
      this.write(lines, 0xa0, 2, header.animationSwing?.backhand ?? 0, tab);
      this.write(lines, 0xa2, 2, header.animationSwing?.thrust ?? 0, tab);
    }
    this.writeFlag(lines, 0x98, 4, header.abilityflags, tab);
    for (const effect of header.effects) {
      weiduEffectService.addEffect({
        lines,
        tab,
        effect,
        type: "ITM",
        global: false,
      });
    }
  }
}

const weiduItemService = new WeiduItemService();
export default weiduItemService;
