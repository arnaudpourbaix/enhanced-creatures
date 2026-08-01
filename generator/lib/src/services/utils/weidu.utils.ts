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
    return `IDS_OF_SYMBOL (~${file}~ ~${value}~)`;
  }
}

const weiduUtils = new WeiduUtils();
export default weiduUtils;
