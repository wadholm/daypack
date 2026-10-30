// Lets tests import the migration SQL as text (Vite's ?raw suffix).
declare module '*.sql?raw' {
  const sql: string;
  export default sql;
}
