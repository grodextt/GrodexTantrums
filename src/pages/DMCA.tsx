import { Shield } from 'lucide-react';

export default function DMCA() {
  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">DMCA Policy</h1>
      </div>
      <p className="text-muted-foreground">If you believe content on this site infringes your copyright, please contact us with a valid DMCA notice.</p>
    </div>
  );
}
