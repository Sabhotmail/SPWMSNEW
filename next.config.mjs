/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Enable experimental features for better Docker support
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
};

export default nextConfig;
