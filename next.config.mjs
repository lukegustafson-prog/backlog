/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The libSQL/Turso driver uses native/dynamic modules that must not be bundled
  // by webpack; keep them external so they load from node_modules at runtime.
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "libsql"],
};

export default nextConfig;
