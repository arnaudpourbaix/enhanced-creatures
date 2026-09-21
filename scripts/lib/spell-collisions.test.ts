import { describe, expect, it } from "vitest";
import { parseCsv } from "./build-creatures";
import {
  findAvailabilityGaps,
  findFileCollisions,
  findIdentityMismatches,
  loadSnapshot,
  renderSpellCollisionsReport,
  type RegistryEntry,
} from "./spell-collisions";

const HEADER = "file;level;type;ids;name";
const SPWI106 = "SPWI106";
const BLINDNESS = "WIZARD_BLINDNESS";
const OBSCURING_MIST = "WIZARD_OBSCURING_MIST";
const VANILLA = "001_vanilla";
const SPELL_REV = "002_spell_rev";
const BLINDNESS_KEY = "Wizard.Blindness";
const OBSCURING_MIST_NAME = "Obscuring Mist";
const BLINDNESS_ENTRY: RegistryEntry = { key: BLINDNESS_KEY, file: SPWI106, id: BLINDNESS };
const ACID_FOG = "WIZARD_ACID_FOG";
const SPWI614 = "SPWI614";
const ACID_FOG_KEY = "Wizard.AcidFog";
const MINOR_LIGHTNING_BOLT = "WIZARD_MINOR_LIGHTNING_BOLT";
const SPWI230 = "SPWI230";
const MINOR_LIGHTNING_BOLT_KEY = "Wizard.MinorLightningBolt";
const GHOST_ENTRY: RegistryEntry = { key: "Wizard.Ghost", file: "SPWI999", id: "WIZARD_GHOST" };

const snapshotCsv = (...rows: [string, string, string, string, string][]) =>
  parseCsv([HEADER, ...rows.map((r) => r.join(";")), ""].join("\r\n"));

describe("findIdentityMismatches", () => {
  it("flags an entry whose declared id doesn't match a snapshot's actual id for that file", () => {
    const vanilla = loadSnapshot(
      VANILLA,
      snapshotCsv([SPWI106, "1", "Wizard", BLINDNESS, "Blindness"]),
    );
    const spellRev = loadSnapshot(
      SPELL_REV,
      snapshotCsv([SPWI106, "1", "Wizard", OBSCURING_MIST, OBSCURING_MIST_NAME]),
    );
    const entries: RegistryEntry[] = [BLINDNESS_ENTRY];

    const mismatches = findIdentityMismatches(entries, [vanilla, spellRev]);

    expect(mismatches).toEqual([
      {
        key: BLINDNESS_KEY,
        file: SPWI106,
        declaredId: BLINDNESS,
        mismatches: [
          { snapshot: SPELL_REV, actualId: OBSCURING_MIST, actualName: OBSCURING_MIST_NAME },
        ],
      },
    ]);
  });

  it("does not flag an entry that matches every snapshot it appears in", () => {
    const vanilla = loadSnapshot(
      VANILLA,
      snapshotCsv([SPWI614, "6", "Wizard", ACID_FOG, "Acid Fog"]),
    );
    const entries: RegistryEntry[] = [{ key: ACID_FOG_KEY, file: SPWI614, id: ACID_FOG }];

    expect(findIdentityMismatches(entries, [vanilla])).toEqual([]);
  });

  it("ignores an entry with no id declared", () => {
    const vanilla = loadSnapshot(
      VANILLA,
      snapshotCsv(["SPCL621", "1", "Innate", "SOMETHING_ELSE", "Something"]),
    );
    const entries: RegistryEntry[] = [{ key: "Class.SummonSpiritAnimal", file: "SPCL621" }];

    expect(findIdentityMismatches(entries, [vanilla])).toEqual([]);
  });

  it("ignores a file the snapshot has no row for", () => {
    const vanilla = loadSnapshot(VANILLA, snapshotCsv());
    const entries: RegistryEntry[] = [GHOST_ENTRY];

    expect(findIdentityMismatches(entries, [vanilla])).toEqual([]);
  });
});

describe("findFileCollisions", () => {
  const vanilla = loadSnapshot(
    VANILLA,
    snapshotCsv([SPWI106, "1", "Wizard", BLINDNESS, "Blindness"]),
  );
  const spellRev = loadSnapshot(
    SPELL_REV,
    snapshotCsv([SPWI106, "1", "Wizard", OBSCURING_MIST, OBSCURING_MIST_NAME]),
  );

  it("ignores a file only one entry uses", () => {
    expect(findFileCollisions([BLINDNESS_ENTRY], [vanilla, spellRev])).toEqual([]);
  });

  it("marks a disjoint collision (each entry matches a different, non-overlapping snapshot)", () => {
    const entries: RegistryEntry[] = [
      BLINDNESS_ENTRY,
      { key: "Wizard.ObscuringMist", file: SPWI106, id: OBSCURING_MIST },
    ];

    const [collision] = findFileCollisions(entries, [vanilla, spellRev]);

    expect(collision.sameStateConflict).toBe(false);
    expect(collision.hasDanglingEntry).toBe(false);
    expect(collision.entries).toEqual([
      { key: BLINDNESS_KEY, id: BLINDNESS, matchingSnapshots: [VANILLA] },
      { key: "Wizard.ObscuringMist", id: OBSCURING_MIST, matchingSnapshots: [SPELL_REV] },
    ]);
  });

  it("marks a same-state conflict when two entries match the same snapshot", () => {
    const entries: RegistryEntry[] = [
      BLINDNESS_ENTRY,
      { key: "Wizard.BlindnessAlias", file: SPWI106, id: BLINDNESS },
    ];

    const [collision] = findFileCollisions(entries, [vanilla, spellRev]);

    expect(collision.sameStateConflict).toBe(true);
    expect(collision.hasDanglingEntry).toBe(false);
  });

  it("marks a dangling entry when one side matches no known snapshot", () => {
    const entries: RegistryEntry[] = [
      BLINDNESS_ENTRY,
      { key: "Wizard.Ghost", file: SPWI106, id: "WIZARD_GHOST_TOWN" },
    ];

    const [collision] = findFileCollisions(entries, [vanilla, spellRev]);

    expect(collision.sameStateConflict).toBe(false);
    expect(collision.hasDanglingEntry).toBe(true);
  });

  it("sorts collisions by file", () => {
    const entries: RegistryEntry[] = [
      { key: "A1", file: "SPWI200", id: "X" },
      { key: "A2", file: "SPWI200", id: "Y" },
      { key: "B1", file: "SPWI100", id: "X" },
      { key: "B2", file: "SPWI100", id: "Y" },
    ];
    expect(findFileCollisions(entries, []).map((c) => c.file)).toEqual(["SPWI100", "SPWI200"]);
  });
});

const NEWSPELLS = "004_stratagems_newspells";

describe("findAvailabilityGaps", () => {
  const vanilla = loadSnapshot(
    VANILLA,
    snapshotCsv([SPWI230, "1", "Wizard", "SOME_OTHER_ID", "Something Else"]),
  );
  const newspells = loadSnapshot(
    NEWSPELLS,
    snapshotCsv([SPWI230, "2", "Wizard", MINOR_LIGHTNING_BOLT, "Minor Lightning Bolt"]),
  );

  it("flags an id that only appears starting from a later snapshot as mod-gated", () => {
    const entries: RegistryEntry[] = [
      { key: MINOR_LIGHTNING_BOLT_KEY, file: SPWI230, id: MINOR_LIGHTNING_BOLT },
    ];

    const [gap] = findAvailabilityGaps(entries, [vanilla, newspells]);

    expect(gap.availableFromStart).toBe(false);
    expect(gap.fileConsistent).toBe(true);
    expect(gap.availableIn).toEqual([{ snapshot: NEWSPELLS, file: SPWI230 }]);
  });

  it("flags an id present from vanilla on but at a different file than declared", () => {
    const withWrongFile = loadSnapshot(
      VANILLA,
      snapshotCsv(["SPWI899", "8", "Wizard", "WIZARD_NPC_SYMBOL_FEAR", "Symbol, Fear"]),
    );
    const entries: RegistryEntry[] = [
      { key: "Wizard.SymbolFear", file: "SPWI898", id: "WIZARD_NPC_SYMBOL_FEAR" },
    ];

    const [gap] = findAvailabilityGaps(entries, [withWrongFile]);

    expect(gap.availableFromStart).toBe(true);
    expect(gap.fileConsistent).toBe(false);
  });

  it("does not flag an entry available from the start at the declared file", () => {
    const entries: RegistryEntry[] = [{ key: ACID_FOG_KEY, file: SPWI614, id: ACID_FOG }];
    const snap = loadSnapshot(VANILLA, snapshotCsv([SPWI614, "6", "Wizard", ACID_FOG, "Acid Fog"]));

    expect(findAvailabilityGaps(entries, [snap])).toEqual([]);
  });

  const PHYSICAL_MIRROR = "CLERIC_PHYSICAL_MIRROR";
  const physicalMirrorSnapshots = () => [
    loadSnapshot(
      VANILLA,
      snapshotCsv(["SPPR613", "6", "Priest", PHYSICAL_MIRROR, "Physical Mirror"]),
    ),
    loadSnapshot(
      "003_stratagems_iwd",
      snapshotCsv(["SPPR531", "5", "Priest", PHYSICAL_MIRROR, "Physical Mirror"]),
    ),
  ];

  it("does not flag a file shift already covered by a listed variant file", () => {
    const entries: RegistryEntry[] = [
      {
        key: "Priest.PhysicalMirror",
        file: "SPPR613",
        id: PHYSICAL_MIRROR,
        variantFiles: ["SPPR531"],
      },
    ];

    expect(findAvailabilityGaps(entries, physicalMirrorSnapshots())).toEqual([]);
  });

  it("does not flag a mod-gated entry whose declared requiresFromSnapshot matches reality", () => {
    const entries: RegistryEntry[] = [
      {
        key: MINOR_LIGHTNING_BOLT_KEY,
        file: SPWI230,
        id: MINOR_LIGHTNING_BOLT,
        requiresFromSnapshot: NEWSPELLS,
      },
    ];

    expect(findAvailabilityGaps(entries, [vanilla, newspells])).toEqual([]);
  });

  it("still flags a requiresFromSnapshot that doesn't match reality (e.g. it disappears again later)", () => {
    // AcidFog-shaped case: present starting at a mod, but gone again in a later snapshot - a plain
    // requiresFromSnapshot can't describe "and not after Z", so declaring one here must stay flagged.
    const early = loadSnapshot(
      VANILLA,
      snapshotCsv([SPWI614, "6", "Wizard", "WIZARD_DEATH_FOG", "Death Fog"]),
    );
    const spellRevOnly = loadSnapshot(
      SPELL_REV,
      snapshotCsv([SPWI614, "6", "Wizard", ACID_FOG, "Acid Fog"]),
    );
    const revertsBack = loadSnapshot(
      NEWSPELLS,
      snapshotCsv([SPWI614, "6", "Wizard", "WIZARD_DEATH_FOG", "Death Fog"]),
    );
    const entries: RegistryEntry[] = [
      { key: ACID_FOG_KEY, file: SPWI614, id: ACID_FOG, requiresFromSnapshot: SPELL_REV },
    ];

    const [gap] = findAvailabilityGaps(entries, [early, spellRevOnly, revertsBack]);
    expect(gap.availableIn).toEqual([{ snapshot: SPELL_REV, file: SPWI614 }]);
  });

  it("still flags a file shift the listed variants don't cover", () => {
    const entries: RegistryEntry[] = [
      { key: "Priest.PhysicalMirror", file: "SPPR613", id: PHYSICAL_MIRROR },
    ];

    const [gap] = findAvailabilityGaps(entries, physicalMirrorSnapshots());
    expect(gap.fileConsistent).toBe(false);
  });

  it("ignores an id that is never found in any snapshot", () => {
    expect(findAvailabilityGaps([GHOST_ENTRY], [vanilla])).toEqual([]);
  });

  it("ignores an entry with no id declared", () => {
    const entries: RegistryEntry[] = [{ key: "Class.SummonSpiritAnimal", file: "SPCL621" }];
    expect(findAvailabilityGaps(entries, [vanilla])).toEqual([]);
  });
});

describe("renderSpellCollisionsReport", () => {
  it("renders each section and omits the empty ones", () => {
    const report = renderSpellCollisionsReport(
      [
        {
          key: BLINDNESS_KEY,
          file: SPWI106,
          declaredId: BLINDNESS,
          mismatches: [
            { snapshot: SPELL_REV, actualId: OBSCURING_MIST, actualName: OBSCURING_MIST_NAME },
          ],
        },
      ],
      [],
      [
        {
          key: MINOR_LIGHTNING_BOLT_KEY,
          id: "WIZARD_MINOR_LIGHTNING_BOLT",
          declaredFile: "SPWI017",
          availableIn: [{ snapshot: NEWSPELLS, file: SPWI230 }],
          availableFromStart: false,
          fileConsistent: true,
        },
      ],
    );

    expect(report).toContain("## Identity mismatches (1)");
    expect(report).toContain(`Wizard.Blindness | ${SPWI106} | ${BLINDNESS}`);
    expect(report).toContain("## Availability gaps (1)");
    expect(report).toContain("Wizard.MinorLightningBolt | SPWI017 | WIZARD_MINOR_LIGHTNING_BOLT");
    expect(report).not.toContain("## File collisions");
  });
});
