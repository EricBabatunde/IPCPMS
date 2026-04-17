Deploying the **IPCPMS** to Vercel is the final step to making your engineering platform accessible to your supervisors and team. Since you are using **Prisma** and several external services (Pusher, UploadThing, etc.), the configuration needs a few specific adjustments beyond the defaults.

---

## 🛠️ Build and Output Settings

For a standard Next.js 14 project using Prisma, you need to ensure the **Prisma Client** is generated during the build process on Vercel's servers.

- **Build Command:** Override this and enter:
    
    `npx prisma generate && next build`
    
    - _Why?_ Vercel needs to build the Prisma Client specifically for its environment so your API routes can talk to the Neon database.
        
- **Output Directory:** Leave as default (`.next`).
    
- **Install Command:** Leave as default (`npm install`).
    
- **Root Directory:** If your code is in the main folder of your repository, leave this blank (or `.`).
    

---

## 🔐 Environment Variables

You must copy the values from your local `.env` file into the Vercel dashboard. These are the critical variables required based on your **Master Blueprint**:

### 1. Database & Authentication

|**Variable Name**|**Value / Notes**|
|---|---|
|`DATABASE_URL`|Your full **Neon.tech** connection string.|
|`AUTH_SECRET`|The random string used for **NextAuth v5**.|
|`AUTH_URL`|Your Vercel production URL (e.g., `https://your-project.vercel.app`).|
|`NEXT_PUBLIC_APP_URL`|Same as `AUTH_URL`.|

### 2. Real-time Messaging (Pusher)

|**Variable Name**|**Value / Notes**|
|---|---|
|`PUSHER_APP_ID`|From your Pusher Dashboard.|
|`PUSHER_KEY`|From your Pusher Dashboard.|
|`PUSHER_SECRET`|From your Pusher Dashboard.|
|`PUSHER_CLUSTER`|e.g., `mt1`.|
|`NEXT_PUBLIC_PUSHER_KEY`|Same as `PUSHER_KEY`.|
|`NEXT_PUBLIC_PUSHER_CLUSTER`|Same as `PUSHER_CLUSTER`.|

### 3. External Services (UploadThing & Resend)

|**Variable Name**|**Value / Notes**|
|---|---|
|`UPLOADTHING_SECRET`|From your UploadThing dashboard.|
|`UPLOADTHING_APP_ID`|From your UploadThing dashboard.|
|`RESEND_API_KEY`|From your Resend dashboard.|
|`RESEND_FROM_EMAIL`|Use `onboarding@resend.dev` or your verified domain.|

---

## ⚠️ Important Deployment Tips

1. **NextAuth v5 on Vercel:** NextAuth v5 (Auth.js) typically automatically detects the deployment URL, but keeping `AUTH_URL` set to your specific Vercel domain helps prevent "Redirect URI" mismatch errors.
    
2. **Prisma and SSL:** Ensure your `DATABASE_URL` ends with `?sslmode=require` to allow Vercel to securely connect to Neon.
    
3. **Deployment Verification:** Once the build finishes, visit the site and try to log in. Since the database is already seeded in the cloud (Neon), your **Admin** and **Manager** credentials should work immediately on the live site!




### 🛠️ The Fix for Local Building

To run the build on your **Acer Aspire**, you should use the scripts already defined in your `package.json`:

1. **The Standard Way**:
    
    Bash
    
    ```
    npm run build
    ```
    
    _This automatically looks into your local `node_modules` and runs the correct version of Next.js._
    
2. **The Manual Way (if you want to run exactly what Vercel does)**:
    
    Bash
    
    ```
    npx prisma generate && npx next build
    ```
    
    _Using `npx` tells Ubuntu to look for the command inside your project's dependencies first._
    

---

### ⚠️ A Note on Vercel vs. Local

The command I gave you earlier—`npx prisma generate && next build`—is intended for the **Vercel Dashboard "Build Command" setting**. Vercel's environment is pre-configured to understand the `next` command during the build phase.

On your local **Ubuntu** partition, you must prefix it with `npx` or use `npm run`.

### 🚀 Next Steps

If you haven't done so yet, ensure your local dependencies are installed by running `npm install` before you try to build.

Once the local build succeeds with `npm run build`, your GitHub code is officially ready for that Vercel import! How is the Vercel environment variable setup going?




The reason you are being redirected to `localhost:3000` is that your application's authentication and routing logic are still using the development URL defined in your environment variables.

In your production environment on Vercel, you need to update both **`NEXT_PUBLIC_APP_URL`** and **`AUTH_URL`** to match your live domain.

### The Correct Values for Vercel

In the Vercel Dashboard (Settings > Environment Variables), update these parameters to:

Code snippet

```
NEXT_PUBLIC_APP_URL="https://ipcpms-vike.vercel.app"
AUTH_URL="https://ipcpms-vike.vercel.app"
```

### Why This Is Happening

1. **NextAuth v5 Logic**: Your `auth.ts` and `middleware.ts` files use these variables to construct absolute URLs for redirections.
    
2. **Redirection Loop**: When the `middleware.ts` detects that you aren't logged in, it triggers a redirect. Because your environment variable currently points to `localhost`, the server tells your browser to go to `http://localhost:3000/login` instead of staying on the Vercel domain.
    
3. **Blueprint Requirement**: Your "Master Blueprint" explicitly states that `AUTH_URL` and `NEXT_PUBLIC_APP_URL` must be configured correctly for the application to function in production.
    

### Steps to Fix

1. Go to your **Vercel Project Dashboard**.
    
2. Navigate to **Settings** > **Environment Variables**.
    
3. Find `NEXT_PUBLIC_APP_URL` and click **Edit**. Change the value from `http://localhost:3000` to `https://ipcpms-vike.vercel.app`.
    
4. Do the same for **`AUTH_URL`**.
    
5. **Redeploy**: For these changes to take effect, you must trigger a new deployment (go to the **Deployments** tab, click the three dots on your latest build, and select **Redeploy**).