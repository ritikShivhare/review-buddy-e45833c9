import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    businessName: "",
    managerPhone: "",
    googleReviewUrl: "",
    address: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.managerPhone) {
      toast.error("Please fill in required fields");
      return;
    }
    toast.success("Business set up successfully!");
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Star className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set up your business</h1>
          <p className="mt-1 text-sm text-muted-foreground">Let's get ReviewFlow ready for your customers</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Business Name *</Label>
                <Input
                  placeholder="e.g. Spice Garden Restaurant"
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Manager WhatsApp Number *</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={form.managerPhone}
                  onChange={(e) => setForm({ ...form, managerPhone: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">You'll receive complaint alerts here</p>
              </div>
              <div className="space-y-2">
                <Label>Google Review URL</Label>
                <Input
                  placeholder="https://g.page/r/yourbusiness/review"
                  value={form.googleReviewUrl}
                  onChange={(e) => setForm({ ...form, googleReviewUrl: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Happy customers will be redirected here</p>
              </div>
              <div className="space-y-2">
                <Label>Business Address</Label>
                <Input
                  placeholder="42 MG Road, Bangalore"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Continue to Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingPage;
