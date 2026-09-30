import responseFactory from "../src/factories/response.factory";
import { ScriptTarget } from "../src/model/constants";
import { CustomCode } from "../src/model/script/script";
import targetService from "../src/services/baf/target.service";

const avoidNaturalFriends: CustomCode = {
  location: "attack",
  type: "insertBefore",
  statements: [
    {
      comment: "Random walk if any druid/ranger/fey",
      triggers: [
        {
          name: "See",
          params: ["NearestEnemyOf"],
        },
        {
          name: "DamageTaken",
          params: [0],
        },
        {
          name: "Or",
          triggers: [
            {
              name: "Class",
              params: ["LastSeenBy", "DRUID_ALL"],
            },
            {
              name: "Class",
              params: ["LastSeenBy", "RANGER_ALL"],
            },
            {
              name: "Race",
              params: ["LastSeenBy", "FAIRY"],
            },
          ],
        },
      ],
      responses: responseFactory.response([{ name: "RandomWalk" }]),
    },
  ],
  abilities: [],
};

const wildAnimalsTurningHostile: CustomCode = {
  location: "turnHostile",
  type: "insertAfter",
  statements: [
    {
      comment: "Turn hostile if too close and not druid/ranger/fey",
      triggers: [
        { name: "Range", params: ["GOODCUTOFF", 7] },
        {
          name: "See",
          params: [targetService.targetObject({ ea: "PC", clazz: "DRUID_ALL" })],
          negation: true,
        },
        {
          name: "See",
          params: [targetService.targetObject({ ea: "PC", clazz: "RANGER_ALL" })],
          negation: true,
        },
        {
          name: "See",
          params: [targetService.targetObject({ ea: "PC", race: "FAIRY" })],
          negation: true,
        },
        {
          name: "Allegiance",
          params: [ScriptTarget.myself, "NEUTRAL"],
        },
      ],
      responses: responseFactory.response([{ name: "Enemy" }]),
    },
  ],
  abilities: [],
};

const hunterCustomCode: CustomCode = {
  location: "init",
  type: "insertBefore",
  statements: [
    // These patrol/return-to-post statements aren't universal - not every creature sharing
    // this hunterCustomCode object should get them (bears, jaguar, and mountain lion all
    // reuse this same object directly), so left disabled here rather than shipping them for
    // everyone. Would need to become per-creature/conditional rather than baked into this
    // shared object to be re-enabled correctly.
    // {
    //   triggers: [
    //     { name: "Allegiance", params: [ScriptTarget.myself, "NEUTRAL"] },
    //     {
    //       name: "NearSavedLocation",
    //       params: [ScriptTarget.myself, "INITIAL", 8],
    //       negation: true,
    //     },
    //     {
    //       name: "Class",
    //       params: [ScriptTarget.myself, "HUNTER_CREATURE"],
    //       negation: true,
    //     },
    //     { name: "Range", params: ["FOOD_CREATURE", 30], negation: true },
    //   ],
    //   responses: responseFactory.response([
    //     { name: "MoveToSavedLocationn", params: ["INITIAL", "LOCALS"] },
    //   ]),
    // },
    // {
    //   triggers: [
    //     triggerFactory.globalTimerExpired("BD_Move"),
    //     { name: "Allegiance", params: [ScriptTarget.myself, "NEUTRAL"] },
    //     { name: "Detect", params: ["GOODCUTOFF"] },
    //     {
    //       name: "NearSavedLocation",
    //       params: [ScriptTarget.myself, "INITIAL", 8],
    //     },
    //     { name: "Range", params: ["FOOD_CREATURE", 30], negation: true },
    //   ],
    //   responses: [
    //     {
    //       weight: 40,
    //       actions: [
    //         actionFactory.setGlobalTimer("BD_Move", 6),
    //         { name: "RandomWalk" },
    //       ],
    //     },
    //     {
    //       weight: 40,
    //       actions: [
    //         actionFactory.setGlobalTimer("BD_Move", 6),
    //         { name: "RandomTurn" },
    //       ],
    //     },
    //     {
    //       weight: 20,
    //       actions: [
    //         actionFactory.setGlobalTimer("BD_Move", 6),
    //         { name: "NoAction" },
    //       ],
    //     },
    //   ],
    // },
    {
      triggers: [
        { name: "Allegiance", params: [ScriptTarget.myself, "NEUTRAL"] },
        { name: "Class", params: [ScriptTarget.myself, "HUNTER_CREATURE"] },
        { name: "Detect", params: ["PC"] },
        { name: "See", params: ["FOOD_CREATURE"] },
      ],
      responses: responseFactory.response([
        { name: "AttackOneRound", params: [ScriptTarget.lastSeen] },
      ]),
    },
  ],
  abilities: [],
};

export const customCodes = {
  avoidNaturalFriends,
  hunterCustomCode,
  wildAnimalsTurningHostile,
};
