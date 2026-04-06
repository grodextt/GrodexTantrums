import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function UserSettings() {
  const { isAuthenticated, user, profile, setShowLoginModal, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Notification preferences
  const [notifNewChapter, setNotifNewChapter] = useState(true);
  const [notifCommentReply, setNotifCommentReply] = useState(true);
  const [notifUpdates, setNotifUpdates] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Reading preferences
  const [themeMode, setThemeMode] = useState<string>(theme);
  const [readerDirection, setReaderDirection] = useState('vertical');

  // Load profile data when available
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarPreview(profile.avatar_url || '');
    }
  }, [profile]);

  // Load preferences from DB
  useEffect(() => {
    if (user && !prefsLoaded) {
      supabase
        .from('user_preferences' as any)
        .select('preferences')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data?.preferences) {
            const p = data.preferences;
            if (p.notif_new_chapter !== undefined) setNotifNewChapter(p.notif_new_chapter);
            if (p.notif_comment_reply !== undefined) setNotifCommentReply(p.notif_comment_reply);
            if (p.notif_updates !== undefined) setNotifUpdates(p.notif_updates);
            if (p.reader_direction) setReaderDirection(p.reader_direction);
          }
          setPrefsLoaded(true);
        });
    }
  }, [user, prefsLoaded]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url || '';

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${user.id}/avatar.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('manga-assets')
          .upload(path, avatarFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('manga-assets').getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      // Save notification preferences
      await supabase.from('user_preferences' as any).upsert({
        user_id: user.id,
        preferences: {
          notif_new_chapter: notifNewChapter,
          notif_comment_reply: notifCommentReply,
          notif_updates: notifUpdates,
          reader_direction: readerDirection,
        },
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'user_id' });

      // Refresh profile in context
      if (refreshProfile) {
        await refreshProfile();
      }

      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (value: string) => {
    setThemeMode(value);
    if ((value === 'dark' && theme === 'light') || (value === 'light' && theme === 'dark')) {
      toggleTheme();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-20 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon icon="ph:sign-in-bold" className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Sign in to access settings</h1>
        <p className="text-sm text-muted-foreground max-w-sm">You need to be logged in to manage your profile and preferences.</p>
        <Button onClick={() => setShowLoginModal(true)} className="gap-2">
          <Icon icon="ph:sign-in-bold" className="w-4 h-4" /> Sign In
        </Button>
      </div>
    );
  }

  const avatarInitial = (displayName || profile?.display_name || user?.email || 'U')[0].toUpperCase();

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Icon icon="ph:gear-bold" className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary/60">
          <TabsTrigger value="profile" className="gap-1.5 text-xs"><Icon icon="ph:user-bold" className="w-3.5 h-3.5" />Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5 text-xs"><Icon icon="ph:bell-bold" className="w-3.5 h-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5 text-xs"><Icon icon="ph:desktop-bold" className="w-3.5 h-3.5" />Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="bg-secondary/40 border-border">
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
              <CardDescription>Update your display name and avatar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-5">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="relative w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden group border-2 border-border hover:border-primary transition-colors"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary">{avatarInitial}</span>
                  )}
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon icon="ph:camera-bold" className="w-5 h-5 text-foreground" />
                  </div>
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <div>
                  <p className="text-sm font-medium text-foreground">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG under 2MB. Click the avatar to upload.</p>
                </div>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Display Name</label>
                  <Input
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-background border-border max-w-sm"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Email</label>
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="bg-muted border-border max-w-sm opacity-60"
                  />
                  <p className="text-[10px] text-muted-foreground">Email is managed by your login provider.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Bio</label>
                  <Textarea
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-background border-border max-w-sm min-h-[80px] resize-none"
                    maxLength={300}
                  />
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="bg-secondary/40 border-border">
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Choose what you'd like to be notified about. Click Save to persist.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {[
                { label: 'New chapter releases', desc: 'Get notified when a series you follow releases a new chapter.', checked: notifNewChapter, set: setNotifNewChapter },
                { label: 'Comment replies', desc: 'Get notified when someone replies to your comment.', checked: notifCommentReply, set: setNotifCommentReply },
                { label: 'Platform updates', desc: 'Receive news about features and events.', checked: notifUpdates, set: setNotifUpdates },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={item.checked} onCheckedChange={item.set} />
                </div>
              ))}
              <Button onClick={handleSaveProfile} disabled={saving} className="gap-2 mt-4">
                <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="bg-secondary/40 border-border">
            <CardHeader>
              <CardTitle className="text-base">Reading & Display</CardTitle>
              <CardDescription>Customize your reading experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Theme</p>
                <RadioGroup value={themeMode} onValueChange={handleThemeChange} className="flex gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: 'ph:sun-bold' },
                    { value: 'dark', label: 'Dark', icon: 'ph:moon-bold' },
                  ].map((t) => (
                    <label
                      key={t.value}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                        themeMode === t.value
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <RadioGroupItem value={t.value} className="sr-only" />
                      <Icon icon={t.icon} className="w-4 h-4" />
                      <span className="text-sm font-medium">{t.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* Reader Direction */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Default Reader Direction</p>
                <RadioGroup value={readerDirection} onValueChange={setReaderDirection} className="flex gap-3">
                  {['vertical', 'horizontal'].map((dir) => (
                    <label
                      key={dir}
                      className={`px-4 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm font-medium capitalize ${
                        readerDirection === dir
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <RadioGroupItem value={dir} className="sr-only" />
                      {dir}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
