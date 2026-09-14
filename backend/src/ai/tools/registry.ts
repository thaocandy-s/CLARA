/** Product has no runtime tools (no calendar/maps/search). Kept as a swap point. */
export type ClaraTool = {
  name: string;
  description: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

export const claraTools: ClaraTool[] = [];

export const executeTool = async (name: string, _args: Record<string, unknown>) => {
  const tool = claraTools.find((item) => item.name === name);
  if (!tool) throw new Error(`No Clara tool registered: ${name}`);
  return tool.execute(_args);
};
