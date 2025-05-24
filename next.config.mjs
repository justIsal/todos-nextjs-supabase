/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      //   {
      //     protocol: 'https',
      //     hostname: 'https://assiroji-web.vercel.app/',

      //     pathname: '/**',
      //   },
    ],
    domains: ['cdn.pixabay.com', 'images.unsplash.com', 'rlgofmswuasvxcwcwwgp.supabase.co'],
  },
};

export default nextConfig;
