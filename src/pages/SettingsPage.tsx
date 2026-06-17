import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, QrCode, Download, Sparkles, Copy, MessageCircle, AlertCircle } from "lucide-react";
import { useBusiness, useUpdateBusiness } from "@/hooks/useBusiness";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { QRCodeSVG } from "qrcode.react";
import { PhoneInput } from "@/components/PhoneInput";

const defaultTemplates = {
  request: `Hello {customer_name}! 👋\n\nThank you for visiting {business_name}!\n\nWe'd love to hear about your experience.\nHow would you rate us?\n\nReply with a number:\n1 ⭐ - Very Poor\n2 ⭐⭐ - Poor\n3 ⭐⭐⭐ - Average\n4 ⭐⭐⭐⭐ - Good\n5 ⭐⭐⭐⭐⭐ - Excellent!`,
  redirect: `Thank you so much for the {rating} star rating! 🎉\n\nWe're thrilled you had a great experience!\n\nWould you mind sharing it on Google?\nIt takes just 1 minute and helps us a lot!\n\n👉 {google_review_url}\n\nThank you from the {business_name} team!`,
  apology: `Dear {customer_name},\n\nWe're truly sorry your experience fell short 🙏\n\nOur manager has been personally notified and will look into this right away.\n\nAs our apology, we'd like to offer you:\n{apology_offer}\n\nPlease reply here or call us at {manager_phone}\n— we want to make it right!`,
  alert: `🚨 New Complaint Alert!\n\nCustomer: {customer_name}\nPhone: {customer_phone}\nRating: {stars}\nTime: {time}\n\nPlease contact the customer and resolve this.\nReply to reach them directly.`,
};

const SettingsPage = () => {
  const { data: business, isLoading } = useBusiness();
  const updateBusiness = useUpdateBusiness();
  const { plan, status, daysLeft, isTrialing, trialEndsAt, limits } = usePlanAccess();
  const [templates, setTemplates] = useState(defaultTemplates);

  const [form, setForm] = useState({
    business_name: "",
    manager_phone: "",
    google_review_url: "",
    address: "",
    apology_offer: "",
  });

  useEffect(() => {
    if (business) {
      setForm({
        business_name: business.business_name || "",
        manager_phone: business.manager_phone || "",
        google_review_url: business.google_review_url || "",
        address: business.address || "",
        apology_offer: business.apology_offer || "15% off your next visit",
      });
    }
  }, [business]);

  const handleSaveSettings = async () => {
    try {
      await updateBusiness.mutateAsync(form);
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  const qrUrl = business ? `${window.location.origin}/r/${business.id}` : "";

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `reviewflow-qr-${business?.business_name?.replace(/\s+/g, "-").toLowerCase() || "code"}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your business and message settings</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Manager Phone (WhatsApp)</Label>
                  <PhoneInput
                    value={form.manager_phone}
                    onChange={(v) => setForm({ ...form, manager_phone: v })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Google Review URL</Label>
                  <Input value={form.google_review_url} onChange={(e) => setForm({ ...form, google_review_url: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Business Address</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Apology Offer</Label>
                  <Input value={form.apology_offer} onChange={(e) => setForm({ ...form, apology_offer: e.target.value })} />
                </div>
              </div>
              <Button onClick={handleSaveSettings} disabled={updateBusiness.isPending}>
                <Save className="mr-1.5 h-4 w-4" /> {updateBusiness.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-5">
            {Object.entries(templates).map(([key, value]) => (
              <Card key={key} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold capitalize">{key === "alert" ? "Manager Alert" : `${key} Template`}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={8}
                    value={value}
                    onChange={(e) => setTemplates((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="font-mono text-sm"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Variables: {`{customer_name}, {business_name}, {rating}, {google_review_url}, {apology_offer}, {manager_phone}`}
                  </p>
                </CardContent>
              </Card>
            ))}
            <Button onClick={() => toast.success("Templates saved")}>
              <Save className="mr-1.5 h-4 w-4" /> Save Templates
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="qr">
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center">
              {qrUrl ? (
                <div className="mx-auto inline-block rounded-xl border-2 border-border bg-background p-4">
                  <QRCodeSVG id="qr-code-svg" value={qrUrl} size={192} level="H" />
                </div>
              ) : (
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                  <QrCode className="h-24 w-24 text-muted-foreground/40" />
                </div>
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                Customers scan this QR code to leave a review or file a complaint
              </p>
              {qrUrl && (
                <p className="mt-2 text-xs text-muted-foreground font-mono break-all">{qrUrl}</p>
              )}
              <div className="mt-4 flex justify-center gap-3">
                <Button variant="outline" onClick={handleDownloadQR} disabled={!qrUrl}>
                  <Download className="mr-1.5 h-4 w-4" /> Download PNG
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4 text-primary" /> WhatsApp Business Setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">Current mode: Manual (Click-to-chat)</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Review requests and complaint replies open WhatsApp pre-filled — you tap Send. To enable fully automated sending, complete the Twilio template approval checklist below.
                    </p>
                    <Button size="sm" variant="outline" disabled className="mt-3">
                      Enable automatic sending (templates required)
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label>Twilio Incoming-Message Webhook URL</Label>
                <p className="text-xs text-muted-foreground mt-1 mb-2">
                  In Twilio Console → Messaging → Senders → your WhatsApp Sender → set the "When a message comes in" webhook to this URL (HTTP POST):
                </p>
                <div className="flex gap-2">
                  <Input readOnly value="https://yvyuqqkejfxtftwpgijt.functions.supabase.co/whatsapp-webhook" className="font-mono text-xs" />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText("https://yvyuqqkejfxtftwpgijt.functions.supabase.co/whatsapp-webhook");
                      toast.success("Webhook URL copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-md border bg-muted/30 p-4 text-sm space-y-2">
                <p className="font-semibold text-foreground">Production checklist</p>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground text-xs">
                  <li>Complete Facebook Business Verification at business.facebook.com.</li>
                  <li>In Twilio Console, register a WhatsApp Sender (1–3 days approval).</li>
                  <li>Submit two message templates for approval: owner-notification and customer-acknowledgement.</li>
                  <li>Once approved, share with us: sender E.164 number + the two Content SIDs (HX…).</li>
                  <li>Paste the webhook URL above into the Sender's "incoming messages" setting.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground capitalize">{plan} Plan</h3>
                    <Badge variant={status === "active" ? "default" : status === "trialing" ? "secondary" : "destructive"} className="capitalize">
                      {status}
                    </Badge>
                  </div>
                  {isTrialing && trialEndsAt && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Trial ends in <span className="font-semibold text-foreground">{daysLeft} day{daysLeft === 1 ? "" : "s"}</span> ({trialEndsAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })})
                    </p>
                  )}
                  {status === "active" && (
                    <p className="mt-1 text-sm text-muted-foreground">Your subscription is active.</p>
                  )}
                </div>
                <Button asChild>
                  <Link to="/upgrade"><Sparkles className="mr-1.5 h-4 w-4" /> {status === "active" ? "Change plan" : "Upgrade"}</Link>
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Customer / request limit</p>
                  <p className="text-lg font-semibold text-foreground">{limits.maxRequests === Infinity ? "Unlimited" : limits.maxRequests}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Locations</p>
                  <p className="text-lg font-semibold text-foreground">{limits.maxLocations === Infinity ? "Unlimited" : limits.maxLocations}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team members</p>
                  <p className="text-lg font-semibold text-foreground">{limits.maxTeam === Infinity ? "Unlimited" : limits.maxTeam}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card className="shadow-sm">
            <CardContent className="p-6 text-center py-16">
              <div className="mx-auto max-w-sm">
                <h3 className="text-lg font-semibold text-foreground">Team Management</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Invite team members to help manage reviews and complaints. Coming soon on Growth plan.
                </p>
                <Button variant="outline" className="mt-4" disabled>Coming Soon</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
