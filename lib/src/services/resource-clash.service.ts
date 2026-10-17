/** SPL and ITM resources share one namespace in the game, so a base name must not be in both. */
class ResourceClashService {
  check(spellFiles: string[], itemFiles: string[]): void {
    const spells = new Set(spellFiles.map((f) => f.toLowerCase()));
    const clashes = [...new Set(itemFiles.map((f) => f.toLowerCase()))].filter((f) =>
      spells.has(f),
    );
    if (clashes.length > 0) throw new Error(`SPL/ITM name clash: ${clashes.join(", ")}`);
  }
}

const resourceClashService = new ResourceClashService();
export default resourceClashService;
