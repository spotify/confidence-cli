declare module '@spotify-confidence/quickstart' {
  type StoreOptions = {
    dryRun?: boolean;
    debug?: boolean;
    dir?: string;
    goals?: string[];
  };

  function startTui(opts?: StoreOptions): Promise<void>;
}
