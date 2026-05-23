/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
  readonly VITE_YOUTUBE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Silence CSS side-effect import errors for mapbox-gl
declare module 'mapbox-gl/dist/mapbox-gl.css' {
  const css: string;
  export default css;
}

