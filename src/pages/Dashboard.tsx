import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome back, {user?.email?.split('@')[0]}!</h1>
          <p className="text-muted-foreground text-lg">
            Your AI-powered fact-checking companion
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Verify News Claims</CardTitle>
              <Shield className="h-8 w-8 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Check the accuracy of news headlines and claims using AI-powered fact verification
              </p>
              <Button onClick={() => navigate("/verify")} className="w-full">
                Start Verifying
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">How It Works</CardTitle>
              <CheckCircle className="h-8 w-8 text-primary" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Submit any news claim or headline</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>AI analyzes the claim for accuracy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Get verdict with confidence score</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About This Platform</CardTitle>
            <CardDescription>
              Combat misinformation with AI-powered fact-checking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This platform uses advanced AI technology to help you verify news claims and combat misinformation.
              Simply paste any news headline or claim, and our AI will analyze it to provide you with a verdict
              (True, False, or Uncertain) along with a confidence score and detailed reasoning.
            </p>
            <p className="text-sm text-muted-foreground">
              Use the "Verify News" feature to get started, or explore other sections using the navigation menu.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
