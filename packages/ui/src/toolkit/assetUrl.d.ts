/** Vite/Astro serve a module imported with `?url` as a file of this site and give its URL. */
declare module '*?url' {
  const url: string;
  export default url;
}
