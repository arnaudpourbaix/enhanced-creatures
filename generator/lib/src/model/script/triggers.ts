import { GenericScriptRawData } from "./data";
import { AlignIdentifier } from "../ids/align";
import { AllegianceIdentifier } from "../ids/allegiance";
import { AStylesIdentifiers } from "../ids/astyles";
import { ClassIdentifier } from "../ids/class";
import { DamageIdentifier } from "../ids/damage";
import { GeneralIdentifier } from "../ids/general";
import { KitIdentifier } from "../ids/kit";
import { AreaTypeValue } from "../ids/misc";
import { RaceIdentifier } from "../ids/race";
import { SlotIdentifier } from "../ids/slot";
import { SpellIdentifier } from "../ids/spell";
import { SplStateIdentifier } from "../ids/splstate";
import { StateIdentifier } from "../ids/state";
import { StatsIdentifier } from "../ids/stats";
import { ParamObject } from "../parameter";
import { Aera } from "./aera";

// Converting to a plain module would mean updating every `Triggers.X` reference across ~24 files
// (same reasoning as actions.ts's Actions namespace) - out of scope for this pass.
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Triggers {
  export type TriggerName =
    | "HaveSpell"
    | "HaveSpellRES"
    | "HaveAnySpells"
    | "SpellCast"
    | "SpellCastRES"
    | "SpellCastOnMe"
    | "SpellCastOnMeRES"
    | "SpellCastPriest"
    | "SpellCastPriestRES"
    | "SpellCastInnate"
    | "SpellCastInnateRES"
    | "HaveKnownSpell"
    | "HaveKnownSpellRES"
    | "HasWeaponEquiped"
    | "HasItem"
    | "HasItemType"
    | "NumItems"
    | "NumItemsGT"
    | "NumItemsLT"
    | "NumItemsParty"
    | "NumItemsPartyGT"
    | "NumItemsPartyLT"
    | "HasItemEquiped"
    | "HasItemSlot"
    | "CheckItemSlot"
    | "CurrentAmmo"
    | "Global"
    | "GlobalGT"
    | "GlobalLT"
    | "GlobalsEqual"
    | "GlobalsGT"
    | "GlobalsLT"
    | "LocalsEqual"
    | "LocalsGT"
    | "LocalsLT"
    | "GlobalTimerExpired"
    | "GlobalTimerNotExpired"
    | "TimerExpired"
    | "RealGlobalTimerExact"
    | "RealGlobalTimerExpired"
    | "RealGlobalTimerNotExpired"
    | "HP"
    | "HPGT"
    | "HPLT"
    | "HPPercent"
    | "HPPercentLT"
    | "HPPercentGT"
    | "OnCreation"
    | "ActuallyInCombat"
    | "CombatCounter"
    | "CombatCounterLT"
    | "CombatCounterGT"
    | "AttackedBy"
    | "HitBy"
    | "TookDamage"
    | "DamageTaken"
    | "DamageTakenGT"
    | "DamageTakenLT"
    | "Help"
    | "Heard"
    | "InWeaponRange"
    | "CanEquipRanged"
    | "IsWeaponRanged"
    | "WeaponEffectiveVs"
    | "WeaponCanDamage"
    | "Level"
    | "LevelGT"
    | "LevelLT"
    | "ClassLevel"
    | "ClassLevelGT"
    | "ClassLevelLT"
    | "LOS"
    | "Exists"
    | "See"
    | "Detect"
    | "BecameVisible"
    | "Range"
    | "TargetUnreachable"
    | "NumCreature"
    | "NumCreatureLT"
    | "NumCreatureGT"
    | "NumCreatureVsParty"
    | "NumInParty"
    | "NumInPartyGT"
    | "NumInPartyLT"
    | "NumInPartyAlive"
    | "NumInPartyAliveGT"
    | "NumInPartyAliveLT"
    | "Killed"
    | "Die"
    | "Died"
    | "Dead"
    | "CheckStat"
    | "CheckStatGT"
    | "CheckStatLT"
    | "StateCheck"
    | "NotStateCheck"
    | "ExtendedStateCheck"
    | "CheckSpellState"
    | "Alignment"
    | "Allegiance"
    | "General"
    | "Race"
    | "Gender"
    | "Class"
    | "OriginalClass"
    | "Kit"
    | "Morale"
    | "MoraleGT"
    | "MoraleLT"
    | "Name"
    | "HasBounceEffects"
    | "HasImmunityEffects"
    | "ImmuneToSpellLevel"
    | "CanTurn"
    | "TurnedBy"
    | "AreaType"
    | "InMyArea"
    | "InMyGroup"
    | "InParty"
    | "True"
    | "False"
    | "ActionListEmpty"
    | "Delay"
    | "ReceivedOrder"
    | "RandomNum"
    | "RandomNumGT"
    | "RandomNumLT"
    | "IsActive"
    | "NumTimesTalkedTo"
    | "AreaCheck"
    | "InActiveArea"
    | "OpenState"
    | "NearSavedLocation";

  export interface BaseTrigger {
    negation?: boolean;
  }

  export interface HaveSpell extends BaseTrigger {
    name: "HaveSpell";
    params: [SpellIdentifier];
  }

  export interface HaveSpellRES extends BaseTrigger {
    name: "HaveSpellRES";
    params: [string];
  }

  export interface HaveAnySpells extends BaseTrigger {
    name: "HaveAnySpells";
  }

  export interface SpellCast extends BaseTrigger {
    name: "SpellCast";
    params: [ParamObject, SpellIdentifier];
  }

  export interface SpellCastRES extends BaseTrigger {
    name: "SpellCastRES";
    params: [string, ParamObject];
  }

  export interface SpellCastOnMe extends BaseTrigger {
    name: "SpellCastOnMe";
    params: [ParamObject, SpellIdentifier | 0];
  }

  export interface SpellCastOnMeRES extends BaseTrigger {
    name: "SpellCastOnMeRES";
    params: [string, ParamObject];
  }

  export interface HaveKnownSpell extends BaseTrigger {
    name: "HaveKnownSpell";
    params: [SpellIdentifier];
  }

  export interface HaveKnownSpellRES extends BaseTrigger {
    name: "HaveKnownSpellRES";
    params: [string];
  }

  export interface HasWeaponEquiped extends BaseTrigger {
    name: "HasWeaponEquiped";
    params: [ParamObject];
  }

  export interface HasItem extends BaseTrigger {
    name: "HasItem";
    params: [string, ParamObject];
  }

  export interface HasItemSlot extends BaseTrigger {
    name: "HasItemSlot";
    params: [ParamObject, SlotIdentifier];
  }

  export interface CurrentAmmo extends BaseTrigger {
    name: "CurrentAmmo";
    params: [string, ParamObject];
  }

  export interface Global extends BaseTrigger {
    name: "Global";
    params: [string, Aera, number];
  }

  export interface GlobalGT extends BaseTrigger {
    name: "GlobalGT";
    params: [string, Aera, number];
  }

  export interface GlobalLT extends BaseTrigger {
    name: "GlobalLT";
    params: [string, Aera, number];
  }

  export interface GlobalsEqual extends BaseTrigger {
    name: "GlobalsEqual";
    params: [string, string];
  }

  export interface GlobalsGT extends BaseTrigger {
    name: "GlobalsGT";
    params: [string, string];
  }

  export interface GlobalsLT extends BaseTrigger {
    name: "GlobalsLT";
    params: [string, string];
  }

  export interface LocalsEqual extends BaseTrigger {
    name: "LocalsEqual";
    params: [string, string];
  }

  export interface LocalsGT extends BaseTrigger {
    name: "LocalsGT";
    params: [string, string];
  }

  export interface LocalsLT extends BaseTrigger {
    name: "LocalsLT";
    params: [string, string];
  }

  export interface GlobalTimerExpired extends BaseTrigger {
    name: "GlobalTimerExpired";
    params: [string, "LOCALS"];
  }

  export interface GlobalTimerNotExpired extends BaseTrigger {
    name: "GlobalTimerNotExpired";
    params: [string, "LOCALS"];
  }

  export interface HP extends BaseTrigger {
    name: "HP";
    params: [ParamObject, number];
  }

  export interface HPGT extends BaseTrigger {
    name: "HPGT";
    params: [ParamObject, number];
  }

  export interface HPLT extends BaseTrigger {
    name: "HPLT";
    params: [ParamObject, number];
  }

  export interface HPPercent extends BaseTrigger {
    name: "HPPercent";
    params: [ParamObject, number];
  }

  export interface HPPercentLT extends BaseTrigger {
    name: "HPPercentLT";
    params: [ParamObject, number];
  }

  export interface HPPercentGT extends BaseTrigger {
    name: "HPPercentGT";
    params: [ParamObject, number];
  }

  export interface OnCreation extends BaseTrigger {
    name: "OnCreation";
  }

  export interface ActuallyInCombat extends BaseTrigger {
    name: "ActuallyInCombat";
  }

  export interface CombatCounter extends BaseTrigger {
    name: "CombatCounter";
    params: [number];
  }

  export interface CombatCounterLT extends BaseTrigger {
    name: "CombatCounterLT";
    params: [number];
  }

  export interface CombatCounterGT extends BaseTrigger {
    name: "CombatCounterGT";
    params: [number];
  }

  export interface AttackedBy extends BaseTrigger {
    name: "AttackedBy";
    params: [ParamObject, AStylesIdentifiers];
  }

  export interface HitBy extends BaseTrigger {
    name: "HitBy";
    params: [ParamObject, DamageIdentifier];
  }

  export interface TookDamage extends BaseTrigger {
    name: "TookDamage";
  }

  export interface DamageTaken extends BaseTrigger {
    name: "DamageTaken";
    params: [number];
  }

  export interface DamageTakenGT extends BaseTrigger {
    name: "DamageTakenGT";
    params: [number];
  }

  export interface DamageTakenLT extends BaseTrigger {
    name: "DamDamageTakenLTageTaken";
    params: [number];
  }

  export interface Help extends BaseTrigger {
    name: "Help";
    params: [ParamObject];
  }

  export interface Heard extends BaseTrigger {
    name: "Heard";
    params: [ParamObject, number];
  }

  export interface InWeaponRange extends BaseTrigger {
    name: "InWeaponRange";
    params: [ParamObject];
  }

  export interface CanEquipRanged extends BaseTrigger {
    name: "CanEquipRanged";
  }

  export interface IsWeaponRanged extends BaseTrigger {
    name: "IsWeaponRanged";
    params: [ParamObject];
  }

  export interface WeaponEffectiveVs extends BaseTrigger {
    name: "WeaponEffectiveVs";
    params: [ParamObject, number];
  }

  export interface WeaponCanDamage extends BaseTrigger {
    name: "WeaponCanDamage";
    params: [ParamObject, number];
  }

  export interface Level extends BaseTrigger {
    name: "Level";
    params: [ParamObject, number];
  }

  export interface LevelGT extends BaseTrigger {
    name: "LevelGT";
    params: [ParamObject, number];
  }

  export interface LevelLT extends BaseTrigger {
    name: "LevelLT";
    params: [ParamObject, number];
  }

  export interface ClassLevel extends BaseTrigger {
    name: "ClassLevel";
    params: [ParamObject, ClassIdentifier, number];
  }

  export interface ClassLevelGT extends BaseTrigger {
    name: "ClassLevelGT";
    params: [ParamObject, ClassIdentifier, number];
  }

  export interface ClassLevelLT extends BaseTrigger {
    name: "ClassLevelLT";
    params: [ParamObject, ClassIdentifier, number];
  }

  export interface LOS extends BaseTrigger {
    name: "LOS";
    params: [ParamObject, number];
  }

  export interface Exists extends BaseTrigger {
    name: "Exists";
    params: [ParamObject];
  }

  export interface See extends BaseTrigger {
    name: "See";
    params: [ParamObject];
  }

  export interface Detect extends BaseTrigger {
    name: "Detect";
    params: [ParamObject];
  }

  export interface BecameVisible extends BaseTrigger {
    name: "BecameVisible";
  }

  export interface Range extends BaseTrigger {
    name: "Range";
    params: [ParamObject, number];
  }

  export interface TargetUnreachable extends BaseTrigger {
    name: "TargetUnreachable";
    params: [ParamObject];
  }

  export interface NumCreature extends BaseTrigger {
    name: "NumCreature";
    params: [ParamObject, number];
  }

  export interface NumCreatureLT extends BaseTrigger {
    name: "NumCreatureLT";
    params: [ParamObject, number];
  }

  export interface NumCreatureGT extends BaseTrigger {
    name: "NumCreatureGT";
    params: [ParamObject, number];
  }

  export interface Killed extends BaseTrigger {
    name: "Killed";
    params: [ParamObject];
  }

  export interface Die extends BaseTrigger {
    name: "Die";
  }

  export interface Died extends BaseTrigger {
    name: "Died";
    params: [ParamObject];
  }

  export interface Dead extends BaseTrigger {
    name: "Dead";
    params: [string];
  }

  export interface CheckStat extends BaseTrigger {
    name: "CheckStat";
    params: [ParamObject, number, StatsIdentifier];
  }

  export interface CheckStatGT extends BaseTrigger {
    name: "CheckStatGT";
    params: [ParamObject, number, StatsIdentifier];
  }

  export interface CheckStatLT extends BaseTrigger {
    name: "CheckStatLT";
    params: [ParamObject, number, StatsIdentifier];
  }

  export interface StateCheck extends BaseTrigger {
    name: "StateCheck";
    params: [ParamObject, StateIdentifier];
  }

  export interface NotStateCheck extends BaseTrigger {
    name: "NotStateCheck";
    params: [ParamObject, StateIdentifier];
  }

  export interface CheckSpellState extends BaseTrigger {
    name: "CheckSpellState";
    params: [ParamObject, SplStateIdentifier | (string & {})];
  }

  export interface Alignment extends BaseTrigger {
    name: "Alignment";
    params: [ParamObject, AlignIdentifier];
  }

  export interface Allegiance extends BaseTrigger {
    name: "Allegiance";
    params: [ParamObject, AllegianceIdentifier];
  }

  export interface General extends BaseTrigger {
    name: "General";
    params: [ParamObject, GeneralIdentifier];
  }

  export interface Race extends BaseTrigger {
    name: "Race";
    params: [ParamObject, RaceIdentifier];
  }

  export interface Classe extends BaseTrigger {
    name: "Class";
    params: [ParamObject, ClassIdentifier];
  }

  export interface Kit extends BaseTrigger {
    name: "Kit";
    params: [ParamObject, KitIdentifier];
  }

  export interface HasBounceEffects extends BaseTrigger {
    name: "HasBounceEffects";
    params: [ParamObject];
  }

  export interface HasImmunityEffects extends BaseTrigger {
    name: "HasImmunityEffects";
    params: [ParamObject];
  }

  export interface ImmuneToSpellLevel extends BaseTrigger {
    name: "ImmuneToSpellLevel";
    params: [ParamObject, number];
  }

  export interface AreaType extends BaseTrigger {
    name: "AreaType";
    params: [AreaTypeValue];
  }

  export interface InMyArea extends BaseTrigger {
    name: "InMyArea";
    params: [ParamObject];
  }

  export interface InParty extends BaseTrigger {
    name: "InParty";
    params: [ParamObject];
  }

  export interface False extends BaseTrigger {
    name: "False";
  }

  export interface ActionListEmpty extends BaseTrigger {
    name: "ActionListEmpty";
  }

  export interface Delay extends BaseTrigger {
    name: "Delay";
    params: [number];
  }

  export interface RandomNum extends BaseTrigger {
    name: "RandomNum";
    params: [number, number];
  }

  export interface RandomNumGT extends BaseTrigger {
    name: "RandomNumGT";
    params: [number, number];
  }

  export interface RandomNumLT extends BaseTrigger {
    name: "RandomNumLT";
    params: [number, number];
  }

  export interface Name extends BaseTrigger {
    name: "Name";
    params: [string, ParamObject];
  }

  export interface NumTimesTalkedTo extends BaseTrigger {
    name: "NumTimesTalkedTo";
    params: [number];
  }

  export interface AreaCheck extends BaseTrigger {
    name: "AreaCheck";
    params: [string];
  }

  export interface InActiveArea extends BaseTrigger {
    name: "InActiveArea";
    params: [ParamObject];
  }

  export interface OpenState extends BaseTrigger {
    name: "OpenState";
    params: [ParamObject, "TRUE" | "FALSE"];
  }

  export interface NearSavedLocation extends BaseTrigger {
    name: "NearSavedLocation";
    params: [ParamObject, string, number];
  }

  export interface Or extends BaseTrigger {
    name: "Or";
    triggers: Trigger[];
  }

  export type Trigger =
    | Or
    | HaveSpell
    | HaveSpellRES
    | HaveAnySpells
    | SpellCast
    | SpellCastRES
    | SpellCastOnMe
    | SpellCastOnMeRES
    | HaveKnownSpell
    | HaveKnownSpellRES
    | HasWeaponEquiped
    | HasItem
    | HasItemSlot
    | CurrentAmmo
    | Global
    | GlobalGT
    | GlobalLT
    | GlobalsEqual
    | GlobalsGT
    | GlobalsLT
    | LocalsEqual
    | LocalsGT
    | LocalsLT
    | GlobalTimerExpired
    | GlobalTimerNotExpired
    | HP
    | HPGT
    | HPLT
    | HPPercent
    | HPPercentLT
    | HPPercentGT
    | OnCreation
    | ActuallyInCombat
    | CombatCounter
    | CombatCounterLT
    | CombatCounterGT
    | AttackedBy
    | HitBy
    | TookDamage
    | DamageTaken
    | DamageTakenGT
    | DamageTakenLT
    | Help
    | Heard
    | InWeaponRange
    | CanEquipRanged
    | IsWeaponRanged
    | WeaponEffectiveVs
    | WeaponCanDamage
    | Level
    | LevelGT
    | LevelLT
    | ClassLevel
    | ClassLevelGT
    | ClassLevelLT
    | LOS
    | Exists
    | See
    | Detect
    | BecameVisible
    | Range
    | TargetUnreachable
    | NumCreature
    | NumCreatureLT
    | NumCreatureGT
    | Killed
    | Die
    | Died
    | Dead
    | CheckStat
    | CheckStatGT
    | CheckStatLT
    | StateCheck
    | NotStateCheck
    | CheckSpellState
    | Alignment
    | Allegiance
    | General
    | Race
    | Classe
    | Kit
    | HasBounceEffects
    | HasImmunityEffects
    | ImmuneToSpellLevel
    | AreaType
    | InMyArea
    | InParty
    | False
    | ActionListEmpty
    | Delay
    | RandomNum
    | RandomNumGT
    | RandomNumLT
    | Name
    | NumTimesTalkedTo
    | AreaCheck
    | InActiveArea
    | OpenState
    | NearSavedLocation;

  // This is WeiDU trigger reference/documentation data, not application logic - many entries
  // legitimately share the same `parameters` signature or `section` grouping by coincidence of
  // the domain (dozens of triggers take the same param shape or belong to the same category).
  // Extracting each repeated value to a named constant would replace a self-explanatory inline
  // string with an indirection that doesn't aid readability here.
  /* eslint-disable sonarjs/no-duplicate-string */
  export const TRIGGERS: GenericScriptRawData[] = [
    {
      name: "HaveSpell",
      parameters: "I:Spell*Spell",
      description: "",
      section: "Spell",
    },
    {
      name: "HaveSpellRES",
      parameters: "S:Spell*",
      description:
        "Returns true only if the active CRE has the specified spell (either as symbolic value or resource string) memorised.",
      section: "Spell",
    },
    {
      name: "HaveAnySpells",
      parameters: "",
      description: "Returns true if the active CRE has at least one spell memorised.",
      section: "Spell",
    },
    {
      name: "SpellCast",
      parameters: "O:Object*,I:Spell*Spell",
      description: "",
      section: "Spell",
    },
    {
      name: "SpellCastRES",
      parameters: "S:Spell*,O:Object*",
      description:
        "Returns true only if the specified object cast the spell in the 2nd paramater in the last script round. If the Spell parameter is 0, then this will return true for ANY spell cast.",
      section: "Spell",
    },
    {
      name: "SpellCastOnMe",
      parameters: "O:Caster*,I:Spell*Spell",
      description: "",
      section: "Spell",
    },
    {
      name: "SpellCastOnMeRES",
      parameters: "S:Spell*,O:Caster*",
      description:
        'Returns true only if the specified object cast the specified spell on the active CRE in the last script round. If the Spell parameter is 0 (or " for the RES version), then this will return true for ANY spell cast. Returns false for spells whose Ability target is 4 (Any point within range).',
      section: "Spell",
    },
    {
      name: "SpellCastPriest",
      parameters: "O:Object*,I:Spell*Spell",
      description: "",
      section: "Spell",
    },
    {
      name: "SpellCastPriestRES",
      parameters: "S:Spell*,O:Object*",
      description:
        "Returns true only if the specified object cast the specified priest spell in the last script round.",
      section: "Spell",
    },
    {
      name: "SpellCastInnate",
      parameters: "O:Object*,I:Spell*Spell",
      description: "",
      section: "Spell",
    },
    {
      name: "SpellCastInnateRES",
      parameters: "S:Spell*,O:Object*",
      description:
        "Returns true only if the specified object cast the specified innate spell in the last script round. Note: The spell level must match the spell's definition (in SPELL.IDS) for the trigger to return true.",
      section: "Spell",
    },
    {
      name: "HaveKnownSpell",
      parameters: "I:Spell*Spell",
      description: "",
      section: "Spell",
    },
    {
      name: "HaveKnownSpellRES",
      parameters: "S:Spell*",
      description:
        "Returns true if the active CRE has the specified spell scribed in their spellbook. It does not have to be memorised.",
      section: "Spell",
    },
    {
      name: "HasWeaponEquiped",
      parameters: "O:Object*",
      description: "Returns true only if the specified object has a weapon in a quickslot.",
      section: "Item",
    },
    {
      name: "HasItem",
      parameters: "S:ResRef*,O:Object*",
      description: "",
      section: "Item",
    },
    {
      name: "HasItemType",
      parameters: "O:Object*,I:Type*ITEMFLAG,I:IgnoreDestructible*BOOLEAN",
      description:
        "Returns true only if the specified object has the specified item in its inventory. This trigger also checks with container items (e.g. Bags of Holding).",
      section: "Item",
    },
    {
      name: "NumItems",
      parameters: "S:ResRef*,O:Object*,I:Num*",
      description:
        "Returns true only if the specified object has the number of items in the 3rd parameter of the type specified in the 1st parameter in its inventory.",
      section: "Item",
    },
    {
      name: "NumItemsGT",
      parameters: "S:ResRef*,O:Object*,I:Num*",
      description:
        "Returns true only if the specified object has more than the number of items in the 3rd parameter of the type specified in the 1st parameter in its inventory.",
      section: "Item",
    },
    {
      name: "NumItemsLT",
      parameters: "S:ResRef*,O:Object*,I:Num*",
      description:
        "Returns true only if the specified object has fewer than the number of items in the 3rd parameter of the type specified in the 1st parameter in its inventory.",
      section: "Item",
    },
    {
      name: "NumItemsParty",
      parameters: "S:ResRef*,I:Num*",
      description:
        "Returns true only if the party has a total number of items of the type specified equal to the 2nd parameter.",
      section: "Item",
    },
    {
      name: "NumItemsPartyGT",
      parameters: "S:ResRef*,I:Num*",
      description:
        "Returns true only if the party has a total number of items of the type specified greater than the 2nd parameter.",
      section: "Item",
    },
    {
      name: "NumItemsPartyLT",
      parameters: "S:ResRef*,I:Num*",
      description:
        "Returns true only if the party has a total number of items of the type specified less than the 2nd parameter.",
      section: "Item",
    },
    {
      name: "HasItemEquiped",
      parameters: "S:ResRef*,O:Object*",
      description:
        "Returns true if the specified object has the specified item outside the general inventory slots (does not check for equipped status). This trigger does not work for Melf's Minute Meteors or other magically created weapons.",
      section: "Item",
    },
    {
      name: "HasItemSlot",
      parameters: "O:Object*,I:Slot*SLOTS",
      description:
        "NT Returns true only if the specified object has an item in the specified slot. This trigger does not work for items created by opcode #111 (such as Melf's Minute Meteors).",
      section: "Item",
    },
    {
      name: "CheckItemSlot",
      parameters: "O:Object*,S:Item*,I:Slot*SLOTS",
      description:
        "Returns true only if the item specified in the 2nd parameter can be found in the inventory slot (taken from slots.ids) of the specified object.",
      section: "Item",
    },
    {
      name: "CurrentAmmo",
      parameters: "S:ResRef*,O:Object*",
      description:
        "Returns true only if the specified object has a ranged weapon with the ammo specified by ResRef equipped.",
      section: "Item",
    },
    {
      name: "Global",
      parameters: "S:Name*,S:Area*,I:Value*",
      description:
        "Returns true only if the variable with name 1st parameter of type 2nd parameter has value 3rd parameter.",
      section: "Variable",
    },
    {
      name: "GlobalGT",
      parameters: "S:Name*,S:Area*,I:Value*",
      description:
        "See Global() except the variable must be greater than the value specified to be true.",
      section: "Variable",
    },
    {
      name: "GlobalLT",
      parameters: "S:Name*,S:Area*,I:Value*",
      description: "As above except for less than.",
      section: "Variable",
    },
    {
      name: "GlobalsEqual",
      parameters: "S:Name1*,S:Name2*",
      description: "Returns true only if the 2 global variables specified have equal values.",
      section: "Variable",
    },
    {
      name: "GlobalsGT",
      parameters: "S:Name1*,S:Name2*",
      description:
        "Returns true only if the 1st global variable has a value greater than the 2nd one.",
      section: "Variable",
    },
    {
      name: "GlobalsLT",
      parameters: "S:Name1*,S:Name2*",
      description:
        "Returns true only if the 1st global variable has a value less than the 2nd one.",
      section: "Variable",
    },
    {
      name: "LocalsEqual",
      parameters: "S:Name1*,S:Name2*",
      description: "Returns true only if the 2 local variables specified have equal values.",
      section: "Variable",
    },
    {
      name: "LocalsGT",
      parameters: "S:Name1*,S:Name2*",
      description:
        "Returns true only if the 1st local variable has a value greater than the 2nd one.",
      section: "Variable",
    },
    {
      name: "LocalsLT",
      parameters: "S:Name1*,S:Name2*",
      description: "Returns true only if the 1st local variable has a value less than the 2nd one.",
      section: "Variable",
    },
    {
      name: "GlobalTimerExpired",
      parameters: "S:Name*,S:Area*",
      description:
        "Returns true only if the timer with the name specified and of the type in the 2nd parameter has run and expired.",
      section: "Timer",
    },
    {
      name: "GlobalTimerNotExpired",
      parameters: "S:Name*,S:Area*",
      description:
        "Returns true only if the timer with the name specified and of the type in the 2nd parameter is still running. Note: If we use !GlobalTimerNotExpired(S:Name*,S:Area*), this will return true if the timer has never been set OR if it has already expired — very useful… most useful of all the GlobalTimer triggers.",
      section: "Timer",
    },
    {
      name: "TimerExpired",
      parameters: "I:ID*",
      description:
        "Returns true only if the local timer with the specified ID has expired. This action does not work as a state or response trigger in dialogs.",
      section: "Timer",
    },
    {
      name: "RealGlobalTimerExact",
      parameters: "S:Name*,S:Area*",
      description: "",
      section: "Timer",
    },
    {
      name: "RealGlobalTimerExpired",
      parameters: "S:Name*,S:Area*",
      description:
        "Returns true only if the timer with the specified name of the specified area has been set at least once and has now expired.",
      section: "Timer",
    },
    {
      name: "RealGlobalTimerNotExpired",
      parameters: "S:Name*,S:Area*",
      description:
        "Returns true only if the timer with the specified name of the specified area has been set and has not yet expired.",
      section: "Timer",
    },
    {
      name: "HP",
      parameters: "O:Object*,I:Hit Points*",
      description:
        "Returns true only if the current hitpoints of the specified object are equal to the 2nd parameter.",
      section: "Hit Points",
    },
    {
      name: "HPGT",
      parameters: "O:Object*,I:Hit Points*",
      description:
        "Returns true only if the current hitpoints of the specified object are greater than the 2nd parameter.",
      section: "Hit Points",
    },
    {
      name: "HPLT",
      parameters: "O:Object*,I:Hit Points*",
      description:
        "Returns true only if the current hitpoints of the specified object are less than the 2nd parameter.",
      section: "Hit Points",
    },
    {
      name: "HPPercent",
      parameters: "O:Object*,I:Hit Points*",
      description: "See HP() except this is for a percentage.",
      section: "Hit Points",
    },
    {
      name: "HPPercentLT",
      parameters: "O:Object*,I:Hit Points*",
      description: "See HPLT() except this is for a percentage.",
      section: "Hit Points",
    },
    {
      name: "HPPercentGT",
      parameters: "O:Object*,I:Hit Points*",
      description: "See HPGT() except this is for a percentage.",
      section: "Hit Points",
    },
    {
      name: "OnCreation",
      parameters: "",
      description:
        "Returns true if the script is processed for the first time this session, e.g. when a creature is created (for CRE scripts) or when the player enters an area (for ARE scripts).",
      section: "Combat",
    },
    {
      name: "ActuallyInCombat",
      parameters: "",
      description: "Returns true if combat counter is greater than 0.",
      section: "Combat",
    },
    {
      name: "CombatCounter",
      parameters: "I:Number*",
      description:
        "Returns true only if the combat counter (counts down from 150 after each attack) is of the value specified. CombatCounter(0) returns true only if there is no combat in the active area at the moment. CombatCounter() can give false results after dialog has been completed or after a Hide in Shadows check has been failed.",
      section: "Combat",
    },
    {
      name: "CombatCounterLT",
      parameters: "I:Number*",
      description:
        "Returns true only if the combat counter (counts down from 150 after each attack) is less than the value specified.",
      section: "Combat",
    },
    {
      name: "CombatCounterGT",
      parameters: "I:Number*",
      description:
        "Returns true only if the combat counter (counts down from 150 after each attack) is greater than the value specified. CombatCounterGT(0) returns true if there is any combat going on in the active area.",
      section: "Combat",
    },
    {
      name: "AttackedBy",
      parameters: "O:Object*,I:Style*AStyles",
      description:
        "Returns true only if the active CRE was attacked in the style specified (not necessarily hit) or had an offensive spell cast on it by the specified object in the last script round. The style parameter is non functional - this trigger is triggered by any attack style. Note that the LastAttacker object is only set for physical attacks (i.e. spell and script damage does not set LastAttacker).",
      section: "Combat",
    },
    {
      name: "HitBy",
      parameters: "I:Object*,I:DmgType*Damages",
      description:
        "Returns true only if the active CRE was hit by the specified object by the specified damage type in the last script round. If the damage type is CRUSHING or 0, then this will return true for ANY damage type. !HitBy() returns true when the script is first activated (e.g. initial area load) and when hit by any damage type.",
      section: "Combat",
    },
    {
      name: "TookDamage",
      parameters: "",
      description:
        "Returns true if some type of damage was caused to the active CRE (and HP were lost) in the last script round.",
      section: "Combat",
    },
    {
      name: "DamageTaken",
      parameters: "I:Amount*",
      description:
        "Returns true if the total damage taken by the active CRE is of the amount specified. Think of this as the reverse of testing for HP. See HP().",
      section: "Combat",
    },
    {
      name: "DamageTakenGT",
      parameters: "I:Amount*",
      description:
        "See above and HPGT(). Note: This trigger may not act correctly until the active creature has dropped below their maximum base HP (i.e. without CON bonus taken into account).",
      section: "Combat",
    },
    {
      name: "DamageTakenLT",
      parameters: "I:Amount*",
      description: "See above and HPLT().",
      section: "Combat",
    },
    {
      name: "Help",
      parameters: "O:Object*",
      description:
        "Returns true if the specified object shouted for Help() in the two script rounds. Help() has a range of approximately 40.",
      section: "Combat",
    },
    {
      name: "Heard",
      parameters: "O:Object*,I:ID*SHOUTIDS",
      description:
        "Returns true only if the active CRE was within 30 feet of the specified object and the specified object shouted the specified number (which does not have to be in SHOUTIDS.IDS) in the last script round. Note: If the object is specified as a death variable, the trigger will only return true if the corresponding object shouting also has an Enemy-Ally flag of NEUTRAL.",
      section: "Combat",
    },
    {
      name: "InWeaponRange",
      parameters: "O:Object*",
      description:
        "Returns true only if the specified object is within the range of the active CRE's currently equipped weapon.",
      section: "Attack",
    },
    {
      name: "CanEquipRanged",
      parameters: "",
      description:
        "Returns true only if the active creature can switch to a ranged weapon that is ready for use (e.g. a throwing weapon, such as darts, or a launcher with corresponding ammo, such as bow and arrow).",
      section: "Attack",
    },
    {
      name: "IsWeaponRanged",
      parameters: "O:Object*",
      description:
        "Returns true if a ranged weapon (i.e. bow or thrown axe) is currently equipped and selected on the specified object.",
      section: "Attack",
    },
    {
      name: "WeaponEffectiveVs",
      parameters: "O:Object*,I:Hand*HAND",
      description:
        "Returns true if the weapon equipped in the hand defined by the 2nd parameter of the active creature can hit the target object specified in the 1st parameter.",
      section: "Attack",
    },
    {
      name: "WeaponCanDamage",
      parameters: "O:Object*,I:Hand*HAND",
      description:
        "Returns true if the weapon equipped in the hand defined by the 2nd parameter of the active creature can cause non-zero damage to the target object specified in the 1st parameter.",
      section: "Attack",
    },
    {
      name: "Level",
      parameters: "O:Object*,I:Level*",
      description:
        "Returns true only if the experience level of the specified object equals the 2nd parameter.",
      section: "Level",
    },
    {
      name: "LevelGT",
      parameters: "O:Object*,I:Level*",
      description:
        "Returns true only if the experience level of the specified object is greater than the 2nd parameter.",
      section: "Level",
    },
    {
      name: "LevelLT",
      parameters: "O:Object*,I:Level*",
      description:
        "Returns true only if the experience level of the specified object is less than the 2nd parameter.",
      section: "Level",
    },
    {
      name: "ClassLevel",
      parameters: "O:Object*,I:Category*CLASSCAT,I:Value*",
      description:
        "Returns true only if the experience level of the specified object in the class denoted by the 2nd parameter equals the 3rd parameter.",
      section: "Level",
    },
    {
      name: "ClassLevelGT",
      parameters: "O:Object*,I:Category*CLASSCAT,I:Value*",
      description:
        "Returns true only if the experience level of the specified object in the class denoted by the 2nd parameter is greater than the 3rd parameter.",
      section: "Level",
    },
    {
      name: "ClassLevelLT",
      parameters: "O:Object*,I:Category*CLASSCAT,I:Value*",
      description:
        "Returns true only if the experience level of the specified object in the class denoted by the 2nd parameter is less than the 3rd parameter.",
      section: "Level",
    },
    {
      name: "LOS",
      parameters: "O:Object*,I:Range*",
      description:
        "Returns true only if the object specified is in the line of sight of the active CRE and within the given range. This seems to be a combination of the Range() and See() triggers. Range seems limited to the default visual range (30).",
      section: "Vision and Range",
    },
    {
      name: "Exists",
      parameters: "O:Object*",
      description:
        "Returns true only if the specified object exists in the current area (note that dead creatures can still be counted as existing). For the global objects (creatures that get stored in the GAM file, like NPCs that were joined in the past) it always returns true.",
    },
    {
      name: "See",
      parameters: "O:Object*",
      description:
        "Returns true only if the active CRE can see the specified object which must not be hidden or invisible.",
    },
    {
      name: "Detect",
      parameters: "O:Object*",
      description:
        "Returns true if the the specified object is detected by the active CRE in any way (hearing or sight). Neither Move Silently nor Hide in Shadows prevent creatures from being detected via Detect(). Detect ignores Protection from Creature Type effects for static objects.",
    },
    {
      name: "BecameVisible",
      parameters: "",
      description: "Returns true only if the active CRE turned visible in the last script round.",
    },
    {
      name: "Range",
      parameters: "O:Object*,I:Range*",
      description:
        "Returns true only if the specified object is within distance given (in feet) of the active CRE. Range seems limited to the default visual range (30), and does not bypass objects. Range is affected by foot circle size (e.g. the minimum range for a huge foot circle creature (Dragon) is 8). Melee range is 4.",
    },
    {
      name: "TargetUnreachable",
      parameters: "O:Object*",
      description:
        "Returns true only if an action from the Attack, Spell or UseItem families that targeted the object specified cannot work with that target any more. That can happen from it not being in the area, deactivation, imprisonment, invisibility and sanctuary (provided true seeing options are not in play).",
    },
    {
      name: "NumCreature",
      parameters: "O:Object*,I:Number*",
      description:
        "Returns true only if the number of creatures of the type specified in sight of the active CRE are equal to the 2nd parameter.",
      section: "Number of creatures",
    },
    {
      name: "NumCreatureLT",
      parameters: "O:Object*,I:Number*",
      description: "As above except for less than.",
      section: "Number of creatures",
    },
    {
      name: "NumCreatureGT",
      parameters: "O:Object*,I:Number*",
      description: "As above except for greater than.",
      section: "Number of creatures",
    },
    {
      name: "NumCreatureVsParty",
      parameters: "O:Object*,I:Number*",
      description:
        "Returns true if the number of hostile creatures of the type specified in the 1st parameter that are currently in fighting range of the party, minus the number of party members, is equal to the 2nd parameter.",
      section: "Number of creatures",
    },
    {
      name: "NumInParty",
      parameters: "I:Num*",
      description:
        "Returns true only if the number of party members (dead ones also count) is equal to the number specified.",
      section: "Number of creatures",
    },
    {
      name: "NumInPartyGT",
      parameters: "I:Num*",
      description:
        "Returns true only if the number of party members (dead ones also count) is greater than the number specified.",
      section: "Number of creatures",
    },
    {
      name: "NumInPartyLT",
      parameters: "I:Num*",
      description:
        "Returns true only if the number of party members (dead ones also count) is less than the number specified.",
      section: "Number of creatures",
    },
    {
      name: "NumInPartyAlive",
      parameters: "I:Num*",
      description:
        "Returns true only if the number of party members alive is equal to the number specified.",
      section: "Number of creatures",
    },
    {
      name: "NumInPartyAliveGT",
      parameters: "I:Num*",
      description:
        "Returns true only if the number of party members alive is greater than the number specified.",
      section: "Number of creatures",
    },
    {
      name: "NumInPartyAliveLT",
      parameters: "I:Num*",
      description:
        "Returns true only if the number of party members alive is less than the number specified.",
      section: "Number of creatures",
    },
    {
      name: "Killed",
      parameters: "O:Object*",
      description:
        "Returns true if the active CRE killed the specified object in the last script round.",
      section: "Death",
    },
    {
      name: "Die",
      parameters: "",
      description:
        "Returns true if the active CRE has died in the last script round. Note: When a block returns true to this trigger, this will be the final block executed in the script, unless it is Continue().",
      section: "Death",
    },
    {
      name: "Died",
      parameters: "O:Object*",
      description: "Returns true only if the specified object died in the last script round.",
      section: "Death",
    },
    {
      name: "Dead",
      parameters: "S:Name*",
      description:
        "Returns only true if the creature with the specified script name has its death variable set to 1. Not every form of death sets this, but most do. So it's an almost complete test for death. The creature must have existed for this to be true. Note that SPRITE_IS_DEAD variables are not set if the creaure is killed by a neutral creature.",
      section: "Death",
    },
    {
      name: "CheckStat",
      parameters: "O:Object*,I:Value*,I:StatNum*Stats",
      description:
        "Returns true only if the specified object has the statistic in the 3rd parameter at the value of the 2nd parameter. Info: This trigger looks at the entire value of any STAT (16 or 32 bits, depending on the STAT).",
      section: "Stats",
    },
    {
      name: "CheckStatGT",
      parameters: "O:Object*,I:Value*,I:StatNum*Stats",
      description:
        "Returns true only if the specified object has the statistic in the 3rd parameter greater than the value of the 2nd parameter. Info: This trigger looks at the entire value of any STAT (16 or 32 bits, depending on the STAT).",
      section: "Stats",
    },
    {
      name: "CheckStatLT",
      parameters: "O:Object*,I:Value*,I:StatNum*Stats",
      description:
        "Returns true only if the specified object has the statistic in the 3rd parameter less than the value of the 2nd parameter. Info: This trigger looks at the entire value of any STAT (16 or 32 bits, depending on the STAT).",
      section: "Stats",
    },
    {
      name: "StateCheck",
      parameters: "O:Object*,I:State*State",
      description: "Returns true only if the specified object is in the state specified.",
      section: "State",
    },
    {
      name: "NotStateCheck",
      parameters: "O:Object*,I:State*State",
      description: "Returns true only if the specified object is not in the state specified.",
      section: "State",
    },
    {
      name: "ExtendedStateCheck",
      parameters: "O:Object*,I:State*extstate",
      description:
        "Returns true only if the specified object is in the state specified (uses extstate.ids).",
      section: "State",
    },
    {
      name: "CheckSpellState",
      parameters: "O:Object*,I:State*splstate",
      description:
        "Returns true only if the specified object is in the state specified (uses splstate.ids). Spell states can be set via opcode 328.",
      section: "State",
    },
    {
      name: "Alignment",
      parameters: "O:Object*,I:Alignment*Align",
      description:
        "Returns true only if the alignment of the specified object matches that in the second parameter. Bug: Doesn't evaluate object selectors (e.g. [PC]).",
      section: "Creature checks",
    },
    {
      name: "Allegiance",
      parameters: "O:Object*,I:Allegience*EA",
      description:
        "Returns true only if the Enemy/Ally status of the specified object matches that in the second parameter. Bug: Doesn't evaluate object selectors (e.g. [PC]).",
      section: "Creature checks",
    },
    {
      name: "General",
      parameters: "O:Object*,I:General*General",
      description:
        "Returns true only if the General category of the specified object matches that in the second parameter. Bug: Doesn't evaluate object selectors (e.g. [PC]).",
      section: "Creature checks",
    },
    {
      name: "Race",
      parameters: "O:Object*,I:Race*Race",
      description:
        "Returns true only if the Race of the specified object is the same as that specified by the 2nd parameter. Bug: Doesn't evaluate object selectors (e.g. [PC]).",
      section: "Creature checks",
    },
    {
      name: "Gender",
      parameters: "O:Object*,I:Sex*Gender",
      description:
        "Returns true only if the gender of the specified object is that given in the 2nd parameter. Bug: Doesn't evaluate object selectors (e.g. [PC]).",
      section: "Creature checks",
    },
    {
      name: "Class",
      parameters: "O:Object*,I:Class*Class",
      description:
        "Returns true only if the Class of the specified object matches that in the second parameter.",
      section: "Creature checks",
    },
    {
      name: "OriginalClass",
      parameters: "O:Object*,I:Class*CLASS",
      description:
        "Returns true if the original class of a dual-classed creature equals the class specified in the 2nd parameter.",
      section: "Creature checks",
    },
    {
      name: "Kit",
      parameters: "O:Object*,I:Kit*KIT",
      description: "Returns true only if the specified object is of the kit specified.",
      section: "Creature checks",
    },
    {
      name: "Morale",
      parameters: "O:Object*,I:Morale*",
      description:
        "Returns true only if the morale of the specified object is equal to the 2nd parameter.",
      section: "Creature checks",
    },
    {
      name: "MoraleGT",
      parameters: "O:Object*,I:Morale*",
      description:
        "Returns true only if the morale of the specified object is greater than the 2nd parameter.",
      section: "Creature checks",
    },
    {
      name: "MoraleLT",
      parameters: "O:Object*,I:Morale*",
      description:
        "Returns true only if the morale of the specified object is less than the 2nd parameter.",
      section: "Creature checks",
    },
    {
      name: "Name",
      parameters: "S:Name*,O:Object*",
      description:
        "Returns true only if the object in the 2nd parameter has the script name specified.",
      section: "Creature checks",
    },
    {
      name: "HasBounceEffects",
      parameters: "O:Object*",
      description:
        "Returns true if any of the specified object is currently affected by any of the listed effects: Bounce Projectile, Bounce Opcode, Bounce Spell Level, Decrementing Bounce Spells, Bounce Spell School, Bounce Secondary Type, Bounce Specified Spell, Bounce School Decrement, Bounce Secondary Type Decrement",
      section: "Immunity",
    },
    {
      name: "HasImmunityEffects",
      parameters: "O:Object*",
      description:
        "Returns true if any of the specified object is currently affected by any of the listed effects: Protection from projectiles, Protection from effects, Protection from portrait icon, Protection from display string, Protection from visual effect, Immunity to spell level, Decrementing spell level immunity, Immunity to primary type (school",
      section:
        "Immunity to secondary type, Decrementing immunity to primary type, Decrementing immunity to secondary type",
    },
    {
      name: "ImmuneToSpellLevel",
      parameters: "O:Object*,I:Level*",
      description:
        "Returns true if the specified object is immune to spells of the level specified by the 2nd parameter.",
      section: "Immunity",
    },
    {
      name: "CanTurn",
      parameters: "O:Object*,I:Difference*",
      description:
        "Returns true if the active CRE can turn the (undead) target object with a level difference equal to or greater than the value specified in the 2nd parameter.",
      section: "Turn Undead",
    },
    {
      name: "TurnedBy",
      parameters: "O:Object*",
      description:
        "Returns true only if the active CRE was turned by the specified priest or paladin.",
      section: "Turn Undead",
    },
    {
      name: "AreaType",
      parameters: "I:Number*AREATYPE",
      description:
        "Returns true only if the area in which the active CRE is, has the specified type flag set. Note that the value is OR'd. This trigger can cause a crash if it evaluates to true and is used as the first trigger in a dead NPCs dream script.",
      section: "Party or area check",
    },
    {
      name: "InMyArea",
      parameters: "O:Object*",
      description:
        "Returns true only if the specified object is in the same area as the active CRE, object or in the area itself (depending on the script/dialog with the trigger).",
      section: "Party or area check",
    },
    {
      name: "InMyGroup",
      parameters: "O:Object*",
      description:
        "Returns true only if the specifics value of the specified object is the same as that of the active CRE.",
      section: "Party or area check",
    },
    {
      name: "InParty",
      parameters: "O:Object*",
      description:
        "Returns true only if the specified object is in the player's party. Info: Alternate object selector (e.g. [PC]) behavior — returns true if a party member matches against the selector.",
      section: "Party or area check",
    },
    {
      name: "True",
      parameters: "",
      description: "Always returns true.",
      section: "Misc.",
    },
    {
      name: "False",
      parameters: "",
      description: "Never returns true, i.e. is always false.",
      section: "Misc.",
    },
    {
      name: "ActionListEmpty",
      parameters: "",
      description:
        "Returns true only if the active CRE has no actions waiting to be performed, i.e. is idle.",
      section: "Misc.",
    },
    {
      name: "Delay",
      parameters: "I:Delay*",
      description:
        "Delays the next check of the block of triggers where this trigger is, by the number of seconds specified. This value is not stored when the game is saved.",
      section: "Misc.",
    },
    {
      name: "ReceivedOrder",
      parameters: "O:Object*,I:Order ID*",
      description:
        "This trigger is used in conjunction with the GiveOrder() action, and works in a similar way to the Heard() trigger. Only one creature at a time responds to an order, and creatures do not detect their own orders. The creature must be in visual range for this trigger to work.",
      section: "Misc.",
    },
    {
      name: "RandomNum",
      parameters: "I:Range*,I:Value*",
      description:
        "Generates a random number between 1 and Range. Returns true only if the random number equals the 2nd parameter. Note: Scripting uses the same random value to seed all RandomNum() triggers across a single tick. If you have multiple RandomNum() calls with the same parameters, they will all generate the same result.",
      section: "Misc.",
    },
    {
      name: "RandomNumGT",
      parameters: "I:Range*,I:Value*",
      description:
        "NT As above except returns true only if the random number is greater than the 2nd parameter.",
      section: "Misc.",
    },
    {
      name: "RandomNumLT",
      parameters: "I:Range*,I:Value*",
      description:
        "NT As above except returns true only if the random number is less than the 2nd parameter.",
      section: "Misc.",
    },
    {
      name: "IsActive",
      parameters: "O:Object*",
      description:
        "Returns true if the specified creature is active and false if it is deactivated. A creature will continue to execute script blocks even while deactivated — this trigger can be used to restrict this behaviour.",
      section: "Misc.",
    },
    {
      name: "NumTimesTalkedTo",
      parameters: "I:Num*",
      description:
        "Returns true only if the player's party has spoken to the active CRE the exact number of times specified.",
      section: "Misc.",
    },
    {
      name: "AreaCheck",
      parameters: "S:ResRef*",
      description: "Returns true only if the active CRE is in the area specified.",
      section: "Misc.",
    },
    {
      name: "InActiveArea",
      parameters: "O:Object*",
      description:
        "Returns true only if specified object is in the active area. The active area is that in which Player1 is. This trigger will crash the game if the specified creature is not in the active area and is not a global object.",
      section: "Misc.",
    },
    {
      name: "OpenState",
      parameters: "O:Object*,I:Open*BOOLEAN",
      description:
        "Returns true only if the open state of the specified door matches the state specified in the 2nd parameter.",
      section: "Misc.",
    },
    {
      name: "NearSavedLocation",
      parameters: "O:Object*,S:Global*,I:Range*",
      description:
        "Returns true if the object is near its home location (in case the specified variable doesn't exist) or near a point marked by a variable. The default home location for creatures is equal to their default position in the ARE file.",
      section: "Misc.",
    },
  ];
  /* eslint-enable sonarjs/no-duplicate-string */
}
