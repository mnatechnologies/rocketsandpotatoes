
## Getting Started

First, run the development server:

`npm run dev` 
or
`yarn dev`
 or
`pnpm dev` 
or
`bun dev`

## 🔔 Important: Clerk Webhook Setup

This project uses **Clerk** for authentication and webhooks to sync user data to **Supabase**. 

### Quick Setup (Required for Webhooks to Work)

1. **Start your dev server**: `npm run dev`
2. **Find your ngrok URL**: Look for this line in the console:
   ```
   Forwarding to: localhost:3000 from ingress at: https://xxxx.ngrok-free.app
   ```
3. **Click that link** 