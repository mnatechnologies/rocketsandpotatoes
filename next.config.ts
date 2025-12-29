import type { NextConfig } from "next";
import './ngrok.config'

const nextConfig: NextConfig = {
  /* config options here */
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'vlvejjyyvzrepccgmsvo.supabase.co',
                port: '',
                pathname: '/storage/v1/object/**',
            },
            {
                protocol: 'https',
                hostname: 'qxkbfzsyhbtfhkmeccml.supabase.co',
                port: '',
                pathname: '/storage/v1/object/**',
            }
        ]
    }
};

export default nextConfig;
