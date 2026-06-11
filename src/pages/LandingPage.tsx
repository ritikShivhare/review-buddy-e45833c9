import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router-dom";
import { Star, MessageSquare, ArrowRight, BarChart3, Shield, Zap, Check, Building2, Users, TrendingUp, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Replace with your real demo video. Supports YouTube embed URLs.
const DEMO_VIDEO_URL = "https://www.youtube.com/embed/ysz5S6PUM-U?autoplay=1&rel=0";

const faqs = [
  {
    q: "Is ReviewFlow compliant with Google's review policies?",
    a: "Yes. ReviewFlow never incentivizes or filters reviews — we simply make it easier for satisfied customers to share genuine feedback on Google. Unhappy customers are routed to a private channel so you can resolve issues, which is fully aligned with Google's review guidelines.",
  },
  {
    q: "How does the WhatsApp integration work?",
    a: "We use the official WhatsApp Business API via Twilio. After you add a customer, ReviewFlow sends them a short message asking for a 1–5 star rating. Based on their reply, they're routed to your Google Review page or a private complaint form.",
  },
  {
    q: "Can I use ReviewFlow for multiple business locations?",
    a: "Absolutely. Our Growth plan supports unlimited locations with separate dashboards, QR codes, and team members for each branch.",
  },
  {
    q: "Do my customers need to install anything?",
    a: "No. Customers receive a normal WhatsApp message and tap a link — no app installs, no logins, no friction. It works on any smartphone in India.",
  },
  {
    q: "What happens during the 14-day free trial?",
    a: "You get 50 review requests, the full dashboard, and WhatsApp messaging for one business location. No credit card required, and you can upgrade or cancel anytime.",
  },
  {
    q: "Can I import my existing customer list?",
    a: "Yes. You can upload a CSV of customer names and phone numbers, and ReviewFlow will queue up review requests automatically.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};


const steps = [
  {
    icon: MessageSquare,
    title: "Add Customer",
    description: "Enter your customer's phone number after their visit",
  },
  {
    icon: Star,
    title: "Auto-Collect Rating",
    description: "System sends a WhatsApp asking them to rate 1–5 stars",
  },
  {
    icon: ArrowRight,
    title: "Smart Routing",
    description: "Happy customers → Google Review. Unhappy → private alert to you",
  },
];

const plans = [
  {
    name: "Trial",
    price: "Free",
    period: "14 days",
    features: ["50 review requests", "Basic dashboard", "WhatsApp messaging", "1 business location"],
    cta: "Try It Free for 14 Days",
    popular: false,
  },
  {
    name: "Starter",
    price: "₹499",
    period: "/month",
    features: ["500 review requests/mo", "Full dashboard & analytics", "CSV import", "Priority support", "Custom templates"],
    cta: "Boost My Ratings — Start Now",
    popular: true,
  },
  {
    name: "Growth",
    price: "₹1,499",
    period: "/month",
    features: [
      "Unlimited requests",
      "Multi-location support",
      "Team members",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
    ],
    cta: "Talk to Sales",
    popular: false,
  },
];

const comparisonRows = [
  { feature: "Monthly review requests", starter: "500", growth: "Unlimited" },
  { feature: "Business locations", starter: "1", growth: "Unlimited" },
  { feature: "Team members", starter: "—", growth: "✓" },
  { feature: "CSV customer import", starter: "✓", growth: "✓" },
  { feature: "Dashboard & analytics", starter: "✓", growth: "Advanced" },
  { feature: "Custom message templates", starter: "✓", growth: "✓" },
  { feature: "API access", starter: "—", growth: "✓" },
  { feature: "Custom integrations", starter: "—", growth: "✓" },
  { feature: "Dedicated account manager", starter: "—", growth: "✓" },
  { feature: "Support", starter: "Priority email", growth: "Priority + Phone" },
];

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div
      className={`opacity-0 animate-fade-up ${className}`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      {children}
    </div>
  );
}

const LandingPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>ReviewFlow: Automated WhatsApp Google Review Management for Indian Businesses</title>
        <meta
          name="description"
          content="ReviewFlow helps Indian businesses collect more Google reviews automatically via WhatsApp. Route happy customers to Google, resolve complaints privately. Start free."
        />
        <link rel="canonical" href="https://local-loyalty.lovable.app/" />
        <meta property="og:title" content="ReviewFlow — Automated WhatsApp Google Review Management" />
        <meta
          property="og:description"
          content="Turn every customer into a Google review. Automated WhatsApp review collection built for Indian businesses."
        />
        <meta property="og:url" content="https://local-loyalty.lovable.app/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Star className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold text-foreground">ReviewFlow</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/sign-up">Boost My Ratings — Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/60 via-background to-background" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <AnimatedSection>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl" style={{ lineHeight: "1.08" }}>
                Turn every customer into a Google review
              </h1>
            </AnimatedSection>
            <AnimatedSection delay={120}>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Automatically collect ratings via WhatsApp. Happy customers leave Google reviews. Unhappy ones get resolved privately. Built for Indian businesses.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={240}>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/sign-up">Boost Your Ratings Today — Free Trial <ArrowRight className="ml-1 h-5 w-5" aria-hidden="true" /></Link>
                </Button>
                <Button variant="hero-outline" size="xl" asChild>
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={360}>
              <p className="mt-4 text-sm text-muted-foreground">No credit card required · 14-day free trial</p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Stats bar / Trust Banner */}
      <section className="border-y bg-card">
        <div className="container py-10">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { icon: Building2, value: "2,400+", label: "Businesses" },
              { icon: MessageSquare, value: "1.2M", label: "Reviews collected" },
              { icon: Star, value: "4.6★", label: "Avg rating boost" },
              { icon: TrendingUp, value: "89%", label: "Response rate" },
            ].map((stat, i) => (
              <AnimatedSection key={stat.label} delay={100 * i}>
                <div className="flex items-center gap-4 rounded-xl border bg-background/50 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <stat.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground tabular-nums leading-none">{stat.value}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Product Preview */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <AnimatedSection className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">See ReviewFlow in action</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Manage all your customer feedback from one simple dashboard.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={150} className="mt-12">
            <div className="relative mx-auto max-w-5xl">
              <div className="relative overflow-hidden rounded-2xl border bg-card shadow-2xl ring-1 ring-primary/10">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b bg-secondary/60 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-destructive/70" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                    <div className="h-3 w-3 rounded-full bg-primary/70" />
                  </div>
                  <div className="ml-4 text-xs text-muted-foreground">app.reviewflow.in/dashboard</div>
                </div>
                {/* Placeholder content */}
                <div className="relative aspect-video w-full bg-gradient-to-br from-secondary via-background to-secondary/40 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
                  <button
                    type="button"
                    onClick={() => setDemoOpen(true)}
                    aria-label="Play 90-second product demo"
                    className="relative flex flex-col items-center gap-3 group"
                  >
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
                      <Play className="h-8 w-8 ml-1" fill="currentColor" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Watch the 90-second demo</span>
                  </button>
                </div>
              </div>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Manage all your customer feedback from one simple dashboard.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>


      {/* How it works */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="container">
          <AnimatedSection className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">How ReviewFlow works</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Three simple steps to transform your customer feedback into growth</p>
          </AnimatedSection>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <AnimatedSection key={step.title} delay={150 * i}>
                <Card className="relative overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                      <step.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <div className="mt-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Step {i + 1}</div>
                    <h3 className="mt-3 text-xl font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-secondary/40">
        <div className="container">
          <AnimatedSection className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Everything you need</h2>
          </AnimatedSection>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: MessageSquare, title: "WhatsApp First", desc: "Reach customers on their preferred platform with 90%+ open rates" },
              { icon: Shield, title: "Protect Your Reputation", desc: "Negative feedback stays private — you resolve it before it goes public" },
              { icon: BarChart3, title: "Real-time Dashboard", desc: "Track ratings, response rates, and complaint resolution at a glance" },
              { icon: Zap, title: "Instant Alerts", desc: "Get notified immediately when a customer is unhappy" },
              { icon: Star, title: "Google Review Boost", desc: "Only happy customers get your Google Review link" },
              { icon: ArrowRight, title: "CSV Import", desc: "Bulk import your customer list and start collecting reviews" },
            ].map((f, i) => (
              <AnimatedSection key={f.title} delay={80 * i}>
                <div className="rounded-xl border bg-card p-6 hover:shadow-sm transition-shadow">
                  <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="container">
          <AnimatedSection className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Scale when you're ready.</p>
          </AnimatedSection>
          <div className="mt-14 grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <AnimatedSection key={plan.name} delay={150 * i}>
                <Card className={`relative overflow-hidden ${plan.popular ? "border-primary shadow-lg ring-2 ring-primary/30 md:-translate-y-2" : "border shadow-sm"}`}>
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-md">
                      <Star className="h-3 w-3" fill="currentColor" aria-hidden="true" />
                      Recommended
                    </div>
                  )}
                  <CardContent className="p-8">
                    <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground tabular-nums">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="mt-8 w-full"
                      asChild
                    >
                      <Link to="/sign-up">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>

          {/* Comparison Table */}
          <AnimatedSection delay={200} className="mt-20">
            <div className="mx-auto max-w-4xl">
              <h3 className="text-center text-2xl font-bold text-foreground">Starter vs Growth — what's different?</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">A detailed look at how the paid plans compare.</p>
              <div className="mt-8 overflow-hidden rounded-xl border bg-card shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-secondary/50">
                      <th className="px-6 py-4 text-left font-semibold text-foreground">Feature</th>
                      <th className="px-6 py-4 text-center font-semibold text-foreground">
                        Starter
                        <span className="ml-2 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Recommended</span>
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-foreground">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, idx) => (
                      <tr key={row.feature} className={idx % 2 === 1 ? "bg-secondary/20" : ""}>
                        <td className="px-6 py-3 text-muted-foreground">{row.feature}</td>
                        <td className="px-6 py-3 text-center font-medium text-foreground">{row.starter}</td>
                        <td className="px-6 py-3 text-center font-medium text-foreground">{row.growth}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 lg:py-28 bg-secondary/40">
        <div className="container max-w-3xl">
          <AnimatedSection className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Frequently asked questions</h2>
            <p className="mt-3 text-muted-foreground">Everything you need to know about ReviewFlow</p>
          </AnimatedSection>
          <AnimatedSection delay={120}>
            <Accordion type="single" collapsible className="mt-10 w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-base font-semibold text-foreground">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}

      <section className="py-20 bg-primary">
        <div className="container text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">Ready to grow your reviews?</h2>
            <p className="mt-3 text-primary-foreground/95 max-w-lg mx-auto">
              Join 2,400+ Indian businesses already using ReviewFlow to boost their Google ratings.
            </p>
            <Button variant="secondary" size="xl" className="mt-8" asChild>
              <Link to="/sign-up">Boost My Google Ratings — Free Trial <ArrowRight className="ml-1" aria-hidden="true" /></Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-card">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Star className="h-3.5 w-3.5 text-primary-foreground" aria-hidden="true" />
            </div>
            <span className="font-semibold text-foreground">ReviewFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 ReviewFlow. Made for Indian businesses.</p>
        </div>
      </footer>

      {/* Demo video modal */}
      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-0">
          <DialogTitle className="sr-only">ReviewFlow product demo</DialogTitle>
          <div className="aspect-video w-full">
            {demoOpen && (
              <iframe
                src={DEMO_VIDEO_URL}
                title="ReviewFlow 90-second product demo"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
