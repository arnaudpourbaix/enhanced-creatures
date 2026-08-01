import { SlotIdentifier } from "../ids/slot";

export type ItemSlot =
  | "HELMET"
  | "ARMOR"
  | "GLOVES"
  | "LRING"
  | "RRING"
  | "AMULET"
  | "BELT"
  | "BOOTS"
  | "WEAPON1"
  | "WEAPON2"
  | "WEAPON3"
  | "WEAPON4"
  | "SHIELD"
  | "QUIVER1"
  | "QUIVER2"
  | "QUIVER3"
  | "QUIVER4"
  | "CLOAK"
  | "QITEM1"
  | "QITEM2"
  | "QITEM3";

export const WEAPON_SLOTS: { slot: ItemSlot; id: SlotIdentifier }[] = [
  { slot: "WEAPON1", id: "SLOT_WEAPON0" },
  { slot: "WEAPON2", id: "SLOT_WEAPON1" },
  { slot: "WEAPON3", id: "SLOT_WEAPON2" },
  { slot: "WEAPON4", id: "SLOT_WEAPON3" },
  { slot: "SHIELD", id: "SLOT_SHIELD" },
] as const;

export const JEWEL_SLOTS: ItemSlot[] = [
  "LRING",
  "RRING",
  "AMULET",
  "BELT",
  "GLOVES",
  "CLOAK",
];

export const QUICK_SLOTS: ItemSlot[] = ["QITEM1", "QITEM2", "QITEM3"];

export type WeaponSlot =
  | "WEAPON1"
  | "WEAPON2"
  | "WEAPON3"
  | "WEAPON4"
  | "SHIELD";

export interface EquippedItem {
  /**
   * Filename for ITM file (without extension)
   */
  file: string;
  slot: ItemSlot | ItemSlot[];
  /**
   * default: 1
   */
  quantity?: number;
  /**
   * default: false
   */
  unstealable?: boolean;
  /**
   * default: true
   */
  undroppable?: boolean;
}
