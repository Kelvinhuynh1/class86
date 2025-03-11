import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { PackageOpen, Trash2, Shuffle, RefreshCw } from "lucide-react";
import QuestionBundle from "@/components/quiz/QuestionBundle";
import BundlePlayer from "@/components/quiz/BundlePlayer";

export default function QuizPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isCreatingBundle, setIsCreatingBundle] = useState(false);
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [bundles, setBundles] = useState<any[]>([]);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);

  useEffect(() => {
    fetchBundles();
  }, []);

  const handleQuizCreated = () => {
    setIsCreatingBundle(false);
    fetchBundles();
  };

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("question_bundles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setBundles(data || []);
    } catch (err) {
      console.error("Error fetching bundles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizCompleted = () => {
    setSelectedBundleId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout activeTab="questions">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Question Bundles
            </h1>
            <p className="text-muted-foreground">
              Create and practice with question bundles.
            </p>
          </div>

          <div className="flex space-x-2">
            {!isCreatingBundle && !selectedBundleId && (
              <Button onClick={() => setIsCreatingBundle(true)}>
                <PackageOpen className="mr-2 h-4 w-4" /> Create Question Bundle
              </Button>
            )}
          </div>
        </div>

        {isCreatingBundle ? (
          <QuestionBundle onBundleCreated={handleQuizCreated} />
        ) : selectedBundleId ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShuffleQuestions(!shuffleQuestions)}
                className="flex items-center"
              >
                {shuffleQuestions ? (
                  <>
                    <Shuffle className="mr-2 h-4 w-4" /> Shuffle: ON
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" /> Shuffle: OFF
                  </>
                )}
              </Button>
            </div>
            <BundlePlayer
              bundleId={selectedBundleId}
              onComplete={handleQuizCompleted}
              shuffleQuestions={shuffleQuestions}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : bundles.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground border rounded-md">
                <p className="mb-4">
                  No question bundles found. Create one to get started.
                </p>
                <Button onClick={() => setIsCreatingBundle(true)}>
                  <PackageOpen className="mr-2 h-4 w-4" /> Create Question
                  Bundle
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bundles.map((bundle) => (
                  <Card
                    key={bundle.id}
                    className="overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="h-2 bg-green-500"></div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <PackageOpen className="h-5 w-5 text-green-500" />
                          <span className="text-sm font-medium">
                            Bundle ({bundle.question_count} questions)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {bundle.subject && (
                            <span className="text-xs px-2 py-1 bg-muted rounded-full">
                              {bundle.subject}
                            </span>
                          )}
                          {bundle.created_by === user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                supabase
                                  .from("question_bundles")
                                  .delete()
                                  .eq("id", bundle.id)
                                  .then(() => {
                                    setBundles(
                                      bundles.filter((b) => b.id !== bundle.id),
                                    );
                                  });
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardTitle className="mt-2 text-lg">
                        {bundle.title}
                      </CardTitle>
                      <CardDescription>
                        Created {formatDate(bundle.created_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => setSelectedBundleId(bundle.id)}
                        className="w-full"
                      >
                        Practice This Bundle
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
