import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { usePlanAccess } from "@/hooks/usePlanAccess";

const TrialReminderDialog = () => {
  const navigate = useNavigate();
  const { isTrialing, daysLeft } = usePlanAccess();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isTrialing) return;
    if (daysLeft > 2 || daysLeft < 0) return;
    const key = `trial-reminder-${daysLeft}-${new Date().toDateString()}`;
    if (localStorage.getItem(key)) return;
    setOpen(true);
  }, [isTrialing, daysLeft]);

  const dismiss = () => {
    const key = `trial-reminder-${daysLeft}-${new Date().toDateString()}`;
    localStorage.setItem(key, "1");
    setOpen(false);
  };

  const upgrade = () => {
    dismiss();
    navigate("/upgrade");
  };

  if (!isTrialing) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <DialogTitle className="text-center">
            {daysLeft <= 1 ? "Last day of your free trial" : `Only ${daysLeft} days left`}
          </DialogTitle>
          <DialogDescription className="text-center">
            Upgrade now to keep your dashboard, reviews and complaints active without interruption.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={dismiss}>Remind me later</Button>
          <Button onClick={upgrade}>Upgrade now</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrialReminderDialog;
