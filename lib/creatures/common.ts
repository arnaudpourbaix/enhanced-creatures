import responseFactory from "../src/factories/response.factory";
import { ScriptTarget } from "../src/model/constants";
import { CustomCode } from "../src/model/script/script";

export const hunterCustomCode: CustomCode = {
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
