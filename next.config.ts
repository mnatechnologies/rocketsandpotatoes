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
                pathname: '/storage/v1/object/public/**',
            }
        ]
    }
};

export default nextConfig;
