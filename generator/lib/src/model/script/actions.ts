import { GenericScriptRawData } from "./data";
import { ClassIdentifier } from "../ids/class";
import { DamageIdentifier } from "../ids/damage";
import { SlotIdentifier } from "../ids/slot";
import { SpellIdentifier } from "../ids/spell";
import { ParamObject } from "../parameter";

// Converting to a plain module would mean updating every `Actions.X` reference across ~24 files
// (baf-generator.service.ts, statement-builder.service.ts, action.factory.ts, etc.) - out of
// scope for this pass; the namespace groups a large set of related types under one qualified name.
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Actions {
  export type ActionName =
    | "Attack"
    | "AttackOneRound"
    | "AttackReevaluate"
    | "Enemy"
    | "Ally"
    | "ChangeEnemyAlly"
    | "MoveToObject"
    | "MoveToObjectFollow"
    | "MoveToObjectNoInterrupt"
    | "MoveToSavedLocation"
    | "MoveToSavedLocationn"
    | "RunAwayFrom"
    | "RunAwayFromNoInterruptNoLeaveArea"
    | "RunAwayFromNoLeaveArea"
    | "RunAwayFromNoInterrupt"
    | "RandomWalk"
    | "RandomWalkTime"
    | "RandomWalkContinuousTime"
    | "RandomWalkContinuous"
    | "SetGlobal"
    | "AddGlobals"
    | "IncrementGlobal"
    | "StartTimer"
    | "SetGlobalTimer"
    | "Spell"
    | "SpellRES"
    | "SpellNoDec"
    | "SpellNoDecRES"
    | "SpellPoint"
    | "SpellPointRES"
    | "ForceSpell"
    | "ForceSpellRES"
    | "ForceSpellPoint"
    | "ForceSpellPointRES"
    | "ForceSpellRange"
    | "ForceSpellRangeRES"
    | "ForceSpellPointRange"
    | "ForceSpellPointRangeRES"
    | "SpellPointNoDec"
    | "SpellPointNoDecRES"
    | "ReallyForceSpellPoint"
    | "ReallyForceSpellPointRES"
    | "ReallyForceSpell"
    | "ReallyForceSpellRES"
    | "ApplySpell"
    | "ApplySpellRES"
    | "RemoveSpell"
    | "RemoveSpellRES"
    | "ReallyForceSpellDead"
    | "ReallyForceSpellDeadRES"
    | "EquipItem"
    | "UseItem"
    | "SelectWeaponAbility"
    | "EquipMostDamagingMelee"
    | "EquipRanged"
    | "GiveOrder"
    | "Help"
    | "Hide"
    | "Panic"
    | "Turn"
    | "Rest"
    | "Shout"
    | "DestroySelf"
    | "Kill"
    | "DisplayString"
    | "ChangeClass"
    | "ChangeAnimation"
    | "GlobalShout"
    | "Calm"
    | "DisplayStringHead"
    | "AddKit"
    | "ApplyDamage"
    | "ApplyDamagePercent"
    | "NoAction"
    | "ClearActions"
    | "Continue"
    | "Wait"
    | "SmallWait"
    | "SetInterrupt"
    | "FaceObject"
    | "StartDialogueNoSet"
    | "ActionOverride"
    | "JumpToPoint"
    | "CreateCreatureOffscreen"
    | "CreateCreatureObject"
    | "CreateCreatureObjectEffect"
    | "RandomTurn"
    | "OpenDoor"
    | "StartCutSceneMode"
    | "StartCutScene";

  export interface Attack {
    name: "Attack";
    params: [ParamObject];
  }

  export interface AttackOneRound {
    name: "AttackOneRound";
    params: [ParamObject];
  }

  export interface AttackReevaluate {
    name: "AttackReevaluate";
    params: [ParamObject, number];
  }

  export interface Enemy {
    name: "Enemy";
  }

  export interface Ally {
    name: "Ally";
  }

  export interface MoveToObject {
    name: "MoveToObject";
    params: [ParamObject];
  }

  export interface MoveToObjectNoInterrupt {
    name: "MoveToObjectNoInterrupt";
    params: [ParamObject];
  }

  export interface MoveToObjectFollow {
    name: "MoveToObjectFollow";
    params: [ParamObject];
  }

  export interface MoveToSavedLocation {
    name: "MoveToSavedLocation";
    params: [ParamObject, string];
  }

  export interface MoveToSavedLocationn {
    name: "MoveToSavedLocationn";
    params: [ParamObject, string];
  }

  export interface RunAwayFrom {
    name: "RunAwayFrom";
    params: [ParamObject, number];
  }

  export interface RunAwayFromNoInterruptNoLeaveArea {
    name: "RunAwayFromNoInterruptNoLeaveArea";
    params: [ParamObject, number];
  }

  export interface RunAwayFromNoLeaveArea {
    name: "RunAwayFromNoLeaveArea";
    params: [ParamObject, number];
  }

  export interface RunAwayFromNoInterrupt {
    name: "RunAwayFromNoInterrupt";
    params: [ParamObject, number];
  }

  export interface RandomWalk {
    name: "RandomWalk";
  }

  export interface RandomWalkTime {
    name: "RandomWalkTime";
    params: [number];
  }

  export interface RandomWalkContinuousTime {
    name: "RandomWalkContinuousTime";
    params: [number];
  }

  export interface RandomWalkContinuous {
    name: "RandomWalkContinuous";
  }

  export interface SetGlobal {
    name: "SetGlobal";
    params: [string, "LOCALS" | "GLOBAL" | (string & {}), number];
  }

  export interface AddGlobals {
    name: "AddGlobals";
    params: [string, string];
  }

  export interface IncrementGlobal {
    name: "IncrementGlobal";
    params: [string, "LOCALS" | "GLOBAL", number];
  }

  export interface SetGlobalTimer {
    name: "SetGlobalTimer";
    params: [string, "LOCALS" | "GLOBAL", number];
  }

  export interface Spell {
    name: "Spell";
    params: [ParamObject, SpellIdentifier];
  }

  export interface SpellRES {
    name: "SpellRES";
    params: [string, ParamObject];
  }

  export interface SpellNoDec {
    name: "SpellNoDec";
    params: [ParamObject, SpellIdentifier];
  }

  export interface SpellNoDecRES {
    name: "SpellNoDecRES";
    params: [string, ParamObject];
  }

  export interface ForceSpell {
    name: "ForceSpell";
    params: [ParamObject, SpellIdentifier];
  }

  export interface ForceSpellRES {
    name: "ForceSpellRES";
    params: [string, ParamObject];
  }

  export interface SpellNoDec {
    name: "SpellNoDec";
    params: [ParamObject, SpellIdentifier];
  }

  export interface SpellNoDecRES {
    name: "SpellNoDecRES";
    params: [string, ParamObject];
  }

  export interface ReallyForceSpell {
    name: "ReallyForceSpell";
    params: [ParamObject, SpellIdentifier];
  }

  export interface ReallyForceSpellRES {
    name: "ReallyForceSpellRES";
    params: [string, ParamObject];
  }

  export interface ApplySpell {
    name: "ApplySpell";
    params: [ParamObject, SpellIdentifier];
  }

  export interface ApplySpellRES {
    name: "ApplySpellRES";
    params: [string, ParamObject];
  }

  export interface RemoveSpell {
    name: "RemoveSpell";
    params: [SpellIdentifier];
  }

  export interface RemoveSpellRES {
    name: "RemoveSpellRES";
    params: [string];
  }

  export interface EquipItem {
    name: "EquipItem";
    params: [string];
  }

  export interface UseItem {
    name: "UseItem";
    params: [string, ParamObject];
  }

  export interface SelectWeaponAbility {
    name: "SelectWeaponAbility";
    params: [SlotIdentifier, number];
  }

  export interface EquipMostDamagingMelee {
    name: "EquipMostDamagingMelee";
  }

  export interface EquipRanged {
    name: "EquipRanged";
  }

  export interface Help {
    name: "Help";
  }

  export interface Hide {
    name: "Hide";
  }

  export interface Panic {
    name: "Panic";
  }

  export interface Turn {
    name: "Turn";
  }

  export interface Rest {
    name: "Rest";
  }

  export interface Shout {
    name: "Shout";
    params: [number];
  }

  export interface DestroySelf {
    name: "DestroySelf";
  }

  export interface Kill {
    name: "Kill";
    params: [ParamObject];
  }

  export interface DisplayString {
    name: "DisplayString";
    params: [ParamObject, number | string];
  }

  export interface ChangeClass {
    name: "ChangeClass";
    params: [ParamObject, ClassIdentifier];
  }

  export interface ChangeAnimation {
    name: "ChangeAnimation";
    params: [string];
  }

  export interface DisplayStringHead {
    name: "DisplayStringHead";
    params: [ParamObject, number | string];
  }

  export interface ApplyDamage {
    name: "ApplyDamage";
    params: [ParamObject, number, DamageIdentifier];
  }

  export interface NoAction {
    name: "NoAction";
  }

  export interface ClearActions {
    name: "ClearActions";
    params: [ParamObject];
  }

  export interface Continue {
    name: "Continue";
  }

  export interface Wait {
    name: "Wait";
    params: [number];
  }

  export interface SmallWait {
    name: "SmallWait";
    params: [number];
  }

  export interface SetInterrupt {
    name: "SetInterrupt";
    params: ["TRUE" | "FALSE"];
  }

  export interface CreateCreatureOffScreen {
    name: "CreateCreatureOffScreen";
    params: [string, number];
  }

  export interface CreateCreatureObject {
    name: "CreateCreatureObject";
    params: [string, ParamObject];
  }

  export interface CreateCreatureObjectEffect {
    name: "CreateCreatureObjectEffect";
    params: [string, string, ParamObject];
  }

  export interface FaceObject {
    name: "FaceObject";
    params: [ParamObject];
  }

  export interface StartDialogueNoSet {
    name: "StartDialogueNoSet";
    params: [ParamObject];
  }

  export interface ActionOverride {
    name: "ActionOverride";
    params: [ParamObject, string];
  }

  export interface JumpToPoint {
    name: "JumpToPoint";
    params: [string];
  }

  export interface CreateCreatureOffscreen {
    name: "CreateCreatureOffscreen";
    params: [string, number];
  }

  export interface RandomTurn {
    name: "RandomTurn";
  }

  export interface OpenDoor {
    name: "OpenDoor";
    params: [ParamObject];
  }

  export interface StartCutSceneMode {
    name: "StartCutSceneMode";
  }

  export interface StartCutScene {
    name: "StartCutScene";
    params: [string];
  }

  export type Action =
    | Attack
    | AttackOneRound
    | AttackReevaluate
    | Enemy
    | Ally
    | MoveToObject
    | MoveToObjectNoInterrupt
    | MoveToObjectFollow
    | MoveToSavedLocation
    | MoveToSavedLocationn
    | RunAwayFrom
    | RunAwayFromNoInterruptNoLeaveArea
    | RunAwayFromNoLeaveArea
    | RunAwayFromNoInterrupt
    | RandomWalk
    | RandomWalkTime
    | RandomWalkContinuousTime
    | RandomWalkContinuous
    | SetGlobal
    | AddGlobals
    | IncrementGlobal
    | SetGlobalTimer
    | Spell
    | SpellRES
    | SpellNoDec
    | SpellNoDecRES
    | ForceSpell
    | ForceSpellRES
    | ReallyForceSpell
    | ReallyForceSpellRES
    | ApplySpell
    | ApplySpellRES
    | RemoveSpell
    | RemoveSpellRES
    | EquipItem
    | UseItem
    | SelectWeaponAbility
    | EquipMostDamagingMelee
    | EquipRanged
    | Help
    | Hide
    | Panic
    | Turn
    | Rest
    | Shout
    | DestroySelf
    | Kill
    | DisplayString
    | ChangeClass
    | ChangeAnimation
    | DisplayStringHead
    | ApplyDamage
    | NoAction
    | ClearActions
    | Continue
    | Wait
    | SmallWait
    | SetInterrupt
    | FaceObject
    | StartDialogueNoSet
    | ActionOverride
    | JumpToPoint
    | CreateCreatureOffscreen
    | CreateCreatureObject
    | CreateCreatureObjectEffect
    | RandomTurn
    | OpenDoor
    | StartCutSceneMode
    | StartCutScene;

  // This is WeiDU action reference/documentation data, not application logic - many entries
  // legitimately share the same `parameters` signature or `section` grouping by coincidence of
  // the domain (dozens of actions take the same param shape or belong to the same category).
  // Extracting each repeated value to a named constant would replace a self-explanatory inline
  // string with an indirection that doesn't aid readability here.
  /* eslint-disable sonarjs/no-duplicate-string */
  export const ACTIONS: GenericScriptRawData[] = [
    {
      name: "Attack",
      parameters: "O:Target*",
      description:
        "This action instructs the active creature to continually attack the target, i.e. the active creature will not switch targets until its target is dead.",
      section: "Attack",
    },
    {
      name: "AttackOneRound",
      parameters: "O:Target*",
      description:
        "This action instructs the active creature to attack the specified target for one round. Note: This action shares most of its code with AttackReevaluate(). In fact, it is 'AttackReevaluate()' with an extra hardcoded bit that forces it to terminate after one round. This means that, unlike in 'AttackReevaluate()', ActionListEmpty() will return TRUE once a round is up - and unless you immediately reinstate 'AttackOneRound()', the creature won't continue attacking.",
      section: "Attack",
    },
    {
      name: "AttackReevaluate",
      parameters: "O:Target*,I:ReevaluationPeriod*",
      description:
        "This action instructs the active creature to attack the target for the specified time (ReevaluationPeriod) which is measured in AI updates (which default to 15 per second).The script will then run again, checking for other true conditions. Just to give an idea, AttackOneRound() would be equivalent to AttackReevaluate() with a 100 tick reevaluation period.",
      section: "Attack",
    },
    {
      name: "Enemy",
      parameters: "",
      description:
        "This action is used to change the allegiance of the active creature to enemy (making them hostile to the PC).",
      section: "Allegiance",
    },
    {
      name: "Ally",
      parameters: "",
      description:
        "This action changes the active creature's allegiance to ALLY (i.e. a green selection circle).",
      section: "Allegiance",
    },
    {
      name: "ChangeEnemyAlly",
      parameters: "O:Object*,I:Value*Ea",
      description:
        "This action changes the EA status of the target creature to the specified value. Values are from ea.ids.",
      section: "Allegiance",
    },
    {
      name: "MoveToObject",
      parameters: "O:Target*",
      description:
        "This action instructs the active creature to move to the specified object. The action does not update the current position of the actor, saved in ARE files.",
      section: "Movement",
    },
    {
      name: "MoveToObjectNoInterrupt",
      parameters: "O:Target*",
      description:
        "This action instructs the active creature to move to the specified object. The action does not update the current position of the actor, saved in ARE files. Conditions are not checked until the destination point is reached.",
      section: "Movement",
    },
    {
      name: "MoveToObjectFollow",
      parameters: "O:Object*",
      description:
        "This action instructs the active creature to move to the specified object. Once the active creature reaches the object, it will follow the target if it moves. This behaviour continues until a different action is issued or until the target creature travels between areas.",
      section: "Movement",
    },
    {
      name: "MoveToSavedLocation",
      parameters: "S:GLOBAL*,S:Area*",
      description:
        "This action instructs the active creature to move to the previously saved specified location.",
      section: "Movement",
    },
    {
      name: "MoveToSavedLocationn",
      parameters: "S:GLOBAL*,S:Area*",
      description:
        "This action instructs the active creature to move to the previously saved specified location.",
      section: "Movement",
    },
    {
      name: "RunAwayFrom",
      parameters: "O:Creature*,I:Time*",
      description:
        "This action causes the active creature to run away from the specified creature, for the specified time. The time parameter is measured in AI updates, which default to 15 updates per second. Occasionally, fleeing creatures stop to attack another creature.",
      section: "Movement",
    },
    {
      name: "RunAwayFromNoInterruptNoLeaveArea",
      parameters: "O:Creature*,I:Time*",
      description:
        "This action causes the active creature to run away from the specified creature, for the specified time. The time parameter is measured in AI updates, which default to 15 updates per second.",
      section: "Movement",
    },
    {
      name: "RunAwayFromNoLeaveArea",
      parameters: "O:Creature*,I:Time*",
      description:
        "This action causes the active creature to run away from the specified creature, for the specified time, without leaving the current area.",
      section: "Movement",
    },
    {
      name: "RunAwayFromNoInterrupt",
      parameters: "O:Creature*,I:Time*",
      description:
        "This action causes the active creature to run away from the specified creature, for the specified time. The time parameter is measured in AI updates, which default to 15 updates per second. Occasionally, fleeing creatures stop to attack another creature. Conditions are not checked until the time has expired.",
      section: "Movement",
    },
    {
      name: "RandomWalk",
      parameters: "",
      description:
        "This action causes the active creature to walk randomly, staying within the current area. This action will never stop, (unless interrupted in specific situations), and thus never leave the action list.",
      section: "Walk",
    },
    {
      name: "RandomWalkTime",
      parameters: "I:Time*",
      description:
        "It is the same as RandomWalk(), where the time parameter represents a limit on how many times the action will result in walking. Turning or waiting does not count against this limit. Since it is random, there is no guarantee movement will be immediate.",
      section: "Walk",
    },
    {
      name: "RandomWalkContinuousTime",
      parameters: "I:Time*",
      description:
        "It is the same as RandomWalkContinuous(), where the time parameter represents how many times the action will be ticked before terminating (Actions are normally ticked once per second at 30FPS). See RandomWalkTime() for further details about the time parameter.",
      section: "Walk",
    },
    {
      name: "RandomWalkContinuous",
      parameters: "",
      description:
        "This action causes the active creature to walk randomly, without pausing. Note: It is the same as RandomWalk(), just with the offscreen-wait removed and no RandomTurn() chance.",
      section: "Walk",
    },
    {
      name: "SetGlobal",
      parameters: "S:Name*,S:Area*,I:Value*",
      description:
        "This action sets a variable (specified by name) in the scope (specified by area) to the value (specified by value). See the variable type appendix for details on variables.",
      section: "Variable",
    },
    {
      name: "AddGlobals",
      parameters: "S:Name*,S:Name2*",
      description:
        "This action will add the variable specified by parameter 2 onto the variable specified by parameter 1. It only works for variables in the “GLOBAL” scope. An example script is below.",
      section: "Variable",
    },
    {
      name: "IncrementGlobal",
      parameters: "S:Name*,S:Area*,I:Value*",
      description:
        "This action alters the specified variable, in the specified scope, by the amount indicated. The amount can be positive or negative.",
      section: "Variable",
    },
    {
      name: "StartTimer",
      parameters: "I:ID*,I:Time*",
      description:
        "This action starts a timer local to the active creature. The timer is measured in seconds, and the timer value is not saved in save games. The timer is checked with the TimerExpired trigger.",
      section: "Timer",
    },
    {
      name: "SetGlobalTimer",
      parameters: "S:Name*,S:Area*,I:Time*Gtimes",
      description:
        "This action sets a global timer. The timer is checked by the GlobalTimerExpired trigger or GlobalTimerNotExpired trigger.",
      section: "Timer",
    },
    {
      name: "Spell",
      parameters: "O:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the target object. The spell must currently be memorised by the caster, and may be interrupted while being cast. The caster must meet the level requirements of the spell. For the RES version of the action, the spell name can not consist of only numbers, should be written in upper case and should be no more than 7 characters long.",
      section: "Spell",
    },
    {
      name: "SpellRES",
      parameters: "S:RES*,O:Target*",
      description: "See Spell.",
      section: "Spell",
    },
    {
      name: "SpellNoDec",
      parameters: "O:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the target object. The spell must currently be memorised by the caster, and may be interrupted while being cast. The caster must meet the level requirements of the spell. For the RES version of the action, the spell name can not consist of only numbers, should be written in upper case and should be no more than 7 characters long.",
      section: "Spell",
    },
    {
      name: "SpellNoDecRES",
      parameters: "S:RES*,O:Target*",
      description: "See Spell.",
      section: "Spell",
    },
    {
      name: "SpellPoint",
      parameters: "P:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the specified point ([x.y]). The spell must currently be memorised by the caster, and may be interrupted while being cast. The caster must meet the level requirements of the spell. For the RES version of the action, the spell name can not consist of only numbers, should be written in upper case and should be no more than 7 characters long.",
      section: "Spell",
    },
    {
      name: "SpellPointRES",
      parameters: "S:RES*,P:Target*",
      description: "See SpellPoint.",
      section: "Spell",
    },
    {
      name: "ForceSpell",
      parameters: "O:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the target object. The spell need not currently be memorised by the caster, and will not be interrupted while being cast. The caster must meet the level requirements of the spell. For the RES version of the action, the spell name can not consist of only numbers, should be written in upper case and should be no more than 7 characters long.",
      section: "Spell",
    },
    {
      name: "ForceSpellRES",
      parameters: "S:RES*,O:Target*",
      description: "See ForceSpell.",
      section: "Spell",
    },
    {
      name: "ForceSpellPoint",
      parameters: "P:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the specified point ([x.y]). The spell need not currently be memorised by the caster, and will not be interrupted while being cast. The caster must meet the level requirements of the spell. For the RES version of the action, the spell name can not consist of only numbers, should be written in upper case and should be no more than 7 characters long.",
      section: "Spell",
    },
    {
      name: "ForceSpellPointRES",
      parameters: "S:RES*,P:Target*",
      description: "See ForceSpellPoint.",
      section: "Spell",
    },
    {
      name: "ForceSpellRange",
      parameters: "O:Target*,I:Spell*Spell",
      description:
        "It is likely that it will force the specified spell if the target is within range of the spell.",
      section: "Spell",
    },
    {
      name: "ForceSpellRangeRES",
      parameters: "S:RES*,O:Target*",
      description: "See ForceSpellRange.",
      section: "Spell",
    },
    {
      name: "ForceSpellPointRange",
      parameters: "P:Target*,I:Spell*Spell",
      description:
        "It is likely that it will force the specified spell if the point is within range of the spell.",
      section: "Spell",
    },
    {
      name: "ForceSpellPointRangeRES",
      parameters: "S:RES*,P:Target*",
      description: "See ForceSpellPointRange.",
      section: "Spell",
    },
    {
      name: "SpellNoDec",
      parameters: "O:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the target object. The spell need not be currently be memorised by the caster, and may be interrupted while being cast. The caster must meet the level requirements of the spell. The spell will not be removed from the casters memory after casting. For the RES version of the action, the spell name can not consist of only numbers, should be written in upper case and should be no more than 7 characters long.",
      section: "Spell",
    },
    {
      name: "SpellNoDecRES",
      parameters: "S:RES*,O:Target*",
      description: "See SpellNoDec.",
      section: "Spell",
    },
    {
      name: "SpellPointNoDec",
      parameters: "P:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the specified point ([x.y]). The spell must currently be memorised by the caster, and may be interrupted while being cast. The caster must meet the level requirements of the spell. The spell will be removed from the casters memory. For the RES version of the action, the spell name can not consist of only numbers, should be written in upper case and should be no more than 7 characters long. ",
      section: "Spell",
    },
    {
      name: "SpellPointNoDecRES",
      parameters: "S:RES*,P:Target*",
      description: "See SpellPointNoDec.",
      section: "Spell",
    },
    {
      name: "ReallyForceSpellPoint",
      parameters: "P:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the target point. The spell need not currently be memorised by the caster, and will not be interrupted while being cast. The spell is cast instantly (i.e. with a casting time of 0). The caster must meet the level requirements of the spell. For the RES version of the action, the spell name can not consist of only numbers, should be written in upper case and should be no more than 7 characters long.",
      section: "Spell",
    },
    {
      name: "ReallyForceSpellPointRES",
      parameters: "S:RES*,P:Target*",
      description: "See ReallyForceSpellPoint.",
      section: "Spell",
    },
    {
      name: "ReallyForceSpell",
      parameters: "O:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the target object. The spell need not currently be memorised by the caster, and will not be interrupted while being cast. The spell is cast instantly (i.e. with a casting time of 0). The caster must meet the level requirements of the spell. This action does not work in the script round where the active creature has died.",
      section: "Spell",
    },
    {
      name: "ReallyForceSpellRES",
      parameters: "S:RES*,O:Target*",
      description: "See ReallyForceSpell.",
      section: "Spell",
    },
    {
      name: "ApplySpell",
      parameters: "O:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the target object. The spell is applied instantly, no casting animation is played. The spell cannot be interrupted. For the RES version of the action, the spell name can not consist of only numbers, should be written in upper case and should be no more than 7 characters long. Both actions apply the spell at the lowest casting level (they will even use a level 0 ability if the spell has one, which other actions cannot do) and ignore its projectile (i.e. they use projectile #1|None) - the casting level of the originating creature is ignored. Note that for normal spellcasting the probability dice values for effects are rolled for each spell, whereas spells applied in the same scripting block by ApplySpell use a single dice value.",
      section: "Spell",
    },
    {
      name: "ApplySpellRES",
      parameters: "S:RES*,O:Target*",
      description: "See ApplySpell.",
      section: "Spell",
    },
    {
      name: "RemoveSpell",
      parameters: "I:Spell*Spell",
      description:
        "This action removes one memorised indtance of the specified spell from the spellbook of the active creature. The spell can be an innate ability, a priest spell or a wizard spell, but must be listed in spell.ids.",
      section: "Spell",
    },
    {
      name: "RemoveSpellRES",
      parameters: "S:RES*",
      description: "See RemoveSpell.",
      section: "Spell",
    },
    {
      name: "ReallyForceSpellDead",
      parameters: "O:Target*,I:Spell*Spell",
      description:
        "This action causes the active creature to cast the specified spell at the target object. The spell need not currently be memorised by the caster, and will not be interrupted while being cast. The spell is cast instantly (i.e. with a casting time of 0). The caster must meet the level requirements of the spell. For the RES version of the action, the spell name can not consist of only numbers, should be written in upper case and should be no more than 7 characters long. This action works in the script round where the active creature has died.",
      section: "Spell",
    },
    {
      name: "ReallyForceSpellDeadRES",
      parameters: "S:RES*,O:Target*",
      description: "See ReallyForceSpellDead.",
      section: "Spell",
    },
    {
      name: "EquipItem",
      parameters: "S:Object*",
      description: "This action instructs the active creature to equip the specified item.",
      section: "Item",
    },
    {
      name: "UseItem",
      parameters: "S:Object*,O:Target*",
      description:
        "This action instructs the active creature to use the specified item (object) on the specified target (target). The ability number (i.e. extended header index) to use may be specified. This action is most often used to allow use of potions and wands. The item to be used must exist in the active creature's inventory (not in a container within the inventory) - though it need not be equipped.",
      section: "Item",
    },
    {
      name: "SelectWeaponAbility",
      parameters: "I:WeaponNum*Slots,I:AbilityNum*",
      description:
        "This action instructs the active creature to select the specified slot, and use the ability in the extended header specified by the ability parameter.",
      section: "Item",
    },
    {
      name: "EquipMostDamagingMelee",
      parameters: "",
      description:
        "This action instructs the active creature to equip the most damaging melee weapon from those available in the quickslots. Damage is calculated on the THAC0 bonus and damage - special bonuses versus creature types and elemental damages are not checked.",
      section: "Item",
    },
    {
      name: "EquipRanged",
      parameters: "",
      description:
        "This action instructs the active creature to a ranged weapon from the weapons available in the quickslots.",
      section: "Item",
    },
    {
      name: "GiveOrder",
      parameters: "O:Object*,I:Order*",
      description:
        "This action is used in conjunction with the ReceivedOrder trigger, and works in a similar way to a global shout. The action passes a numeric order to the specified creature. Only one creature at a time responds to an order, and creatures to not detect their own orders.",
      section: "Misc",
    },
    {
      name: "Help",
      parameters: "",
      description:
        "This action acts similar to shout, but does not accept values. The range of the Help action is slightly larger than the default visual radius of NPCs.",
      section: "Misc",
    },
    {
      name: "Hide",
      parameters: "",
      description:
        "This action instructs the active creature to attempt to Hide in Shadows. This action can be used for any creature (not just thieves) though success in hiding is dependent on points in the Stealth skill. A hidden creature is treated as STATE_INVISIBLE.",
      section: "Misc",
    },
    {
      name: "Panic",
      parameters: "",
      description: "This action causes the active creature to move randomly around the screen.",
      section: "Misc",
    },
    {
      name: "Turn",
      parameters: "",
      description:
        "This action turns any undead creatures within range of the active creature. This action can be used for any creature (not just paladins/clerics) though success in turning is dependent on the Turn Undead level of the creature, which is only calculated for paladins and clerics. The chance to successfully turn undead is based on creatures level and class. Paladins turn at 2 levels less than clerics of the same level. An undead creature will be destroyed/controlled if its level is more than 7 levels below the active creatures turn undead level. An undead creature may be turned (i.e. forced to flee) is its level is equal to, or up to 4 levels below, the active creatures turn undead level.",
      section: "Misc",
    },
    {
      name: "Rest",
      parameters: "",
      description:
        "This action applies the benefits of resting (i.e. healing, restoring spells and restoring abilities) to the active creature. The action does not play the rest movie or advance game time. ",
      section: "Misc",
    },
    {
      name: "Shout",
      parameters: "I:ID*Shoutids",
      description:
        "This action is used to shout the specified number. The action is used in conjunction with the Heard trigger. A silenced creature cannot shout. Shout can be Heard() throughout the current area.",
      section: "Misc",
    },
    {
      name: "DestroySelf",
      parameters: "",
      description:
        "This action removes the active creature from the game. No death variable is set. Global creatures like joinable NPCs, familiars and recipients of MakeGlobal are still accessible by script name and are not fully removed. ",
      section: "Misc",
    },
    {
      name: "Kill",
      parameters: "O:Object*",
      description:
        "This action causes the target creature to die, dropping any droppable items they are carrying.",
      section: "Misc",
    },
    {
      name: "DisplayString",
      parameters: "O:Object*,I:StrRef*",
      description:
        "This action displays the strref specified by the StrRef parameter in the message window, attributing the text to the specified object.",
      section: "Misc",
    },
    {
      name: "ChangeClass",
      parameters: "O:Object*,I:Value*Class",
      description:
        "This action changes the class of the target creature to the specified value. Values are from class.ids.",
      section: "Misc",
    },
    {
      name: "ChangeAnimation",
      parameters: "S:ResRef*",
      description:
        "This action will change the animation of the active creature to match that of the specified CRE file. If the active creature is in the party, the action will create the specified creature.",
      section: "Misc",
    },
    {
      name: "GlobalShout",
      parameters: "I:ID*",
      description: "This action acts like Shout() without the range limit.",
      section: "Misc",
    },
    {
      name: "Calm",
      parameters: "O:Object*",
      description:
        "This action removes the berserking state and effect by applying the Cure:Berserk opcode.",
      section: "Misc",
    },
    {
      name: "DisplayStringHead",
      parameters: "O:Object*,I:StrRef*",
      description:
        "This action displays the specified string over the head on the specified object (on the game-screen). The string may also be shown in the message log, depending on options specified in baldur.ini.",
      section: "Misc",
    },
    {
      name: "AddKit",
      parameters: "I:Kit*Kit",
      description:
        "This action removes the active creature's current kit and adds the specified kit. Abilities from any previous kit are removed. AddKit(0) can be used to remove a creatures current kit without adding a new one. Class restrictions apply for kits. When attempting adding an invalid kit, the existing kit (if any) will be replied.",
      section: "Misc",
    },
    {
      name: "ApplyDamage",
      parameters: "O:Object*,I:Amount*,I:Type*Dmgtype",
      description:
        "This action inflicts the specified amount of damage (of the specified type) on the target creature.",
      section: "Misc",
    },
    {
      name: "ApplyDamagePercent",
      parameters: "O:Object*,I:Amount*,I:Type*Dmgtype",
      description:
        "This action applies a percentage damage (of the specified damage type) to the target object.",
      section: "Misc",
    },
    {
      name: "NoAction",
      parameters: "",
      description:
        "This action can be used to do nothing - many characters walk around randomly or stand in one place doing nothing",
      section: "Misc",
    },
    {
      name: "ClearActions",
      parameters: "O:Object*",
      description:
        "This action clears the action list of the specified object (including ModalActions). ",
      section: "Misc",
    },
    {
      name: "Continue",
      parameters: "",
      description:
        "This action instructs the script parser to continue looking for actions in the active creatures action list. This is mainly included in scripts for efficiency. Continue should also be appended to any script blocks added to the top of existing scripts, to ensure correct functioning of any blocks which include the OnCreation trigger. Continue may prevent actions being completed until the script parser has finished its execution cycle. Continue() must be the last command in an action list to function correctly. Use of continue in a script block will cause the parser to treater subsequent empty response blocks as though they contained a Continue() command - this parsing can be stopped by including a NoAction() in the empty response block.",
      section: "Misc",
    },
    {
      name: "Wait",
      parameters: "I:Time*",
      description:
        "This action causes a delay in script processing. The time is measured in seconds.",
      section: "Misc",
    },
    {
      name: "SmallWait",
      parameters: "I:Time*",
      description:
        "This action is similar to Wait(), it causes a delay in script processing. The time is measured in AI updates (which default to 15 per second)",
      section: "Misc",
    },
    {
      name: "SetInterrupt",
      parameters: "I:State*Boolean",
      description:
        "This action sets whether a creature can be interrupted while carrying out script actions.",
      section: "Misc",
    },
    {
      name: "CreateCreatureOffScreen",
      parameters: "S:ResRef*,I:Face*Dir",
      description:
        "This action creates the specified creature just offscreen from the active creature.",
      section: "Misc",
    },
    {
      name: "CreateCreatureObject",
      parameters: "S:ResRef*,O:Object*",
      description: "This action will create the specified creature next to the specified object.",
      section: "Misc",
    },
    {
      name: "CreateCreatureObjectEffect",
      parameters: "S:ResRef*,S:Effect*,O:Object*",
      description:
        "This action will create the specified creature with specified effect next to the specified object.",
      section: "Misc",
    },
    {
      name: "FaceObject",
      parameters: "O:Object*",
      description: "This action instructs the active creature to face the target object.",
      section: "Misc",
    },
    {
      name: "StartDialogueNoSet",
      parameters: "O:Object*",
      description:
        "This action instructs the active creature to initiate dialog with the target object, using its currently assigned dialog file. This action can be used from a distance and will work whether the target creature is in sight or not. Dialog will not be initiated if the creature using this action has been assigned a dialog that has all top level conditions returning false. If the target is invalid, the active creature will initiate dialog with Player1.",
      section: "Misc",
    },
    {
      name: "ActionOverride",
      parameters: "O:Actor*,I:Action*",
      description:
        "This action can be used to control another creature. A creature referenced as the result of SetTokenObject() is not a valid target for the ActionOverride() action.",
      section: "Misc",
    },
    {
      name: "JumpToPoint",
      parameters: "P:Target*",
      description: "This action instantly moves the active creature to the specified point.",
      section: "Misc",
    },
    {
      name: "CreateCreatureOffscreen",
      parameters: "S:ResRef*,I:Face*Dir",
      description:
        "This action creates the specified creature just offscreen from the active creature.",
      section: "Misc",
    },
    {
      name: "RandomTurn",
      parameters: "",
      description: "This action causes the active creature to turn in a random direction.",
      section: "Misc",
    },
    {
      name: "OpenDoor",
      parameters: "O:Object*",
      description:
        "This action will open the specified door. If the door is locked the creature must possess the correct key. Some doors central to the plot doors cannot be opened. The active creature can stick on this action if it fails.",
      section: "Misc",
    },
    {
      name: "StartCutSceneMode",
      parameters: "",
      description:
        "This action starts a cutscene. Player control is removed, and scripts stop running. Note that actions already in the action list are not cleared without an explicit call to ClearAllActions.",
      section: "Misc",
    },
    {
      name: "StartCutScene",
      parameters: "S:CutScene*",
      description:
        "This action starts a cutscene; a cinematic sequence that removes the GUI and player control. The cutscene parameter is the script name to run. The second variant can enable condition checking (trigger evaluation, off by default) when the second parameter is set to TRUE.",
      section: "Misc",
    },
  ];
  /* eslint-enable sonarjs/no-duplicate-string */
}
