import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface StorageSectionProps {
  settingsForm: {
    storage_provider: string;
    imgbb_api_key: string;
    r2_account_id: string;
    r2_access_key: string;
    r2_secret_key: string;
    r2_bucket_name: string;
    r2_public_url: string;
    blogger_blog_id?: string;
    blogger_api_key?: string;
  };
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
}

export function StorageSection({ settingsForm, setSettingsForm }: StorageSectionProps) {
  const [r2TutorialOpen, setR2TutorialOpen] = useState(false);
  const [imgbbTutorialOpen, setImgbbTutorialOpen] = useState(false);
  const [bloggerTutorialOpen, setBloggerTutorialOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ total_mb: number; total_files: number } | null>(null);
  const [projectStats, setProjectStats] = useState<any>(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchStorageUsage();
    fetchProjectStats();
  }, []);

  const fetchStorageUsage = async () => {
    setStorageLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('storage-usage');
      if (!error && data) {
        setStorageUsage(data);
      }
    } catch {
      // silently fail
    }
    setStorageLoading(false);
  };

  const fetchProjectStats = async () => {
    setStatsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('project-stats');
      if (!error && data) {
        setProjectStats(data);
      }
    } catch {
      // silently fail
    }
    setStatsLoading(false);
  };

  const providers = [
    {
      id: 'supabase',
      label: 'Supabase Storage',
      desc: 'Default • 1 GB free plan',
      icon: 'ph:hard-drive-bold',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      id: 'imgbb',
      label: 'ImgBB',
      desc: 'Free • 32MB/file limit',
      icon: 'ph:image-square-bold',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      id: 'r2',
      label: 'Cloudflare R2',
      desc: 'S3 Compatible • 10GB Free',
      icon: 'ph:cloud-bold',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      id: 'manual_blogger',
      label: 'Manual Blogger',
      desc: 'Paste HTML directly',
      icon: 'ph:file-html-bold',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'blogger',
      label: 'Blogger CDN (Auto)',
      desc: 'Free • Permanent Google CDN',
      icon: 'ph:google-logo-bold',
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Storage Usage Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Supabase Usage */}
        <div className="bg-card border border-border rounded-2xl p-4 col-span-2 lg:col-span-2">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon icon="ph:hard-drive-bold" className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Supabase Storage</p>
              <p className="text-[10px] text-muted-foreground truncate">manga-assets bucket</p>
            </div>
          </div>
          {storageLoading ? (
            <div className="animate-pulse h-6 bg-muted rounded w-24" />
          ) : storageUsage ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">
                  {storageUsage.total_mb >= 1024
                    ? `${(storageUsage.total_mb / 1024).toFixed(2)} GB`
                    : `${storageUsage.total_mb} MB`}
                </span>
                <span className="text-xs text-muted-foreground">used</span>
              </div>
              <p className="text-xs text-muted-foreground">{storageUsage.total_files.toLocaleString()} files</p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all"
                  style={{ width: `${Math.min(100, (storageUsage.total_mb / 1024) * 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Free plan: 1 GB • Pro plan: 100 GB</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Unable to fetch usage data</p>
          )}
        </div>

        {/* ImgBB Status */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Icon icon="ph:image-square-bold" className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">ImgBB</p>
              <p className="text-[10px] text-muted-foreground truncate">Free hosting</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {settingsForm.storage_provider === 'imgbb' && settingsForm.imgbb_api_key
                ? '✓ Configured & Active'
                : 'Not configured'}
            </p>
            <p className="text-[10px] text-muted-foreground">Max 32MB per file</p>
          </div>
        </div>

        {/* Cloudflare R2 Status */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
              <Icon icon="ph:cloud-bold" className="w-4.5 h-4.5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Cloudflare R2</p>
              <p className="text-[10px] text-muted-foreground truncate">S3-compatible</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {settingsForm.storage_provider === 'r2' && settingsForm.r2_access_key
                ? '✓ Configured & Active'
                : 'Not configured'}
            </p>
            <p className="text-[10px] text-muted-foreground">10GB Free Tier</p>
          </div>
        </div>

        {/* Blogger CDN Status */}
        <div className="bg-card border border-border rounded-2xl p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
              <Icon icon="ph:google-logo-bold" className="w-4.5 h-4.5 text-rose-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Blogger CDN</p>
              <p className="text-[10px] text-muted-foreground truncate">Google-hosted</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              {settingsForm.storage_provider === 'blogger' && settingsForm.blogger_blog_id && settingsForm.blogger_api_key
                ? '✓ Configured & Active'
                : settingsForm.storage_provider === 'manual_blogger'
                  ? '✓ Manual mode active'
                  : 'Not configured'}
            </p>
            <p className="text-[10px] text-muted-foreground">Unlimited • Free forever</p>
          </div>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base"><Icon icon="ph:database-bold" className="w-4 h-4" /> Storage Provider</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Choose where to store uploaded manga chapter images.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {providers.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSettingsForm((s: any) => ({ ...s, storage_provider: opt.id }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                settingsForm.storage_provider === opt.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 min-w-0">
                <div className={`w-7 h-7 rounded-lg ${opt.bg} flex items-center justify-center shrink-0`}>
                  <Icon icon={opt.icon} className={`w-4 h-4 ${opt.color}`} />
                </div>
                {settingsForm.storage_provider === opt.id && (
                  <span className="ml-auto text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">Active</span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold leading-tight">{opt.label}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* ── ImgBB Config ── */}
        {settingsForm.storage_provider === 'imgbb' && (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-start gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
              <Icon icon="ph:info-bold" className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <strong>ImgBB Setup:</strong> The easiest and fastest way to get free, permanent image hosting.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">ImgBB API Key</label>
              <Input
                type="password"
                value={settingsForm.imgbb_api_key}
                onChange={e => setSettingsForm((s: any) => ({ ...s, imgbb_api_key: e.target.value }))}
                className="rounded-xl bg-background font-mono text-xs"
                placeholder="1234567890abcdef..."
              />
            </div>

            <button
              onClick={() => setImgbbTutorialOpen(!imgbbTutorialOpen)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-1 transition-colors"
            >
              <Icon icon="ph:book-open-bold" className="w-3.5 h-3.5" />
              How to get an ImgBB API Key
              {imgbbTutorialOpen ? <Icon icon="ph:caret-up-bold" className="w-3 h-3" /> : <Icon icon="ph:caret-down-bold" className="w-3 h-3" />}
            </button>

            {imgbbTutorialOpen && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm text-muted-foreground border border-border/40">
                <ol className="list-decimal list-inside space-y-2 text-xs pl-2">
                  <li>Go to <a href="https://api.imgbb.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">api.imgbb.com</a>.</li>
                  <li>Sign up or log in.</li>
                  <li>Click <strong>Add API key</strong>.</li>
                  <li>Copy the key and paste it above. That's it!</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* ── Cloudflare R2 Config ── */}
        {settingsForm.storage_provider === 'r2' && (
          <div className="space-y-4 pt-3 border-t border-border">
            <div className="flex items-start gap-2 p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl">
              <Icon icon="ph:warning-bold" className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <p className="text-xs text-orange-600 dark:text-orange-400">
                <strong>Warning:</strong> You must configure CORS on your R2 bucket to allow direct uploads from your domain.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Account ID</label>
                <Input
                  value={settingsForm.r2_account_id}
                  onChange={e => setSettingsForm((s: any) => ({ ...s, r2_account_id: e.target.value }))}
                  className="rounded-xl bg-background font-mono text-xs"
                  placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Bucket Name</label>
                <Input
                  value={settingsForm.r2_bucket_name}
                  onChange={e => setSettingsForm((s: any) => ({ ...s, r2_bucket_name: e.target.value }))}
                  className="rounded-xl bg-background font-mono text-xs"
                  placeholder="e.g. manga-assets"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <div>
                <label className="text-sm font-medium mb-1 block">Access Key ID</label>
                <Input
                  value={settingsForm.r2_access_key}
                  onChange={e => setSettingsForm((s: any) => ({ ...s, r2_access_key: e.target.value }))}
                  className="rounded-xl bg-background font-mono text-xs"
                  placeholder="Access Key"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Secret Access Key</label>
                <Input
                  type="password"
                  value={settingsForm.r2_secret_key}
                  onChange={e => setSettingsForm((s: any) => ({ ...s, r2_secret_key: e.target.value }))}
                  className="rounded-xl bg-background font-mono text-xs"
                  placeholder="Secret Key"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Public URL (Custom Domain or R2 Dev URL)</label>
              <Input
                value={settingsForm.r2_public_url}
                onChange={e => setSettingsForm((s: any) => ({ ...s, r2_public_url: e.target.value }))}
                className="rounded-xl bg-background font-mono text-xs"
                placeholder="https://pub-123456789.r2.dev or https://assets.yourdomain.com"
              />
            </div>

            <button
              onClick={() => setR2TutorialOpen(!r2TutorialOpen)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-1 transition-colors"
            >
              <Icon icon="ph:book-open-bold" className="w-3.5 h-3.5" />
              How to configure R2 & CORS
              {r2TutorialOpen ? <Icon icon="ph:caret-up-bold" className="w-3 h-3" /> : <Icon icon="ph:caret-down-bold" className="w-3 h-3" />}
            </button>

            {r2TutorialOpen && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-4 text-sm text-muted-foreground border border-border/40">
                <ol className="list-decimal list-inside space-y-2 text-xs pl-2">
                  <li>Go to Cloudflare Dashboard {'>'} R2.</li>
                  <li>Click <strong>Create Bucket</strong> (e.g. `manga-assets`).</li>
                  <li>Go back to R2 overview, click <strong>Manage R2 API Tokens</strong>. Create a token with <strong>Object Read & Write</strong> permissions.</li>
                  <li>Copy everything: Account ID, Access Key, Secret Key into the fields above.</li>
                  <li>Inside your Bucket Settings, click <strong>Settings</strong>, and allow Public Access (either via custom domain or R2.dev URL). Paste that public URL above.</li>
                  <li className="font-semibold pt-2 text-orange-500">CRITICAL - CORS Configuration:</li>
                  <li>In your Bucket Settings, scroll down to <strong>CORS Policy</strong> and click <strong>Edit CORS Policy</strong>. Paste this exactly:</li>
                </ol>
                <div className="bg-background border border-border p-3 rounded-lg overflow-x-auto text-[10px] font-mono select-all">
{`[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://grodextt.pages.dev",
      "https://your-custom-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]`}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Manual Blogger Config ── */}
        {settingsForm.storage_provider === 'manual_blogger' && (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-start gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <Icon icon="ph:check-circle-bold" className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                <strong>Manual Blogger:</strong> No configuration needed! When you upload a chapter, you will simply use the "Paste HTML" button to insert Blogger links.
              </p>
            </div>
            
             <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground pl-2 bg-muted/20 p-4 rounded-xl border border-border/30">
                <li>Create a new post in your Google Blogger dashboard.</li>
                <li>Upload all your chapter images using their "Insert Image" button.</li>
                <li>Switch the post view to <strong>HTML View</strong>.</li>
                <li>Copy all the HTML.</li>
                <li>In Chapter Manager, click <strong>Paste HTML</strong> and paste it there. The system will automatically extract all permanent image links.</li>
              </ol>
          </div>
        )}

        {/* ── Automated Blogger CDN Config ── */}
        {settingsForm.storage_provider === 'blogger' && (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-start gap-2 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
              <Icon icon="ph:lightning-bold" className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <p className="text-xs text-rose-600 dark:text-rose-400">
                <strong>Automated Blogger CDN:</strong> Uploads images directly to Google's permanent CDN via the Blogger API. No file size limits, completely free. Requires a Blog ID and a short-lived OAuth access token.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Blogger Blog ID</label>
                <Input
                  value={settingsForm.blogger_blog_id || ''}
                  onChange={e => setSettingsForm((s: any) => ({ ...s, blogger_blog_id: e.target.value }))}
                  className="rounded-xl bg-background font-mono text-xs"
                  placeholder="e.g. 1234567890123456789"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">OAuth Access Token</label>
                <Input
                  type="password"
                  value={settingsForm.blogger_api_key || ''}
                  onChange={e => setSettingsForm((s: any) => ({ ...s, blogger_api_key: e.target.value }))}
                  className="rounded-xl bg-background font-mono text-xs"
                  placeholder="ya29.a0AfH6S..."
                />
              </div>
            </div>

            <button
              onClick={() => setBloggerTutorialOpen(!bloggerTutorialOpen)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-1 transition-colors"
            >
              <Icon icon="ph:book-open-bold" className="w-3.5 h-3.5" />
              How to get Blog ID & Access Token
              {bloggerTutorialOpen ? <Icon icon="ph:caret-up-bold" className="w-3 h-3" /> : <Icon icon="ph:caret-down-bold" className="w-3 h-3" />}
            </button>

            {bloggerTutorialOpen && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm text-muted-foreground border border-border/40">
                <p className="text-xs font-semibold text-foreground">Get your Blog ID</p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs pl-2">
                  <li>Open your blog at <a href="https://www.blogger.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">blogger.com</a> and go to <strong>Settings</strong>.</li>
                  <li>Look at the URL — it contains <code className="px-1 bg-background rounded">blogID=XXXXX</code>. Copy that number.</li>
                </ol>
                <p className="text-xs font-semibold text-foreground pt-2">Get an OAuth Access Token</p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs pl-2">
                  <li>Open the <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google OAuth 2.0 Playground</a>.</li>
                  <li>In the left list, find <strong>Blogger API v3</strong> and select <code className="px-1 bg-background rounded">https://www.googleapis.com/auth/blogger</code>.</li>
                  <li>Click <strong>Authorize APIs</strong> → log in with the Google account that owns the blog.</li>
                  <li>Click <strong>Exchange authorization code for tokens</strong>.</li>
                  <li>Copy the <strong>Access token</strong> and paste it above.</li>
                </ol>
                <p className="text-[10px] text-amber-500 pt-2">⚠️ OAuth access tokens expire every ~1 hour. For long-term use, prefer <strong>Manual Blogger</strong> mode — same Google CDN, no token to refresh.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Project Statistics (Accurate metrics from Management API) */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
              <Icon icon="ph:chart-bar-bold" className="w-4 h-4 text-primary" /> 
              Calculation Stats
            </h3>
            <p className="text-xs text-muted-foreground">Real-time usage metrics for the current Supabase project.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1.5 text-[10px] rounded-lg"
            onClick={fetchProjectStats}
            disabled={statsLoading}
          >
            <Icon icon="ph:arrows-clockwise-bold" className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-xl border border-border/50" />
            ))}
          </div>
        ) : projectStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Database Size */}
            <div className="bg-muted/10 border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:database-bold" className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-medium">Database Size</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{(projectStats.db_size.usage / (1024 * 1024)).toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground">
                    / {projectStats.db_size.limit >= 1024 * 1024 * 1024 
                        ? `${(projectStats.db_size.limit / (1024 * 1024 * 1024)).toFixed(0)} GB` 
                        : `${(projectStats.db_size.limit / (1024 * 1024)).toFixed(0)} MB`}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-indigo-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (projectStats.db_size.usage / projectStats.db_size.limit) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Egress */}
            <div className="bg-muted/10 border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:arrow-circle-up-right-bold" className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium">Monthly Egress</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{(projectStats.egress.usage / (1024 * 1024 * 1024)).toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">/ {(projectStats.egress.limit / (1024 * 1024 * 1024)).toFixed(0)} GB</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (projectStats.egress.usage / projectStats.egress.limit) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>

             {/* Cached Egress / CDN */}
             <div className="bg-muted/10 border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon icon="ph:lightning-bold" className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium">Cached Egress</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold">{(projectStats.egress.usage * 0.45 / (1024 * 1024 * 1024)).toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">GB (Estimated)</span>
                </div>
                <p className="text-[9px] text-muted-foreground leading-tight">Optimization via Supabase Global CDN.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-xl bg-muted/5">
            <Icon icon="ph:warning-circle-bold" className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground text-center">
              Unable to fetch account statistics. <br/>
              Please ensure the Edge Function is deployed and secrets are set.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
