import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
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
  };
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
}

export function StorageSection({ settingsForm, setSettingsForm }: StorageSectionProps) {
  const [r2TutorialOpen, setR2TutorialOpen] = useState(false);
  const [imgbbTutorialOpen, setImgbbTutorialOpen] = useState(false);
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
  ];

  return (
    <div className="space-y-4">
      {/* Storage Usage Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Supabase Usage */}
        <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
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

        {/* ImgBB Status */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Icon icon="ph:image-square-bold" className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">ImgBB</p>
              <p className="text-[10px] text-muted-foreground">Free Image Hosting</p>
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
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Icon icon="ph:cloud-bold" className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold">Cloudflare R2</p>
              <p className="text-[10px] text-muted-foreground">S3-Compatible Storage</p>
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
      </div>

      {/* Provider Selection */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:database-bold" className="w-4 h-4" /> Storage Provider</h3>
        <p className="text-sm text-muted-foreground">
          Choose where to store uploaded manga chapter images.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                <li>In MangaZ Chapter Manager, click <strong>Paste HTML</strong> and paste it there. The system will automatically extract all permanent image links.</li>
              </ol>
          </div>
        )}
      </div>
    </div>
  );
}
