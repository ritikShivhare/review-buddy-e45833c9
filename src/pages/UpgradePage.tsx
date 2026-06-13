import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePlanAccess } from "@/hooks/usePlanAccess";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "₹499",
    period: "/month",
    popular: true,
    features: [
      "500 review requests / month",
      "Full dashboard & analytics",
      "CSV import & export",
      "QR routing, complaints, WhatsApp",
      "Priority email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "₹1,499",
    period: "/month",
    popular: false,
    features: [
      "Unlimited review requests",
      "Multi-location support",
      "Team members",
      "API access & custom integrations",
      "Dedicated account manager",
    ],
  },
];

const UpgradePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isTrialing, daysLeft, isExpired, refetch } = usePlanAccess();

  const upgrade = useMutation({
    mutationFn: async (planId: string) => {
      if (!user) throw new Error("Not signed in");
      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      const { error } = await supabase
        .from("subscriptions")
        .update({ plan: planId, status: "active", current_period_end: periodEnd.toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: async (_, planId) => {
      toast.success(`Welcome to the ${planId === "starter" ? "Starter" : "Growth"} plan!`);
      await refetch();
      navigate("/dashboard");
    },
    onError: (e: any) => toast.error(e.message || "Upgrade failed"),
  });

  return (
    <div className="min-h-screen bg-secondary/30 p-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Star className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {isExpired ? "Your free trial has ended" : "Choose your plan"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isExpired
              ? "Pick a plan to keep using ReviewFlow."
              : isTrialing
                ? `You have ${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your free trial.`
                : "Unlock the full ReviewFlow experience."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:pt-4">
          {plans.map((p) => (
            <Card
              key={p.id}
              className={`relative ${p.popular ? "overflow-visible border-primary shadow-lg ring-2 ring-primary/30 md:-translate-y-2" : "overflow-hidden border shadow-sm"}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                  Recommended
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold text-foreground tabular-nums">{p.price}</span>
                  <span className="text-muted-foreground text-sm">{p.period}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  size="lg"
                  variant={p.popular ? "default" : "outline"}
                  disabled={upgrade.isPending}
                  onClick={() => upgrade.mutate(p.id)}
                >
                  {upgrade.isPending ? "Activating..." : `Choose ${p.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!isExpired && (
          <div className="mt-8 text-center">
            <Button variant="ghost" asChild>
              <Link to="/dashboard"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradePage;
