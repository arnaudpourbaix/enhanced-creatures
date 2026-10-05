class WeiduUtils {
  getIntegerValue(value: number | string | undefined): string | undefined {
    if (value === undefined || value === "") return;
    const val = `${value}`.trim();
    if (!val.startsWith("-")) return val;
    return `"${val}"`;
  }

  // No default value: undefined is a distinct, meaningful third state here ("field not set,
  // don't write anything") - a default of false would silently turn that into a real "0" in
  // generated WeiDU output, which is a behavior change, not a style choice.
  // eslint-disable-next-line sonarjs/bool-param-default
  getBooleanValue(value: boolean | undefined): string | undefined {
    if (value === undefined) return;
    return value ? "1" : "0";
  }

  getIdsValue(file: string, value: string | undefined): string | undefined {
    if (value === undefined) return undefined;
    return this.idsOfSymbol(file, value);
  }

  idsOfSymbol(file: string, symbol: string): string {
    return `IDS_OF_SYMBOL (~${file}~ ~${symbol}~)`;
  }

  /**
   * Value of the first of `symbols` present in `file`.IDS at install time (IDS_OF_SYMBOL gives -1
   * for a missing one, e.g. added by a mod that isn't installed), else `fallback` - one nested
   * WeiDU ternary, so it still fits wherever a single value is expected.
   */
  getFirstIdsValue(file: string, symbols: string[], fallback: string): string {
    const chain = symbols.reduceRight((rest, symbol) => {
      const ids = this.idsOfSymbol(file, symbol);
      return `(${ids} >= 0) ? ${ids} : ${rest}`;
    }, fallback);
    return symbols.length ? `(${chain})` : fallback;
  }
}

const weiduUtils = new WeiduUtils();
export default weiduUtils;
