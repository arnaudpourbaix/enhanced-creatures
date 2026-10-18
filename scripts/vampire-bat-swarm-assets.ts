/**
 * Builds the vampire bat swarm BAM, mod/lib/pnp-monster/vampire/assets/jaae4900.bam: the game's
 * bat creature animation (ABATG1) cut down to its flight, one cycle per direction (south to north).
 * The swarm projectile draws it all over its area as its spread animation, each bat with a random
 * cycle (direction) and frame, and a bat flies it to the spot (see batSwarm in vampire.ts).
 * Every cycle past the flight is dropped, as a random cycle could be an empty or a non-flying one.
 *
 * Extract ABATG1.BAM from BG2EE first, then run with its path:
 *   weidu --game <BG2EE> --biff-get ABATG1.BAM --out <folder>
 *   npx ts-node scripts/vampire-bat-swarm-assets.ts <folder>/ABATG1.BAM
 * Format: https://gibberlings3.github.io/iesdp/file_formats/ie_formats/bam_v1.htm
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";

const OUTPUT = path.join(__dirname, "../mod/lib/pnp-monster/vampire/assets/jaae4900.bam");

/** ABATG1's first action is its flight: cycles 0-4, one per direction */
const FLIGHT_CYCLES = 5;

const source = process.argv[2];
if (!source) throw new Error("Usage: vampire-bat-swarm-assets.ts <path to ABATG1.BAM>");

let bam = fs.readFileSync(source);
// BAMC: signature, version, uncompressed length, then the zlib-compressed BAM V1
if (bam.toString("ascii", 0, 4) === "BAMC") bam = zlib.inflateSync(bam.subarray(12));
if (bam.toString("ascii", 0, 8) !== "BAM V1  ") throw new Error(`${source} is not a BAM V1`);
const cycles = bam.readUInt8(0x0a);
if (cycles < FLIGHT_CYCLES) throw new Error(`${source} has only ${cycles} cycles`);

// Frames, palette and lookup table are left as they are: the cycle entries stay where they were,
// only the ones past the flight are no longer counted.
bam.writeUInt8(FLIGHT_CYCLES, 0x0a);
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, bam);
console.log(`Wrote ${OUTPUT} (${FLIGHT_CYCLES} of ${cycles} cycles)`);
