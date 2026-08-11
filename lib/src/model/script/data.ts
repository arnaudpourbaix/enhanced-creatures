export interface GenericScriptRawData {
  name: string;
  parameters: string;
  description: string;
  section?: string;
}

export interface GenericScriptData {
  name: string;
  parameters: GenericScriptParameterData[];
  description: string;
  section?: string;
}

export interface GenericScriptParameterData {
  raw: string;
  name: string;
  isNumber: boolean;
  isObject: boolean;
}
