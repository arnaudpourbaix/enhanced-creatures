import { GLOBAL_CONFIG } from "../../../config/generate";
import { POTIONS } from "../../../config/potion";
import { getAllSpells, SpellReference } from "../../../config/spells/spell-names";
import { TARGET_STATUS } from "../../../config/target-config";
import { TargetListName, TargetStatusName } from "../../../config/target-name";
import actionFactory from "../../factories/action.factory";
import bafFactory from "../../factories/baf.factory";
import responseFactory from "../../factories/response.factory";
import triggerFactory from "../../factories/trigger.factory";
import { ScriptTarget } from "../../model/constants";
import { CreatureAbility } from "../../model/creature/ability";
import { Creature } from "../../model/creature/creature";
import { WEAPON_SLOTS } from "../../model/creature/item";
import { Durations } from "../../model/game-data/durations";
import { AllegianceIdentifier } from "../../model/ids/allegiance";
import { BuilderOptions } from "../../model/misc";
import { Actions } from "../../model/script/actions";
import { CustomCodeLocation, Statements } from "../../model/script/script";
import { TargetList } from "../../model/script/target";
import { Triggers } from "../../model/script/triggers";
import translationService from "../translation.service";
import utils from "../utils/utils.service";
import targetService from "./target.service";

// Shared shape for every handler dispatched through execute() below. Each handler destructures
// only the fields it uses (via Pick<HandlerParams, ...>) instead of taking 3 positional
// parameters - unused fields are simply omitted from the destructure, with no _prefix or
// disable comment needed, and no risk of values shifting into the wrong slot the way dropping a
// middle positional parameter would.
export interface HandlerParams {
  statements: Statements;
  creature: Creature;
  options: BuilderOptions;
}

class StatementBuilderService {
  buildStatements(creature: Creature, options: BuilderOptions): Statements {
    const statements: Statements = [];
    const p: HandlerParams = { statements, creature, options };
    // .bind(this) on each handler: execute() re-binds via fn.apply(this, ...) internally, so this
    // is a no-op at runtime, but satisfies unbound-method - a bare `this.foo` method reference is
    // otherwise indistinguishable, to the type checker, from one that will be called detached.
    this.execute(this.destroyUponDeath.bind(this), "destroyUponDeath", p);
    this.execute(this.dialog.bind(this), "dialog", p);
    this.execute(this.init.bind(this), "init", p);
    this.execute(this.rest.bind(this), "rest", p);
    this.execute(this.precastLongDurationSpells.bind(this), "precastLongDurationSpells", p);
    this.execute(this.turnHostile.bind(this), "turnHostile", p);
    this.execute(this.detectCombat.bind(this), "detectCombat", p);
    this.execute(this.shouts.bind(this), "shouts", p);
    this.execute(this.followSummoner.bind(this), "followSummoner", p);
    this.execute(this.randomWalkNoCombat.bind(this), "randomWalkNoCombat", p);
    this.execute(this.noActionOutsideOfCombat.bind(this), "noActionOutsideOfCombat", p);
    this.execute(this.handlePanic.bind(this), "handlePanic", p);
    this.execute(this.thievesAbilities.bind(this), "thievesAbilities", p);
    this.execute(this.precastMidDurationSpells.bind(this), "precastMidDurationSpells", p);
    this.execute(this.creatureAbilities.bind(this), "creatureAbilities", p);
    this.execute(this.potions.bind(this), "potions", p);
    this.execute(this.attack.bind(this), "attack", p);
    this.execute(this.trackTargets.bind(this), "trackTargets", p);
    this.execute(this.randomWalkCombat.bind(this), "randomWalkCombat", p);
    return statements;
  }

  private execute(fn: (p: HandlerParams) => void, location: CustomCodeLocation, p: HandlerParams) {
    const { statements, creature, options } = p;
    const custom = creature.behavior.customCodes.find((c) => c.location === location);
    // statements/abilities are required by CustomCode, and always filled in by
    // abilityService.getCustomCodes() in the real config-loading path - but defended anyway,
    // see statement-builder.service.test.ts's "defaults ... when omitted" tests, which call
    // execute() directly with a custom code that skips that normalization.
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    if (custom?.type === "insertBefore") {
      this.processStatements(statements, custom.statements ?? []);
      this.parseAbilities(statements, creature, options, custom.abilities ?? []);
    }
    if (custom?.type !== "replace") {
      fn(p);
    } else {
      this.parseAbilities(statements, creature, options, custom.abilities ?? []);
    }
    if (custom?.type === "insertAfter") {
      this.processStatements(statements, custom.statements ?? []);
      this.parseAbilities(statements, creature, options, custom.abilities ?? []);
    }
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */
  }

  private processStatements(statements: Statements, newStatements: Statements) {
    for (const statement of newStatements) {
      if (!statement.target) {
        const tokens = [{ key: ScriptTarget.token, value: ScriptTarget.myself }];
        statements.push({
          ...statement,
          triggers: utils.replaceTriggerTokens(statement.triggers, tokens),
          responses: utils.replaceResponseTokens(statement.responses, tokens),
        });
      } else {
        const { triggers, targetTriggers } = targetService.getTriggersFromTargetList(
          statement.target,
        );
        const list = targetService.getTargetFromAbility(
          statement.target.name,
          statement.target.limit,
          statement.target.randomOrder,
        );
        if (list.allegianceCheck) {
          triggers.push({
            name: "Allegiance",
            params: [ScriptTarget.myself, "ENEMY"],
          });
        }
        bafFactory.addStatementsFromTargetList({
          statements,
          comment: statement.comment,
          triggers: [...statement.triggers, ...triggers, ...targetTriggers],
          responses: statement.responses,
          targets: list.targets as string[],
          reverse: statement.target.reverse,
        });
      }
    }
  }

  private dialog({ statements, creature }: Pick<HandlerParams, "statements" | "creature">): void {
    if (!creature.behavior.dialog.length) return;
    const nameTriggers: Triggers.Trigger[] = [];
    for (const name of creature.behavior.dialog) {
      nameTriggers.push({
        name: "Name",
        params: [name, ScriptTarget.myself],
      });
    }
    const finalNameTrigger: Triggers.Trigger =
      nameTriggers.length == 1 ? nameTriggers[0] : { name: "Or", triggers: nameTriggers };
    statements.push({
      comment: "Initiate dialog",
      triggers: [
        triggerFactory.global(GLOBAL_CONFIG.bafConstants.dialog, 0),
        finalNameTrigger,
        { name: "NumTimesTalkedTo", params: [0] },
        { name: "See", params: ["PC"] },
      ],
      responses: responseFactory.response([
        actionFactory.setGlobal(GLOBAL_CONFIG.bafConstants.dialog, 1),
        { name: "FaceObject", params: ["PC"] },
        { name: "StartDialogueNoSet", params: ["PC"] },
      ]),
    });
  }

  private handlePanic({
    statements,
    creature,
  }: Pick<HandlerParams, "statements" | "creature">): void {
    if (utils.hasImmunity(creature.data.immunities, "fear")) return;
    statements.push({
      comment: "Handle Panic state",
      triggers: [
        {
          name: "StateCheck",
          params: [ScriptTarget.myself, "STATE_PANIC"],
        },
        {
          name: "Range",
          params: ["NearestEnemyOf", 10],
        },
      ],
      responses: responseFactory.response([
        { name: "RunAwayFromNoLeaveArea", params: ["NearestEnemyOf", 15] },
      ]),
    });
    statements.push({
      triggers: [
        {
          name: "StateCheck",
          params: [ScriptTarget.myself, "STATE_PANIC"],
        },
      ],
      responses: responseFactory.response([{ name: "RandomWalkContinuous" }]),
    });
  }

  private destroyUponDeath({
    statements,
    options,
  }: Pick<HandlerParams, "statements" | "options">): void {
    if (!options.summon) return;
    statements.push({
      comment: "Summons are destroyed on death",
      triggers: [{ name: "Die" }],
      responses: responseFactory.response([{ name: "DestroySelf" }]),
    });
  }

  private init({ statements, options }: Pick<HandlerParams, "statements" | "options">): void {
    if (options.summon) return;
    const actions: Actions.Action[] = [
      actionFactory.setGlobal(GLOBAL_CONFIG.bafConstants.combatStarted, 0),
      actionFactory.setGlobal(GLOBAL_CONFIG.bafConstants.precastLongDurationSpells, 0),
      actionFactory.setGlobal(GLOBAL_CONFIG.bafConstants.precastMidDurationSpells, 0),
      // actionFactory.setGlobal(
      //   GLOBAL_CONFIG.bafConstants.disableSpellcasting,
      //   0,
      // ),
      actionFactory.setGlobalTimer(GLOBAL_CONFIG.bafConstants.restTimer, Durations.eightHours),
      actionFactory.setGlobal(GLOBAL_CONFIG.bafConstants.initGlobal, 1),
    ];
    statements.push({
      comment: "Init",
      triggers: [triggerFactory.global(GLOBAL_CONFIG.bafConstants.initGlobal, 0)],
      responses: responseFactory.response(actions),
    });
  }

  private rest({ statements, creature, options }: HandlerParams): void {
    if (options.summon) return;
    const actions: Actions.Action[] = [
      actionFactory.setGlobal(GLOBAL_CONFIG.bafConstants.initGlobal, 0),
      { name: "Rest" },
    ];
    if (creature.behavior.restHeal)
      actions.push({
        name: "ApplySpell",
        params: [ScriptTarget.myself, "RESTORE_FULL_HEALTH"],
      });
    statements.push({
      comment: "Rest (reset everything and heal if applicable)",
      triggers: [
        triggerFactory.global(GLOBAL_CONFIG.bafConstants.initGlobal, 1),
        triggerFactory.globalTimerReallyExpired(GLOBAL_CONFIG.bafConstants.restTimer),
        {
          name: "See",
          params: ["GOODCUTOFF"],
          negation: true,
        },
      ],
      responses: responseFactory.response(actions),
    });
  }

  private turnHostile({ statements, creature, options }: HandlerParams): void {
    if (options.summon) return;
    const actions: Actions.Action[] = [{ name: "Enemy" }];
    statements.push({
      comment: "Turn hostile if attacked",
      triggers: [
        {
          name: "Allegiance",
          params: [ScriptTarget.myself, "NEUTRAL"],
        },
        {
          name: "Or",
          triggers: [
            {
              name: "AttackedBy",
              params: ["GOODCUTOFF", "DEFAULT"],
            },
            {
              name: "SpellCastOnMe",
              params: ["GOODCUTOFF", 0],
            },
            {
              name: "TookDamage",
            },
            {
              name: "Heard",
              params: [
                `EVILCUTOFF.0.${creature.data.race}`,
                GLOBAL_CONFIG.bafConstants.monsterShoutId,
              ],
            },
          ],
        },
      ],
      responses: responseFactory.response(actions),
    });
  }

  private detectCombat({ statements }: Pick<HandlerParams, "statements">): void {
    const actions: Actions.Action[] = [
      actionFactory.setGlobal(GLOBAL_CONFIG.bafConstants.combatStarted, 1),
    ];
    const allegiances: {
      myself: AllegianceIdentifier;
      enemy: AllegianceIdentifier;
    }[] = [
      {
        myself: "EVILCUTOFF",
        enemy: "GOODCUTOFF",
      },
      {
        myself: "GOODCUTOFF",
        enemy: "EVILCUTOFF",
      },
    ];
    for (const ea of allegiances) {
      statements.push({
        comment: "Detect combat",
        triggers: [
          triggerFactory.global(GLOBAL_CONFIG.bafConstants.combatStarted, 0),
          {
            name: "Allegiance",
            params: [ScriptTarget.myself, ea.myself],
          },
          { name: "See", params: [ea.enemy] },
        ],
        responses: responseFactory.response(actions),
      });
    }
  }

  private shouts({ statements, creature, options }: HandlerParams): void {
    if (!creature.behavior.help) return;
    const shoutId = options.summon
      ? GLOBAL_CONFIG.bafConstants.summonerShoutId
      : GLOBAL_CONFIG.bafConstants.monsterShoutId;
    statements.push({
      comment: "Shouts every 3 rounds",
      triggers: [
        triggerFactory.global(GLOBAL_CONFIG.bafConstants.combatStarted, 1),
        triggerFactory.globalTimerExpired(GLOBAL_CONFIG.bafConstants.helpTimer),
      ],
      responses: responseFactory.response([
        {
          name: "Shout",
          params: [shoutId],
        },
        actionFactory.setGlobalTimer(GLOBAL_CONFIG.bafConstants.helpTimer, 18),
      ]),
    });
    const heardObject = options.summon ? "LastSummonerOf" : `EVILCUTOFF.0.${creature.data.race}`;
    statements.push({
      comment: "React to shouts",
      triggers: [
        triggerFactory.global(GLOBAL_CONFIG.bafConstants.combatStarted, 0),
        { name: "Heard", params: [heardObject, shoutId] },
        { name: "InMyArea", params: [heardObject] },
      ],
      responses: responseFactory.response([
        actionFactory.setGlobal(GLOBAL_CONFIG.bafConstants.combatStarted, 1),
        { name: "MoveToObject", params: ["LastHeardBy"] },
      ]),
    });
    statements.push({
      triggers: [
        triggerFactory.global(GLOBAL_CONFIG.bafConstants.combatStarted, 1),
        { name: "Heard", params: [heardObject, shoutId] },
        { name: "InMyArea", params: [heardObject] },
        { name: "See", params: ["GOODCUTOFF"], negation: true },
      ],
      responses: responseFactory.response([{ name: "MoveToObject", params: ["LastHeardBy"] }]),
    });
  }

  private noActionOutsideOfCombat({
    statements,
    options,
  }: Pick<HandlerParams, "statements" | "options">): void {
    const responses = responseFactory.response([{ name: "NoAction" }]);
    let triggers: Triggers.Trigger[] = [
      {
        name: "Or",
        triggers: [
          triggerFactory.global(GLOBAL_CONFIG.bafConstants.combatStarted, 0),
          {
            name: "Allegiance",
            params: [ScriptTarget.myself, "EVILCUTOFF"],
            negation: true,
          },
          {
            name: "StateCheck",
            params: [ScriptTarget.myself, "STATE_IMMOBILE"],
          },
          {
            name: "StateCheck",
            params: [ScriptTarget.myself, "STATE_REALLY_DEAD"],
          },
        ],
      },
    ];
    if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
    statements.push({
      comment: "Do nothing if...",
      triggers,
      responses,
    });
    triggers = [
      { name: "InActiveArea", params: [ScriptTarget.myself], negation: true },
      { name: "Range", params: ["NearestEnemyOf", 30], negation: true },
    ];
    if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
    statements.push({
      triggers,
      responses,
    });
  }

  private followSummoner({
    statements,
    options,
  }: Pick<HandlerParams, "statements" | "options">): void {
    if (!options.summon) return;
    const triggers: Triggers.Trigger[] = [
      triggerFactory.global(GLOBAL_CONFIG.bafConstants.combatStarted, 0),
      {
        name: "StateCheck",
        params: [ScriptTarget.myself, "STATE_BLIND"],
        negation: true,
      },
      { name: "ActionListEmpty" },
      {
        name: "See",
        params: ["NearestEnemyOf"],
        negation: true,
      },
      {
        name: "See",
        params: ["LastSummonerOf"],
        negation: true,
      },
      { name: "HPGT", params: ["LastSummonerOf", 0] },
      {
        name: "Range",
        params: ["LastSummonerOf", GLOBAL_CONFIG.bafConstants.trackingRange],
      },
    ];
    statements.push({
      triggers,
      comment: "Summon follow summoner",
      responses: responseFactory.response([{ name: "MoveToObject", params: ["LastSummonerOf"] }]),
    });
  }

  private trackTargets({ statements, creature, options }: HandlerParams): void {
    if (!creature.behavior.tracking) return;
    const additionals = this.getAdditionals(creature, "trackTargets");
    const allegiance: Triggers.Trigger = {
      name: "Allegiance",
      params: [ScriptTarget.myself, "GOODCUTOFF"],
      negation: true,
    };
    const triggers: Triggers.Trigger[] = [
      {
        name: "StateCheck",
        params: [ScriptTarget.myself, "STATE_BLIND"],
        negation: true,
      },
      {
        name: "InMyArea",
        params: [ScriptTarget.token],
      },
      {
        name: "Range",
        params: [ScriptTarget.token, GLOBAL_CONFIG.bafConstants.trackingRange],
      },
      ...additionals.triggers,
    ];
    if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
    const actions: Actions.Action[] = [
      { name: "MoveToObject", params: [ScriptTarget.token] },
      ...additionals.actions,
    ];
    bafFactory.addStatementsFromTargetList({
      statements,
      comment: "Track players if allegiance is not GOODCUTOFF",
      triggers: [
        allegiance,
        ...triggers,
        ...triggerFactory.validTrackTarget({
          isTargetPlayer: true,
          seeInvisible: creature.seeInvisible(),
        }),
      ],
      responses: responseFactory.response(actions),
      targets: targetService.getList("Players").targets,
    });
    bafFactory.addStatementsFromTargetList({
      statements,
      comment: "Track last seen enemy if allegiance is GOODCUTOFF",
      triggers: [
        { ...allegiance, negation: false },
        ...triggers,
        ...triggerFactory.validTrackTarget({
          isTargetPlayer: false,
          seeInvisible: creature.seeInvisible(),
        }),
      ],
      responses: responseFactory.response(actions),
      targets: [ScriptTarget.lastSeen],
    });
    if (!!creature.data.intelligence && creature.data.intelligence > 10) {
      statements.push({
        comment: "Open door",
        triggers: [
          triggerFactory.global(GLOBAL_CONFIG.bafConstants.noOpenDoor, 0, "GLOBAL"),
          { name: "Allegiance", params: [ScriptTarget.myself, "EVILCUTOFF"] },
          { name: "AreaType", params: ["OUTDOOR"], negation: true },
          { name: "Range", params: ["NearestEnemyOf", 30], negation: true },
          { name: "Range", params: ["NearestDoor", 15] },
          { name: "OpenState", params: ["NearestDoor", "FALSE"] },
        ],
        responses: responseFactory.response([
          { name: "MoveToObject", params: ["NearestDoor"] },
          { name: "OpenDoor", params: ["NearestDoor"] },
        ]),
      });
    }
  }

  private randomWalkCombat({ statements, creature, options }: HandlerParams): void {
    if (!creature.behavior.combatWalk || options.summon) return;
    this.randomWalk(statements, true, options);
    this.avoidMeleeCombat(statements, creature, options);
  }

  private randomWalkNoCombat({ statements, creature, options }: HandlerParams): void {
    if (!creature.behavior.walk || options.summon) return;
    this.randomWalk(statements, false, options);
  }

  private randomWalk(statements: Statements, combat: boolean, _options: BuilderOptions): void {
    const triggers: Triggers.Trigger[] = [
      triggerFactory.global(GLOBAL_CONFIG.bafConstants.combatStarted, combat ? 1 : 0),
      { name: "ActionListEmpty" },
      {
        name: "See",
        params: ["GOODCUTOFF"],
        negation: true,
      },
    ];
    statements.push({
      triggers,
      comment: `Random walking (${combat ? "in combat" : "not in combat"}) `,
      responses: responseFactory.response([{ name: "RandomWalk" }, { name: "Wait", params: [2] }]),
    });
  }

  private thievesAbilities({
    statements,
    creature,
  }: Pick<HandlerParams, "statements" | "creature">): void {
    if (!creature.data.hideShadow) return;
    const hideTimer = "BD_HIDE";
    statements.push({
      comment: `Hide in shadow`,
      triggers: [
        {
          name: "Allegiance",
          params: [ScriptTarget.myself, "NEUTRAL"],
          negation: true,
        },
        {
          name: "Or",
          triggers: [
            { name: "Detect", params: ["NearestEnemyOf"], negation: true },
            { name: "Kit", params: [ScriptTarget.myself, "SHADOWDANCER"] },
          ],
        },
        {
          name: "StateCheck",
          params: [ScriptTarget.myself, "STATE_INVISIBLE"],
          negation: true,
        },
        {
          name: "StateCheck",
          params: [ScriptTarget.myself, "STATE_BLIND"],
          negation: true,
        },
        {
          name: "CheckStatGT",
          params: [ScriptTarget.myself, 49, "HIDEINSHADOWS"],
        },
        triggerFactory.globalTimerExpired(hideTimer),
      ],
      responses: responseFactory.response(
        actionFactory.disableInterrupt([
          actionFactory.setGlobalTimer(hideTimer, 6),
          { name: "DisplayStringHead", params: [ScriptTarget.myself, 66968] }, // *attempts to hide in shadows*
          { name: "Hide" },
        ]),
      ),
    });
  }

  private avoidMeleeCombat(statements: Statements, creature: Creature, _options: BuilderOptions) {
    if (creature.attack.melee || creature.attack.ranged) return;
    statements.push({
      comment: `Random facing`,
      triggers: [
        {
          name: "Range",
          params: ["NearestEnemyOf", 30],
          negation: true,
        },
      ],
      responses: responseFactory.response([{ name: "RandomTurn" }]),
    });
  }

  private runAway(statements: Statements, options: BuilderOptions): void {
    const triggers: Triggers.Trigger[] = [
      {
        name: "Range",
        params: ["NearestEnemyOf", 20],
      },
    ];
    if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
    statements.push({
      triggers,
      comment: `Run away from enemies`,
      responses: responseFactory.response([
        { name: "RunAwayFromNoLeaveArea", params: ["NearestEnemyOf", 45] },
      ]),
    });
  }

  private reposition(statements: Statements, options: BuilderOptions): void {
    const triggers: Triggers.Trigger[] = [
      { name: "CanEquipRanged" },
      {
        name: "Range",
        params: ["NearestEnemyOf", GLOBAL_CONFIG.bafConstants.meleeRange],
      },
    ];
    if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
    statements.push({
      triggers,
      comment: `Try to reposition to use ranged attack`,
      responses: [
        {
          weight: 50,
          actions: [
            actionFactory.disableInterrupt(),
            { name: "RunAwayFromNoLeaveArea", params: ["NearestEnemyOf", 45] },
            actionFactory.enableInterrupt(),
          ],
        },
        { weight: 50, actions: [{ name: "Continue" }] },
      ],
    });
  }

  private attack({ statements, creature, options }: HandlerParams): void {
    if (!creature.attack.melee && !creature.attack.ranged) {
      this.runAway(statements, options);
      return;
    } else if (creature.attack.ranged) this.reposition(statements, options);
    for (const targetPriority of creature.attack.targetPriorities) {
      for (const targetList of targetPriority.targets) {
        this.attackTargetWithStatuses(
          statements,
          creature,
          options,
          targetList,
          targetPriority.status,
        );
      }
    }
  }

  private attackTargetWithStatuses(
    statements: Statements,
    creature: Creature,
    options: BuilderOptions,
    targetListName: TargetListName,
    statusNameList: TargetStatusName[],
  ): void {
    for (const status of statusNameList) {
      const statusDetails = TARGET_STATUS.find((t) => t.status === status);
      const weaponAttackSlot =
        creature.attack.targetStatusWeaponSlot.find((t) => t.status.includes(status))?.slot ??
        creature.attack.defaultWeaponSlot;
      if (!statusDetails) throw new Error(`Target status details ${status} not found!`);
      if (statusDetails.targetTriggers.some((t) => "triggers" in t))
        throw new Error(`OR triggers not handled currently: ${status}`);
      if (statusDetails.canOnlyTargetPlayer && targetListName !== "Players")
        throw new Error(`Status ${status} must target party`);
      const list = targetService.getList(targetListName);
      const targetTriggers = [
        ...statusDetails.targetTriggers,
        ...triggerFactory.validAttackTarget({
          isTargetPlayer: statusDetails.canOnlyTargetPlayer,
          maxRange: creature.attack.maxRange,
        }),
      ];
      const triggers: Triggers.Trigger[] = [];
      if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
      // if (creature.canPolymorph) {
      //   const poly: Triggers.Trigger = {
      //     name: "CheckStat",
      //     params: [ScriptTarget.myself, 0, "POLYMORPHED"],
      //   };
      // }
      let selectWeaponStatements: Statements = [];
      if (creature.attack.selectWeapons.length) {
        selectWeaponStatements = this.selectWeaponStatements(creature, targetTriggers, options);
      } else if (creature.attack.melee && creature.attack.ranged) {
        selectWeaponStatements = this.selectWeaponMeleeRangeStatements(options);
      }
      const responses = responseFactory.attackResponses({
        attacks: creature.attack.actions,
        oncePerRound: false,
        weaponAttackSlot,
      });
      bafFactory.addOneBlockTargetList({
        statements,
        triggers,
        targetTriggers,
        responses,
        comment: `Attack ${statusDetails.status} enemy`,
        targets: list.targets,
        inBetweenStatements: selectWeaponStatements,
      });
    }
  }

  private selectWeaponMeleeRangeStatements(options: BuilderOptions): Statements {
    const statements: Statements = [];
    let triggers: Triggers.Trigger[] = [
      { name: "CanEquipRanged" },
      {
        name: "Range",
        params: [ScriptTarget.lastSeen, GLOBAL_CONFIG.bafConstants.meleeRange],
        negation: true,
      },
    ];
    if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
    statements.push({
      triggers,
      responses: responseFactory.response([{ name: "EquipRanged" }, { name: "Continue" }]),
    });
    triggers = [
      {
        name: "Range",
        params: [ScriptTarget.lastSeen, GLOBAL_CONFIG.bafConstants.meleeRange],
      },
    ];
    if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
    statements.push({
      triggers,
      responses: responseFactory.response([
        { name: "EquipMostDamagingMelee" },
        { name: "Continue" },
      ]),
    });
    return statements;
  }

  private selectWeaponStatements(
    creature: Creature,
    targetTriggers: Triggers.Trigger[],
    options: BuilderOptions,
  ): Statements {
    const statements: Statements = [];
    for (const select of creature.attack.selectWeapons) {
      const triggers: Triggers.Trigger[] = [
        ...utils.replaceTriggerTokens(targetTriggers, [
          { key: ScriptTarget.token, value: ScriptTarget.lastSeen },
        ]),
        ...select.triggers,
      ];
      if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
      const slot = WEAPON_SLOTS.find((w) => w.slot === select.slot);
      if (!slot) throw new Error(`Weapon slot ${select.slot} is not defined !`);
      statements.push({
        triggers,
        responses: responseFactory.response([
          { name: "SelectWeaponAbility", params: [slot.id, 0] },
          { name: "Continue" },
        ]),
      });
    }
    return statements;
  }

  private potions({ statements, creature, options }: HandlerParams): void {
    if (!creature.behavior.usePotions) return;
    for (const potion of POTIONS) {
      for (const file of potion.files) {
        const triggers: Triggers.Trigger[] = [
          { name: "HasItem", params: [file, ScriptTarget.myself] },
          triggerFactory.globalRoundTimerExpired(),
          ...(potion.triggers ?? []),
        ];
        if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
        const actions: Actions.Action[] = [
          ...(potion.actions ?? []),
          {
            name: "DisplayStringHead",
            params: [ScriptTarget.myself, `@${translationService.stringRef("common.potion.use")}`],
          },
          actionFactory.setGlobalRoundTimer(),
          { name: "UseItem", params: [file, ScriptTarget.myself] },
        ];
        statements.push({
          triggers,
          comment: potion.name,
          responses: responseFactory.response(actions),
        });
      }
    }
  }

  private precastLongDurationSpells({
    statements,
    options,
  }: Pick<HandlerParams, "statements" | "options">): void {
    this.precastSpells(
      statements,
      "long",
      GLOBAL_CONFIG.bafConstants.precastLongDurationSpells,
      options,
    );
  }

  private precastMidDurationSpells({
    statements,
    options,
  }: Pick<HandlerParams, "statements" | "options">): void {
    if (!GLOBAL_CONFIG.spellcasterPrecastMidDurationSpells) return;
    this.precastSpells(
      statements,
      "mid",
      GLOBAL_CONFIG.bafConstants.precastMidDurationSpells,
      options,
    );
  }

  private precastSpells(
    statements: Statements,
    duration: Required<SpellReference["duration"]>,
    variable: string,
    _options: BuilderOptions,
  ): void {
    const allSpells = getAllSpells();
    for (const key of utils.objectKeys(allSpells)) {
      const spell = allSpells[key];
      if (!("duration" in spell) || spell.duration !== duration) continue;
      statements.push({
        comment: `Precast ${key}`,
        triggers: [
          triggerFactory.global(variable, 0),
          { name: "HaveSpellRES", params: [spell.file] },
        ],
        responses: responseFactory.response([
          {
            name: "ReallyForceSpellRES",
            params: [spell.file, ScriptTarget.myself],
          },
          { name: "RemoveSpellRES", params: [spell.file] },
          { name: "Continue" },
        ]),
      });
    }
    statements.push({
      triggers: [triggerFactory.global(variable, 0)],
      responses: responseFactory.response([actionFactory.setGlobal(variable, 1)]),
    });
  }

  private creatureAbilities({ statements, creature, options }: HandlerParams): void {
    this.parseAbilities(statements, creature, options, creature.behavior.abilities);
  }

  private parseAbilities(
    statements: Statements,
    creature: Creature,
    options: BuilderOptions,
    abilities: CreatureAbility[],
  ): void {
    for (const ability of abilities) {
      if (ability.targets.length)
        this.creatureTargetsAbility(statements, creature, ability, ability.targets, options);
      else this.creatureSelfAbility(statements, creature, ability, options);
    }
  }

  private creatureTargetsAbility(
    statements: Statements,
    creature: Creature,
    ability: CreatureAbility,
    targets: TargetList[],
    options: BuilderOptions,
  ): void {
    for (const target of targets) {
      this.creatureTargetAbility(statements, creature, ability, target, options);
    }
  }

  private creatureTargetAbility(
    statements: Statements,
    creature: Creature,
    ability: CreatureAbility,
    target: TargetList,
    options: BuilderOptions,
  ): void {
    const triggerList = targetService.getTriggersFromTargetList(target);
    const triggers = triggerList.triggers;
    const targetTriggers = utils.replaceTriggerTokens(triggerList.targetTriggers, [
      { key: ScriptTarget.token, value: ScriptTarget.lastSeen },
    ]);
    triggers.unshift(...ability.triggers);
    if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
    if (ability.isSpell) {
      targetTriggers.unshift(
        ...triggerFactory.validSpellTarget({
          isTargetPlayer: false,
          seeInvisible: creature.seeInvisible(),
        }),
      );
    } else {
      targetTriggers.push(
        ...triggerFactory.validAttackTarget({
          isTargetPlayer: false,
        }),
      );
    }
    const actions: Actions.Action[] = [...ability.actions];
    if (ability.timer) {
      triggers.unshift(triggerFactory.globalTimerExpired(ability.timer.name));
      actions.unshift(actionFactory.setGlobalTimer(ability.timer.name, ability.timer.value));
    }
    if (!ability.noRoundTimer) {
      triggers.push(triggerFactory.globalRoundTimerExpired());
      actions.unshift(actionFactory.setGlobalRoundTimer());
    }
    if (ability.range) {
      targetTriggers.push({
        name: "Range",
        params: [ScriptTarget.lastSeen, ability.range],
      });
    }
    if (ability.minRange) {
      targetTriggers.push({
        name: "Range",
        params: [ScriptTarget.lastSeen, ability.minRange],
        negation: true,
      });
    }
    if (ability.requireVocal) {
      triggers.unshift({
        name: "StateCheck",
        params: [ScriptTarget.myself, "STATE_SILENCED"],
        negation: true,
      });
    }
    if (!ability.canUseWhenPolymorphed && creature.behavior.canPolymorph) {
      triggers.unshift({
        name: "CheckStat",
        params: [ScriptTarget.myself, 0, "POLYMORPHED"],
      });
    }
    if (ability.disableInterrupt) {
      actions.unshift(actionFactory.disableInterrupt());
      actions.push(actionFactory.enableInterrupt());
    }
    const list = targetService.getTargetFromAbility(target.name, target.limit, target.randomOrder);
    if (list.allegianceCheck) {
      triggers.push({
        name: "Allegiance",
        params: [ScriptTarget.myself, "ENEMY"],
      });
    }
    bafFactory.addStatementsFromTargetList({
      statements,
      comment: translationService.from(ability.name),
      triggers: [...triggers, ...targetTriggers],
      responses: responseFactory.response(actions),
      targets: list.targets as string[],
      reverse: target.reverse,
    });
  }

  private creatureSelfAbility(
    statements: Statements,
    creature: Creature,
    ability: CreatureAbility,
    options: BuilderOptions,
  ): void {
    const triggers = utils.replaceTriggerTokens(ability.triggers, [
      { key: ScriptTarget.token, value: ScriptTarget.myself },
    ]);
    if (options.summon) triggers.unshift({ name: "ActionListEmpty" });
    const actions: Actions.Action[] = [...ability.actions];
    if (ability.timer) {
      triggers.unshift(triggerFactory.globalTimerExpired(ability.timer.name));
      actions.push(actionFactory.setGlobalTimer(ability.timer.name, ability.timer.value));
    }
    if (!ability.noRoundTimer) {
      triggers.unshift(triggerFactory.globalRoundTimerExpired());
      actions.unshift(actionFactory.setGlobalRoundTimer());
    }
    if (ability.requireVocal) {
      triggers.unshift({
        name: "StateCheck",
        params: [ScriptTarget.myself, "STATE_SILENCED"],
        negation: true,
      });
    }
    if (!ability.canUseWhenPolymorphed && creature.behavior.canPolymorph) {
      triggers.unshift({
        name: "CheckStat",
        params: [ScriptTarget.myself, 0, "POLYMORPHED"],
      });
    }
    if (ability.disableInterrupt) {
      actions.unshift(actionFactory.disableInterrupt());
      actions.push(actionFactory.enableInterrupt());
    }
    statements.push({
      triggers,
      comment: translationService.from(ability.name),
      responses: responseFactory.response(actions),
    });
  }

  private getAdditionals(
    creature: Creature,
    location: CustomCodeLocation,
  ): { triggers: Triggers.Trigger[]; actions: Actions.Action[] } {
    const additionals = creature.behavior.additionalCodes.find((a) => a.location === location);
    return additionals ?? { triggers: [], actions: [] };
  }
}

const statementBuilderService = new StatementBuilderService();
export default statementBuilderService;
