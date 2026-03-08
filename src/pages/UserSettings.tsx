import { Settings } from 'lucide-react';

export default function UserSettings() {
  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">User Settings</h1>
      </div>
      <p className="text-muted-foreground">Coming soon — manage your account preferences.</p>
    </div>
  );
}
