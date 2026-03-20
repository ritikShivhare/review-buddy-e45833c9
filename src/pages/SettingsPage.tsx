import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, QrCode, Download } from "lucide-react";

const defaultTemplates = {
  request: `Hello {customer_name}! 👋\n\nThank you for visiting {business_name}!\n\nWe'd love to hear about your experience.\nHow would you rate us?\n\nReply with a number:\n1 ⭐ - Very Poor\n2 ⭐⭐ - Poor\n3 ⭐⭐⭐ - Average\n4 ⭐⭐⭐⭐ - Good\n5 ⭐⭐⭐⭐⭐ - Excellent!`,
  redirect: `Thank you so much for the {rating} star rating! 🎉\n\nWe're thrilled you had a great experience!\n\nWould you mind sharing it on Google?\nIt takes just 1 minute and helps us a lot!\n\n👉 {google_review_url}\n\nThank you from the {business_name} team!`,
  apology: `Dear {customer_name},\n\nWe're truly sorry your experience fell short 🙏\n\nOur manager has been personally notified and will look into this right away.\n\nAs our apology, we'd like to offer you:\n{apology_offer}\n\nPlease reply here or call us at {manager_phone}\n— we want to make it right!`,
  alert: `🚨 New Complaint Alert!\n\nCustomer: {customer_name}\nPhone: {customer_phone}\nRating: {stars}\nTime: {time}\n\nPlease contact the customer and resolve this.\nReply to reach them directly.`,
};

const SettingsPage = () => {
  const [templates, setTemplates] = useState(defaultTemplates);

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
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input defaultValue="Spice Garden Restaurant" />
                </div>
                <div className="space-y-2">
                  <Label>Manager Phone (WhatsApp)</Label>
                  <Input defaultValue="+91 98765 43210" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Google Review URL</Label>
                  <Input defaultValue="https://g.page/r/spicegarden/review" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Business Address</Label>
                  <Input defaultValue="42 MG Road, Bangalore 560001" />
                </div>
                <div className="space-y-2">
                  <Label>Apology Offer</Label>
                  <Input defaultValue="15% off your next visit" />
                </div>
              </div>
              <Button onClick={() => toast.success("Settings saved")}>
                <Save className="mr-1.5 h-4 w-4" /> Save Changes
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
              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30">
                <QrCode className="h-24 w-24 text-muted-foreground/40" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Generate a QR code that customers can scan to rate your business
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Button onClick={() => toast.info("QR code generated!")}>
                  <QrCode className="mr-1.5 h-4 w-4" /> Generate QR Code
                </Button>
                <Button variant="outline">
                  <Download className="mr-1.5 h-4 w-4" /> Download PNG
                </Button>
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
