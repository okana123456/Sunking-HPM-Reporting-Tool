# Vercel deployment

Production client: https://sunking-hpm-reporting-tool.vercel.app/#client
Rudder management: https://sunking-hpm-reporting-tool.vercel.app/#admin

GitHub main is the deployment source. Push origin from GitHub Desktop after committing changes. Vercel builds using npm run build and serves dist.

## Supabase connection

In the Vercel project, open Settings > Environment Variables and add both variables for Production:

- VITE_SUPABASE_URL: the value from .env.local in the Desktop repository.
- VITE_SUPABASE_PUBLISHABLE_KEY: the anon or publishable key from .env.local.

The local file is deliberately ignored by Git. Adding these values locally does not send them to Vercel. Never use a service-role key or database password. After saving the variables, redeploy the latest production deployment.

Hosted management remains unavailable until configuration is present. Test data reports are readable without login. Once configured, Rudder management requires the authorised Supabase user. In Uploads and administration, copy the Sun King client link. Published production reports have their own copyable links.
