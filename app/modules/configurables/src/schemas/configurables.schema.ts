/* START: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */
export interface FieldSchemaType {
  fieldName?: string;
  type:
    | "string"
    | "number"
    | "boolean"
    | "object"
    | "array"
    | "color"
    | "url"
    | "enum"
    | "datetime"
    | "file"
    | "files";
  required?: boolean;
  label?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  options?: string[];
  fields?: FieldSchemaType[];
  item?: FieldSchemaType;
}
/* END: THIS SECTION CODE IS CANNOT BE CHANGED, YOU ONLY READ IT */

export type ConfigurableSchemas = {
  formSchema: FieldSchemaType[];
};



export const configurableSchemas: ConfigurableSchemas = {
  formSchema: [
    {
      fieldName: "appName",
      type: "string",
      required: true,
      label: "App Name",
    },
    {
      fieldName: "logoUrl",
      type: "url",
      required: true,
      label: "Logo URL",
    },
    {
      fieldName: "brandColor",
      type: "object",
      required: true,
      label: "Brand Color",
      fields: [
        {
          fieldName: "primary",
          type: "color",
          required: true,
          label: "Primary",
        },
        {
          fieldName: "secondary",
          type: "color",
          required: true,
          label: "Secondary",
        },
        {
          fieldName: "accent",
          type: "color",
          required: true,
          label: "Accent",
        },
      ],
    },
    {
      fieldName: "tagline",
      type: "string",
      required: false,
      label: "Tagline",
      maxLength: 80,
    },
    {
      fieldName: "uploadSubtitle",
      type: "string",
      required: false,
      label: "Upload Area Subtitle",
      maxLength: 120,
    },
    {
      fieldName: "sceneColors",
      type: "object",
      required: false,
      label: "Scene Colors",
      fields: [
        { fieldName: "background", type: "color", required: false, label: "Background" },
        { fieldName: "grid", type: "color", required: false, label: "Grid Lines" },
        { fieldName: "bassColor", type: "color", required: false, label: "Bass Reaction Color" },
        { fieldName: "trebleColor", type: "color", required: false, label: "Treble Reaction Color" },
        { fieldName: "beatFlash", type: "color", required: false, label: "Beat Flash Color" },
        { fieldName: "skaterGlow", type: "color", required: false, label: "Skater Glow Color" },
      ],
    },
    {
      fieldName: "skaterName",
      type: "string",
      required: false,
      label: "Skater Character Name",
      maxLength: 40,
    },
    {
      fieldName: "bloomStrength",
      type: "number",
      required: false,
      label: "Bloom Strength (0.5–3.0)",
      min: 0.5,
      max: 3.0,
    },
    {
      fieldName: "terrainSegments",
      type: "number",
      required: false,
      label: "Terrain Resolution (32–128)",
      min: 32,
      max: 128,
    },
    {
      fieldName: "showBpmDisplay",
      type: "boolean",
      required: false,
      label: "Show BPM Display",
    },
    {
      fieldName: "showWaveform",
      type: "boolean",
      required: false,
      label: "Show Waveform Bar",
    },
  ],
};
