This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔔 Important: Clerk Webhook Setup

This project uses **Clerk** for authentication and webhooks to sync user data to **Supabase**. 

### Quick Setup (Required for Webhooks to Work)

1. **Start your dev server**: `npm run dev`
2. **Find your ngrok URL**: Look for this line in the console:
   ```
   Forwarding to: localhost:3000 from ingress at: https://xxxx.ngrok-free.app
   ```
3. **Update Clerk webhook**: Go to [Clerk Dashboard](https://dashboard.clerk.com) → Webhooks and set the endpoint URL to:
   ```
   https://your-ngrok-url.ngrok-free.app/api/webhooks/clerk
   ```

### Helper Tools

- **Check ngrok status**: Run `node check-ngrok.js` to see your current ngrok URL
- **Full guide**: See [CLERK_WEBHOOK_SETUP.md](./CLERK_WEBHOOK_SETUP.md) for detailed instructions and troubleshooting

### Common Issue

If you see **"requests to this IP range are blocked"** in Clerk Dashboard:
- This means Clerk can't reach localhost
- Solution: Update the webhook URL with your ngrok URL (see guide above)

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
