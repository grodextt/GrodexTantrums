import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface StorageSectionProps {
  settingsForm: {
    storage_provider: string;
    blogger_blog_id: string;
    blogger_api_key: string;
    blogger_client_id: string;
    blogger_client_secret: string;
    imgur_client_id: string;
  };
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
}

export function StorageSection({ settingsForm, setSettingsForm }: StorageSectionProps) {
  const [bloggerTutorialOpen, setBloggerTutorialOpen] = useState(false);
  const [imgurTutorialOpen, setImgurTutorialOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ total_mb: number; total_files: number } | null>(null);
  const [storageLoading, setStorageLoading] = useState(false);

  useEffect(() => {
    fetchStorageUsage();
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
      id: 'imgur',
      label: 'Imgur CDN',
      desc: 'Free • Fastly CDN • 32 MB/image',
      icon: 'ph:image-bold',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      id: 'blogger',
      label: 'Blogger CDN',
      desc: 'Google Drive scope required',
      icon: 'ph:google-logo-bold',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Storage Usage Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Supabase Usage */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon icon="ph:hard-drive-bold" className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Supabase Storage</p>
              <p className="text-[10px] text-muted-foreground">manga-assets bucket</p>
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

        {/* Imgur Status */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Icon icon="ph:image-bold" className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Imgur CDN</p>
              <p className="text-[10px] text-muted-foreground">Fastly global CDN</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">∞</span>
              <span className="text-xs text-muted-foreground">unlimited</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {settingsForm.storage_provider === 'imgur' && settingsForm.imgur_client_id
                ? '✓ Configured & Active'
                : 'Not configured'}
            </p>
            <p className="text-[10px] text-muted-foreground">32 MB per image limit</p>
          </div>
        </div>

        {/* Blogger CDN Status */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Icon icon="ph:google-logo-bold" className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Blogger CDN</p>
              <p className="text-[10px] text-muted-foreground">Google's CDN hosting</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">∞</span>
              <span className="text-xs text-muted-foreground">unlimited</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {settingsForm.storage_provider === 'blogger' && settingsForm.blogger_blog_id && settingsForm.blogger_api_key
                ? '⚠ Configured (Drive scope needed)'
                : 'Not configured'}
            </p>
            <p className="text-[10px] text-muted-foreground">Requires Google Drive OAuth scope</p>
          </div>
        </div>
      </div>

      {/* Provider Selection */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:database-bold" className="w-4 h-4" /> Storage Provider</h3>
        <p className="text-sm text-muted-foreground">
          Choose where to store uploaded manga chapter images. <strong>Imgur CDN</strong> is recommended — free, fast, and works immediately.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {providers.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSettingsForm((s: any) => ({ ...s, storage_provider: opt.id }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                settingsForm.storage_provider === opt.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${opt.bg} flex items-center justify-center`}>
                  <Icon icon={opt.icon} className={`w-4 h-4 ${opt.color}`} />
                </div>
                {settingsForm.storage_provider === opt.id && (
                  <span className="ml-auto text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
                )}
              </div>
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>

        {/* ── Imgur Config ── */}
        {settingsForm.storage_provider === 'imgur' && (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-start gap-2 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
              <Icon icon="ph:check-circle-bold" className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-xs text-green-600 dark:text-green-400">
                <strong>Recommended:</strong> Imgur is completely free, requires no complex OAuth setup, and serves images via Fastly's global CDN.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Imgur Client ID</label>
              <Input
                value={settingsForm.imgur_client_id}
                onChange={e => setSettingsForm((s: any) => ({ ...s, imgur_client_id: e.target.value }))}
                className="rounded-xl bg-background font-mono text-xs"
                placeholder="e.g. a1b2c3d4e5f6789"
              />
              <p className="text-xs text-muted-foreground mt-1">Only the Client ID is needed (not a secret or OAuth). Anonymous uploads are allowed.</p>
            </div>

            {/* Imgur Tutorial */}
            <button
              onClick={() => setImgurTutorialOpen(!imgurTutorialOpen)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-1 transition-colors"
            >
              <Icon icon="ph:book-open-bold" className="w-3.5 h-3.5" />
              How to get your Imgur Client ID (2 minutes)
              {imgurTutorialOpen ? <Icon icon="ph:caret-up-bold" className="w-3 h-3" /> : <Icon icon="ph:caret-down-bold" className="w-3 h-3" />}
            </button>

            {imgurTutorialOpen && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm text-muted-foreground border border-border/40">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Imgur CDN Setup Guide</p>
                <ol className="list-decimal list-inside space-y-2 text-xs pl-2">
                  <li>Go to <a href="https://imgur.com/account/register" target="_blank" rel="noopener" className="text-primary underline">imgur.com/account/register</a> and create a free account (or log in)</li>
                  <li>Go to <a href="https://api.imgur.com/oauth2/addclient" target="_blank" rel="noopener" className="text-primary underline">api.imgur.com/oauth2/addclient</a></li>
                  <li>Fill in the form:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                      <li><strong>Application name:</strong> MangaZ CDN (or anything)</li>
                      <li><strong>Authorization type:</strong> Select <strong>"Anonymous usage without user authorization"</strong></li>
                      <li><strong>Email:</strong> Your email</li>
                    </ul>
                  </li>
                  <li>Click <strong>Submit</strong></li>
                  <li>Copy the <strong>Client ID</strong> shown on the next page and paste it above</li>
                </ol>
                <div className="flex items-start gap-2 p-2.5 bg-primary/5 rounded-lg">
                  <Icon icon="ph:info-bold" className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs">
                    <strong>How it works:</strong> Images are uploaded directly to Imgur using anonymous upload. Each image gets a permanent URL served by Fastly CDN (e.g. <code className="bg-muted px-1 rounded">https://i.imgur.com/abcd1234.jpg</code>).
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Blogger Config ── */}
        {settingsForm.storage_provider === 'blogger' && (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <Icon icon="ph:warning-bold" className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400">
                <strong>Note:</strong> Blogger CDN requires a Google refresh token with <strong>Google Drive API</strong> scope (<code>auth/drive.file</code>) in addition to the Blogger scope. We recommend <strong>Imgur CDN</strong> for easier setup.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Blog ID</label>
                <Input
                  value={settingsForm.blogger_blog_id}
                  onChange={e => setSettingsForm((s: any) => ({ ...s, blogger_blog_id: e.target.value }))}
                  className="rounded-xl bg-background font-mono text-xs"
                  placeholder="e.g. 1234567890123456789"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Refresh Token (with Drive scope)</label>
                <Input
                  type="password"
                  value={settingsForm.blogger_api_key}
                  onChange={e => setSettingsForm((s: any) => ({ ...s, blogger_api_key: e.target.value }))}
                  className="rounded-xl bg-background font-mono text-xs"
                  placeholder="1//0..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Google Client ID</label>
                <Input
                  value={settingsForm.blogger_client_id}
                  onChange={e => setSettingsForm((s: any) => ({ ...s, blogger_client_id: e.target.value }))}
                  className="rounded-xl bg-background font-mono text-xs"
                  placeholder="123...apps.googleusercontent.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Google Client Secret</label>
                <Input
                  type="password"
                  value={settingsForm.blogger_client_secret}
                  onChange={e => setSettingsForm((s: any) => ({ ...s, blogger_client_secret: e.target.value }))}
                  className="rounded-xl bg-background font-mono text-xs"
                  placeholder="GOCSPX-..."
                />
              </div>
            </div>

            {/* Tutorial Toggle */}
            <button
              onClick={() => setBloggerTutorialOpen(!bloggerTutorialOpen)}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-1 transition-colors"
            >
              <Icon icon="ph:book-open-bold" className="w-3.5 h-3.5" />
              How to regenerate token with Drive scope
              {bloggerTutorialOpen ? <Icon icon="ph:caret-up-bold" className="w-3 h-3" /> : <Icon icon="ph:caret-down-bold" className="w-3 h-3" />}
            </button>

            {bloggerTutorialOpen && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm text-muted-foreground border border-border/40">
                <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Regenerate Google Token with Drive Scope</p>

                <div className="space-y-2">
                  <p className="font-medium text-foreground text-xs">Steps</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs pl-2">
                    <li>Go to <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener" className="text-primary underline">OAuth 2.0 Playground</a></li>
                    <li>Click the ⚙️ gear icon → check <strong>"Use your own OAuth credentials"</strong></li>
                    <li>Enter your <strong>Client ID</strong> and <strong>Client Secret</strong></li>
                    <li>In the left panel, select <strong>both</strong> scopes:
                      <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                        <li><code className="bg-muted px-1 rounded text-[10px]">https://www.googleapis.com/auth/blogger</code></li>
                        <li><code className="bg-muted px-1 rounded text-[10px]">https://www.googleapis.com/auth/drive.file</code></li>
                      </ul>
                    </li>
                    <li>Click <strong>"Authorize APIs"</strong> → Sign in → Allow</li>
                    <li>Click <strong>"Exchange authorization code for tokens"</strong></li>
                    <li>Copy the <strong>Refresh Token</strong> and paste it above</li>
                  </ol>
                </div>

                <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 rounded-lg">
                  <Icon icon="ph:warning-bold" className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    <strong>Tip:</strong> If this seems complex, just use <strong>Imgur CDN</strong> — it's much simpler and works perfectly for manga hosting.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
