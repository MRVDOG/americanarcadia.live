/// <reference types="astro/client" />

import type { DirectoryRuntime } from "@astrojs/cloudflare";

interface ImportMetaEnv {
  PUBLIC_CLERK_PUBLISHABLE_KEY: string
  CLERK_SECRET_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface AAAccessToken {
  token: string
  secret: string | undefined
  scopes: string[] | undefined
}

type D1Database = import('@cloudflare/workers-types/experimental').D1Database;
type ENV = {
  DATABASE: D1Database;
};

type Runtime = import('@astrojs/cloudflare').AdvancedRuntime<ENV>;

declare namespace App {
	export interface Locals extends Runtime {
    accessToken: AAAccessToken;
  }
}