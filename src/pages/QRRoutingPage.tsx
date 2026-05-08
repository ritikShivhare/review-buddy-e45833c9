import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, ExternalLink } from "lucide-react";

const QRRoutingPage = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!businessId) return;
    // Public read - we need a policy for this. For now we use the ID directly.
    // In production this would be a public-facing edge function.
    const fetchBusiness = async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("business_name, google_review_url, manager_phone")
        .eq("id", businessId)
        .maybeSingle();
      if (error || !data) {
        setError("Business not found");
      } else {
        setBusiness(data);
      }
      setLoading(false);
    };
    fetchBusiness();
  }, [businessId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
        <Card className="max-w-sm shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-lg font-semibold text-foreground">Business not found</p>
            <p className="mt-2 text-sm text-muted-foreground">This QR code link may be invalid.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const whatsappUrl = `https://wa.me/${business.manager_phone?.replace(/[\s+\-()]/g, "")}?text=${encodeURIComponent(`Hi ${business.business_name}, I have a complaint regarding your service. [Briefly describe your issue here].`)}`;
  const googleUrl = business.google_review_url || "#";

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Star className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{business.business_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">How was your experience?</p>
        </div>

        <div className="space-y-4">
          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-primary/20">
            <CardContent className="p-0">
              <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Leave a Review</h3>
                  <p className="text-sm text-muted-foreground">Share your experience on Google</p>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-destructive/20">
            <CardContent className="p-0">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                  <MessageSquare className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">File a Complaint</h3>
                  <p className="text-sm text-muted-foreground">Chat with us on WhatsApp</p>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground" />
              </a>
            </CardContent>
          </Card>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">Powered by ReviewFlow</p>
      </div>
    </div>
  );
};

export default QRRoutingPage;
