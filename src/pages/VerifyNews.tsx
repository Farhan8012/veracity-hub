import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationResult {
  claim: string;
  verdict: "True" | "False" | "Uncertain";
  confidence: number;
  reasoning: string;
  timestamp: string;
}

export default function VerifyNews() {
  const [claim, setClaim] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!claim.trim()) {
      toast({
        title: "Error",
        description: "Please enter a news claim to verify",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("verify-news", {
        body: { claim },
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Verification complete",
        description: `Verdict: ${data.verdict} (${data.confidence}% confidence)`,
      });
    } catch (error: any) {
      console.error("Verification error:", error);
      toast({
        title: "Verification failed",
        description: error.message || "Failed to verify the news claim",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "True":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "False":
        return <XCircle className="h-6 w-6 text-red-500" />;
      case "Uncertain":
        return <HelpCircle className="h-6 w-6 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "True":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "False":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Uncertain":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "";
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Fake News Detection</CardTitle>
          <CardDescription>
            Enter a news claim below and our AI will analyze it for accuracy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="claim" className="text-sm font-medium">
              News Claim
            </label>
            <Textarea
              id="claim"
              placeholder="Enter the news claim you want to verify..."
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          <Button onClick={handleVerify} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Verify Claim"
            )}
          </Button>

          {result && (
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {getVerdictIcon(result.verdict)}
                  <div className="flex-1">
                    <CardTitle className="text-xl">Verification Result</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Analyzed at {new Date(result.timestamp).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge className={getVerdictColor(result.verdict)} variant="secondary">
                    {result.verdict}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Confidence Score</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {result.confidence}%
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Analysis</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold mb-1">Original Claim</h4>
                  <p className="text-sm italic">&ldquo;{result.claim}&rdquo;</p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
