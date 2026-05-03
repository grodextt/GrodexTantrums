# Supabase Transition Guide (Production)

## Project Details
- **Production URL**: `https://esbwpbkjiigftefoiqoy.supabase.co`
- **Project ID**: `esbwpbkjiigftefoiqoy`
- **Region**: US East (North Virginia)

## Current Status
The project has been successfully migrated from the old development instance (`mqtowxaxwanovvjdktpq`) to the current production instance.

### Migrated Features:
1. **Subscription System**: Full parity for Coin/Token/Plan logic.
2. **Premium Content Gating**: Automated free-release timers and role-based access.
3. **Storage Providers**: Configured and active support for Blogger API, ImgBB, and R2.
4. **Security Hardening**:
   - Administrative RPCs revoked from public access.
   - Security Definer views patched to Security Invoker.
   - Sensitive tables hidden from GraphQL.
   - search_path hardened for all public functions.

### Edge Functions:
- `blogger-upload`: Active (Google CDN image hosting).
- `project-stats`: Active (Management API metrics).
- `subscription-webhook`: Active (Payment processing).

## Database Reference
Connection string: `postgresql://postgres:[PASSWORD]@db.esbwpbkjiigftefoiqoy.supabase.co:5432/postgres`

## Next Maintenance
- Regularly check `get_advisors` for security/performance notices.
- Monitor `egress` usage via the Admin Panel > Settings > Storage stats.