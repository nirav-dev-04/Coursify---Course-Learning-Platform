/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google Profile Images
      'eduflow-bucket.s3.amazonaws.com', // S3 bucket thumbnails
      'd111111abcdef8.cloudfront.net', // CloudFront assets
      'images.unsplash.com', // Unsplash course stock photos
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`, // Proxy to Spring Boot API
      },
    ];
  },
};

module.exports = nextConfig;
