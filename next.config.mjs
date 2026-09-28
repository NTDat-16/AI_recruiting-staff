/** @type {import('next').NextConfig} */
const isVercel = Boolean(process.env.VERCEL);
const backendUrl =
  process.env.BACKEND_INTERNAL_URL ||
  (process.env.NODE_ENV === "production" && !isVercel
    ? "http://backend:8000"
    : "http://127.0.0.1:8000");

const nextConfig = {
  output: isVercel ? undefined : "standalone",
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: isVercel
          ? "/api/:path*"
          : `${backendUrl}/api/:path*`,
      },
      {
        source: "/storage/:path*",
        destination: `${backendUrl}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
