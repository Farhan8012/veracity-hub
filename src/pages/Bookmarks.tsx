import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GlassmorphicCard } from "@/components/GlassmorphicCard";
import { GradientBadge } from "@/components/GradientBadge";
import { SkeletonCard } from "@/components/SkeletonCard";
import { Trash2, Tag, RefreshCw, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { validation } from "@/lib/errorUtils";

interface BookmarkedVerification {
  id: string;
  tags: string[];
  created_at: string;
  verification: {
    id: string;
    claim: string;
    verdict: "True" | "False" | "Uncertain";
    confidence: number;
    reasoning: string;
    created_at: string;
  };
}

export default function Bookmarks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkedVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState<Record<string, string>>({});
  const [filterTag, setFilterTag] = useState<string>("");

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user]);

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select(`
        id,
        tags,
        created_at,
        verification:verifications(id, claim, verdict, confidence, reasoning, created_at)
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to load bookmarks", variant: "destructive" });
    } else {
      setBookmarks((data as any) || []);
    }
    setLoading(false);
  };

  const removeBookmark = async (bookmarkId: string) => {
    await supabase.from("bookmarks").delete().eq("id", bookmarkId);
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    toast({ title: "Bookmark removed" });
  };

  const addTag = async (bookmarkId: string) => {
    const tag = newTag[bookmarkId]?.trim();
    if (!tag) return;

    // Validate tag
    const tagValidation = validation.validateTag(tag);
    if (!tagValidation.valid) {
      toast({ title: "Invalid tag", description: tagValidation.error, variant: "destructive" });
      return;
    }

    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    // Check for duplicate tags
    if (bookmark.tags?.includes(tag)) {
      toast({ title: "Tag already exists", variant: "destructive" });
      return;
    }

    const updatedTags = [...(bookmark.tags || []), tag];
    await supabase.from("bookmarks").update({ tags: updatedTags }).eq("id", bookmarkId);
    
    setBookmarks(prev => prev.map(b => 
      b.id === bookmarkId ? { ...b, tags: updatedTags } : b
    ));
    setNewTag(prev => ({ ...prev, [bookmarkId]: "" }));
    toast({ title: "Tag added" });
  };

  const removeTag = async (bookmarkId: string, tagToRemove: string) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    const updatedTags = bookmark.tags.filter(t => t !== tagToRemove);
    await supabase.from("bookmarks").update({ tags: updatedTags }).eq("id", bookmarkId);
    
    setBookmarks(prev => prev.map(b => 
      b.id === bookmarkId ? { ...b, tags: updatedTags } : b
    ));
  };

  const allTags = [...new Set(bookmarks.flatMap(b => b.tags || []))];
  
  const filteredBookmarks = filterTag 
    ? bookmarks.filter(b => b.tags?.includes(filterTag))
    : bookmarks;

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 px-4 grid gap-4">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bookmarks</h1>
        <p className="text-muted-foreground">Your saved verifications with tags</p>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge 
            variant={!filterTag ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterTag("")}
          >
            All
          </Badge>
          {allTags.map(tag => (
            <Badge 
              key={tag}
              variant={filterTag === tag ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {filteredBookmarks.length === 0 ? (
        <GlassmorphicCard className="text-center py-12">
          <p className="text-muted-foreground">
            {filterTag ? "No bookmarks with this tag" : "No bookmarks yet. Save verifications from the History page!"}
          </p>
        </GlassmorphicCard>
      ) : (
        <div className="space-y-4">
          {filteredBookmarks.map((bookmark) => (
            <GlassmorphicCard key={bookmark.id} className="relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => navigate("/verify", { state: { claim: bookmark.verification.claim } })}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => removeBookmark(bookmark.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="pr-20">
                <div className="flex items-start gap-3 mb-3">
                  <GradientBadge variant={bookmark.verification.verdict.toLowerCase() as any}>
                    {bookmark.verification.verdict}
                  </GradientBadge>
                  <span className="text-sm text-muted-foreground">
                    {bookmark.verification.confidence}% confidence
                  </span>
                </div>

                <p className="font-medium mb-2">{bookmark.verification.claim}</p>
                <p className="text-sm text-muted-foreground mb-4">{bookmark.verification.reasoning}</p>

                <div className="flex flex-wrap items-center gap-2">
                  {bookmark.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeTag(bookmark.id, tag)}
                      />
                    </Badge>
                  ))}
                  <div className="flex gap-1">
                    <Input
                      placeholder="Add tag..."
                      value={newTag[bookmark.id] || ""}
                      onChange={(e) => setNewTag(prev => ({ ...prev, [bookmark.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addTag(bookmark.id)}
                      className="h-7 w-24 text-xs"
                    />
                    <Button size="sm" variant="ghost" onClick={() => addTag(bookmark.id)}>
                      <Tag className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Verified {format(new Date(bookmark.verification.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </GlassmorphicCard>
          ))}
        </div>
      )}
    </div>
  );
}
