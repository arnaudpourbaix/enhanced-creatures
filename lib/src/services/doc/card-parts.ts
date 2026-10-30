import { CreatureAbility } from "../../model/creature/ability";

// A creature card is built from keyed parts so a caller (e.g. a monster entry's "Common to all"
// box) can omit the parts it already shows elsewhere. Parts with equal keys on two creatures
// render the same thing.

export interface CardPart {
  /** Identity for "common to all" comparison: equal keys = same thing on two creatures. */
  key: string;
  html: string;
}

export interface WeaponPart extends CardPart {
  /** Key of the weapon without its enchantment (index-scoped). */
  descKey: string;
  /** Weapon rendered without the enchantment (for the shared box). */
  descHtml: string;
  /** Card body when only the enchantment differs. */
  enchantHtml: string;
}

export interface CardParts {
  /** key `stat:<label>=<value>`, html `<div class="stat ...">...</div>` */
  stats: CardPart[];
  /** key `score:<STR>=<value>`, html `STR 18/76` */
  scores: CardPart[];
  weapons: WeaponPart[];
  /** key `trait:<name>`, html `<a href="#name" class="trait-link">...</a>` */
  traitLinks: CardPart[];
  /** key `traitLine:<html>`: trait item lines, immunity entries, hide in shadows */
  traitLines: CardPart[];
  /**
   * key `ability:<html with id prefix removed>`; a sequencer or contingency has no ability (key
   * `combo:...`) and is listed after the others
   */
  abilities: AbilityPart[];
}

export type AbilityPart = CardPart & { ability?: CreatureAbility };

export type CardOmissions = ReadonlySet<string>;
