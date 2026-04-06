import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const POLICY_SECTIONS = [
  {
    title: 'What is the DMCA?',
    content:
      'The Digital Millennium Copyright Act (DMCA) is a United States copyright law that provides a process for copyright holders to request the removal of infringing content from online platforms.',
  },
  {
    title: 'Our Commitment',
    content:
      'We respect the intellectual property rights of others and comply with the DMCA. We will respond to valid takedown notices promptly and remove or disable access to infringing material.',
  },
  {
    title: 'Counter-Notification',
    content:
      'If you believe your content was removed in error, you may submit a counter-notification. We will forward it to the original complainant, and the content may be restored if no legal action is filed within 10–14 business days.',
  },
  {
    title: 'Repeat Infringers',
    content:
      'Accounts that are the subject of repeated valid DMCA takedown notices may be terminated at our discretion.',
  },
];

export default function DMCA() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    company: '',
    infringingUrls: '',
    originalWorkUrls: '',
    description: '',
    goodFaith: false,
    underPenalty: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const isValid =
    form.fullName.trim() &&
    form.email.trim() &&
    form.infringingUrls.trim() &&
    form.originalWorkUrls.trim() &&
    form.description.trim() &&
    form.goodFaith &&
    form.underPenalty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitted(true);
    toast.success('DMCA takedown request submitted successfully.');
  };

  const update = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Icon icon="ph:shield-check-bold" className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">DMCA Policy & Takedown</h1>
      </div>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        If you believe content hosted on our platform infringes your copyright, please review our policy below and submit a takedown request.
      </p>

      {/* Policy Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {POLICY_SECTIONS.map((s) => (
          <Card key={s.title} className="bg-secondary/40 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Icon icon="ph:file-text-bold" className="w-4 h-4 text-primary" />
                {s.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Takedown Form */}
      {submitted ? (
        <Card className="bg-secondary/40 border-border max-w-2xl">
          <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center">
              <Icon icon="ph:check-circle-bold" className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Request Submitted</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Thank you. We've received your DMCA takedown request and will review it within 2–3 business days. You'll receive a response at <strong className="text-foreground">{form.email}</strong>.
            </p>
            <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-secondary/40 border-border max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Icon icon="ph:warning-bold" className="w-4 h-4 text-orange-500" />
              Submit a Takedown Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Full Name *</label>
                  <Input
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    className="bg-background border-border"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Email Address *</label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="bg-background border-border"
                    maxLength={255}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Company / Organization</label>
                <Input
                  placeholder="Optional"
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  className="bg-background border-border"
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Infringing URLs *</label>
                <Textarea
                  placeholder="List the URLs of the infringing content (one per line)"
                  value={form.infringingUrls}
                  onChange={(e) => update('infringingUrls', e.target.value)}
                  className="bg-background border-border min-h-[80px] resize-none"
                  maxLength={2000}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Original Work URLs *</label>
                <Textarea
                  placeholder="Links to your original copyrighted work (one per line)"
                  value={form.originalWorkUrls}
                  onChange={(e) => update('originalWorkUrls', e.target.value)}
                  className="bg-background border-border min-h-[80px] resize-none"
                  maxLength={2000}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Description *</label>
                <Textarea
                  placeholder="Describe the copyrighted work and how it is being infringed..."
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  className="bg-background border-border min-h-[100px] resize-none"
                  maxLength={5000}
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="goodFaith"
                    checked={form.goodFaith}
                    onCheckedChange={(v) => update('goodFaith', !!v)}
                    className="mt-0.5"
                  />
                  <label htmlFor="goodFaith" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    I have a good faith belief that use of the material described above is not authorized by the copyright owner, its agent, or the law.
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="underPenalty"
                    checked={form.underPenalty}
                    onCheckedChange={(v) => update('underPenalty', !!v)}
                    className="mt-0.5"
                  />
                  <label htmlFor="underPenalty" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                    I swear, under penalty of perjury, that the information in this notification is accurate and that I am the copyright owner or authorized to act on behalf of the owner.
                  </label>
                </div>
              </div>

              <Button type="submit" disabled={!isValid} className="w-full sm:w-auto gap-2">
                <Icon icon="ph:paper-plane-right-bold" className="w-4 h-4" />
                Submit Takedown Request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground mt-8">
        For general inquiries, please contact us at{' '}
        <a href="mailto:dmca@chapterhaven.io" className="text-primary hover:underline">
          dmca@chapterhaven.io
        </a>
      </p>
    </div>
  );
}
