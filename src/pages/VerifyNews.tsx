import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, HelpCircle, Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlassmorphicCard } from "@/components/GlassmorphicCard";
import { GradientBadge } from "@/components/GradientBadge";
import { VerdictAnimation } from "@/components/VerdictAnimation";
import { SourceLogo } from "@/components/SourceLogo";
import { SkeletonCard } from "@/components/SkeletonCard";

interface VerificationResult {
  id?: string;
  claim: string;
  verdict: "True" | "False" | "Uncertain";
  confidence: number;
  reasoning: string;
  sources?: { name: string; url: string }[];
  timestamp: string;
}

export default function VerifyNews() {
  const location = useLocation();
  const { user } = useAuth();
  const [claim, setClaim] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Handle re-verify from history
    if (location.state?.claim) {
      setClaim(location.state.claim);
    }
  }, [location.state]);

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
    setIsBookmarked(false);

    try {
      const { data, error } = await supabase.functions.invoke("verify-news", {
        body: { claim },
      });

      if (error) throw error;

      // Save to verifications table if user is logged in
      let verificationId: string | undefined;
      if (user) {
        const { data: insertData, error: insertError } = await supabase
          .from("verifications")
          .insert({
            user_id: user.id,
            claim: data.claim,
            verdict: data.verdict,
            confidence: data.confidence,
            reasoning: data.reasoning,
            sources: data.sources || null,
          })
          .select("id")
          .single();

        if (!insertError && insertData) {
          verificationId = insertData.id;
        }
      }

      setResult({ ...data, id: verificationId });
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

  const toggleBookmark = async () => {
    if (!result?.id || !user) return;

    if (isBookmarked) {
      await supabase.from("bookmarks").delete().eq("verification_id", result.id).eq("user_id", user.id);
      setIsBookmarked(false);
      toast({ title: "Removed from bookmarks" });
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, verification_id: result.id });
      setIsBookmarked(true);
      toast({ title: "Added to bookmarks" });
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

  return (
    <div className="container max-w-4xl py-8 px-4">
      <GlassmorphicCard gradient>
        <CardHeader className="pb-4">
          <CardTitle className="text-3xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            TruthWave Verification
          </CardTitle>
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
              className="resize-none backdrop-blur-sm bg-background/50 border-border/50 focus:border-primary/50 transition-all"
            />
          </div>

          <Button 
            onClick={handleVerify} 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Verify Claim"
            )}
          </Button>

          {loading && <SkeletonCard />}

          {result && (
            <VerdictAnimation verdict={result.verdict}>
              <Card className="border-2 backdrop-blur-md bg-card/80 border-border/50 shadow-lg overflow-hidden">
                <div className={`h-1 w-full ${
                  result.verdict === "True" ? "bg-gradient-to-r from-green-500 to-emerald-600" :
                  result.verdict === "False" ? "bg-gradient-to-r from-red-500 to-rose-600" :
                  "bg-gradient-to-r from-yellow-500 to-amber-600"
                }`} />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {getVerdictIcon(result.verdict)}
                    <div className="flex-1">
                      <CardTitle className="text-xl">Verification Result</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Analyzed at {new Date(result.timestamp).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {user && result.id && (
                        <Button size="icon" variant="ghost" onClick={toggleBookmark}>
                          {isBookmarked ? (
                            <BookmarkCheck className="h-5 w-5 text-primary" />
                          ) : (
                            <Bookmark className="h-5 w-5" />
                          )}
                        </Button>
                      )}
                      <GradientBadge variant={result.verdict.toLowerCase() as any}>
                        {result.verdict}
                      </GradientBadge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Confidence Score</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            result.verdict === "True" ? "bg-gradient-to-r from-green-500 to-emerald-600" :
                            result.verdict === "False" ? "bg-gradient-to-r from-red-500 to-rose-600" :
                            "bg-gradient-to-r from-yellow-500 to-amber-600"
                          }`}
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

                  {result.sources && result.sources.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Sources</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 hover:bg-muted transition-colors text-sm"
                          >
                            <SourceLogo source={source.name} />
                            <span>{source.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-3">
                    <h4 className="text-sm font-semibold mb-1">Original Claim</h4>
                    <p className="text-sm italic">&ldquo;{result.claim}&rdquo;</p>
                  </div>
                </CardContent>
              </Card>
            </VerdictAnimation>
          )}
        </CardContent>
      </GlassmorphicCard>
    </div>
  );
}
