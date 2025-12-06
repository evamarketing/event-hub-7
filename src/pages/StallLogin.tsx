import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStallAuth } from "@/contexts/StallAuthContext";
import { useToast } from "@/hooks/use-toast";
import { Store, Lock, User } from "lucide-react";
import logo from "@/assets/logo.jpg";

export default function StallLogin() {
  const [participantName, setParticipantName] = useState("");
  const [mobile, setMobile] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useStallAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await login(participantName.trim(), mobile.trim());

    if (result.success) {
      toast({ title: "Login successful", description: "Welcome to your dashboard!" });
      navigate("/my-profile");
    } else {
      toast({ title: "Login failed", description: result.error, variant: "destructive" });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <img src={logo} alt="Logo" className="h-20 w-auto rounded-xl mx-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Store className="h-6 w-6" />
              Stall Login
            </CardTitle>
            <CardDescription>
              Login with your registered participant name and mobile number
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="participantName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Participant Name
              </Label>
              <Input
                id="participantName"
                type="text"
                placeholder="Enter your registered name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Mobile Number (Password)
              </Label>
              <Input
                id="mobile"
                type="text"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login to Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
