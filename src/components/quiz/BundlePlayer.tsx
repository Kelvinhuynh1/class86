import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Check, X, Brain, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  question: string;
  type: "multiple-choice" | "open-ended";
  options?: string[];
  correct_answer: string;
  subject?: string;
  created_by: string;
}

interface BundlePlayerProps {
  bundleId: string;
  onComplete: () => void;
}

export default function BundlePlayer({
  bundleId,
  onComplete,
  shuffleQuestions = true,
}: BundlePlayerProps & { shuffleQuestions?: boolean }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState(0);
  const [bundleTitle, setBundleTitle] = useState("");

  useEffect(() => {
    fetchBundle();
  }, [bundleId]);

  const fetchBundle = async () => {
    setLoading(true);
    try {
      // First get the bundle info
      const { data: bundleData, error: bundleError } = await supabase
        .from("question_bundles")
        .select("*")
        .eq("id", bundleId)
        .single();

      if (bundleError) throw bundleError;

      setBundleTitle(bundleData.title);

      // Then get all questions in this bundle
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("bundle_id", bundleId)
        .order("order_index", { ascending: true });

      if (questionsError) throw questionsError;

      if (!questionsData || questionsData.length === 0) {
        throw new Error("No questions found in this bundle");
      }

      // Shuffle the questions for practice if enabled
      const finalQuestions = shuffleQuestions
        ? shuffleQuestionsArray(questionsData)
        : questionsData;
      setQuestions(finalQuestions);
    } catch (err) {
      console.error("Error fetching bundle:", err);
      setError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  // Shuffle the questions for practice
  const shuffleQuestionsArray = (questions: Question[]) => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleSubmitAnswer = async () => {
    if (!user || !questions[currentQuestionIndex]) return;

    const currentQuestion = questions[currentQuestionIndex];

    try {
      if (currentQuestion.type === "multiple-choice") {
        if (selectedAnswer === null) return;

        // Check if answer is correct
        const isAnswerCorrect =
          currentQuestion.options?.[selectedAnswer] ===
          currentQuestion.correct_answer;
        setIsCorrect(isAnswerCorrect);

        // Update score
        if (isAnswerCorrect) {
          setScore(score + 1);
        }

        // Save response to database
        await supabase.from("question_responses").insert([
          {
            question_id: currentQuestion.id,
            user_id: user.id,
            response: currentQuestion.options?.[selectedAnswer] || "",
            score: isAnswerCorrect ? 1 : 0,
          },
        ]);

        setShowResult(true);
      } else {
        // Open-ended question
        if (!openEndedAnswer.trim()) return;

        setEvaluating(true);

        // First save the response
        const { data: responseData, error: responseError } = await supabase
          .from("question_responses")
          .insert([
            {
              question_id: currentQuestion.id,
              user_id: user.id,
              response: openEndedAnswer,
            },
          ])
          .select();

        if (responseError) throw responseError;

        // Call Supabase Edge Function to evaluate the answer
        const { data: evaluationData, error: evaluationError } =
          await supabase.functions.invoke("evaluate-answer", {
            body: {
              questionId: currentQuestion.id,
              userAnswer: openEndedAnswer,
              correctAnswer: currentQuestion.correct_answer,
            },
          });

        if (evaluationError) throw evaluationError;

        setAiEvaluation(evaluationData);
        const answerScore = evaluationData.score > 3 ? 1 : 0; // Consider score > 3 as correct
        setIsCorrect(answerScore === 1);
        setScore(score + answerScore);
        setShowResult(true);
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Failed to submit answer");
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setOpenEndedAnswer("");
      setShowResult(false);
      setAiEvaluation(null);
    } else {
      // Bundle completed
      onComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-destructive">{error}</div>;
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No questions found in this bundle
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{bundleTitle}</h2>
        <div className="text-sm text-muted-foreground">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="p-4 border rounded-md space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {currentQuestion.question}
          </h2>
          {currentQuestion.subject && (
            <div className="text-sm text-muted-foreground">
              Subject: {currentQuestion.subject}
            </div>
          )}
        </div>

        {currentQuestion.type === "multiple-choice" &&
          currentQuestion.options && (
            <div className="space-y-4">
              <RadioGroup
                value={
                  selectedAnswer !== null
                    ? selectedAnswer.toString()
                    : undefined
                }
                onValueChange={(value) => setSelectedAnswer(parseInt(value))}
                disabled={showResult}
              >
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center space-x-2 p-3 rounded border ${showResult && option === currentQuestion.correct_answer ? "bg-green-50 border-green-200" : showResult && selectedAnswer === index && option !== currentQuestion.correct_answer ? "bg-red-50 border-red-200" : "bg-card"}`}
                  >
                    <RadioGroupItem
                      value={index.toString()}
                      id={`option-${index}`}
                    />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                    {showResult &&
                      option === currentQuestion.correct_answer && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    {showResult &&
                      selectedAnswer === index &&
                      option !== currentQuestion.correct_answer && (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

        {currentQuestion.type === "open-ended" && (
          <div className="space-y-4">
            <Textarea
              placeholder="Type your answer here..."
              value={openEndedAnswer}
              onChange={(e) => setOpenEndedAnswer(e.target.value)}
              disabled={showResult || evaluating}
              rows={6}
              className="w-full"
            />

            {evaluating && (
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>AI is evaluating your answer...</span>
                </div>
              </div>
            )}

            {showResult && aiEvaluation && (
              <div className="p-4 bg-blue-50 rounded border border-blue-200">
                <h3 className="font-medium mb-2 flex items-center">
                  <Brain className="h-4 w-4 mr-2" /> AI Evaluation
                </h3>
                <div className="mb-2">
                  <div className="font-medium">
                    Score: {aiEvaluation.score.toFixed(1)}/5
                  </div>
                  <p>{aiEvaluation.feedback}</p>
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  <p>Sample correct answer:</p>
                  <p className="italic">{currentQuestion.correct_answer}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center">
          {showResult ? (
            <div className="flex-1">
              {currentQuestion.type === "multiple-choice" && (
                <div
                  className={
                    isCorrect
                      ? "text-green-600 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {isCorrect ? "Correct!" : "Incorrect"}
                </div>
              )}
            </div>
          ) : (
            <div></div>
          )}

          {!showResult ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={
                currentQuestion.type === "multiple-choice"
                  ? selectedAnswer === null
                  : !openEndedAnswer.trim() || evaluating
              }
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>
              {currentQuestionIndex < questions.length - 1 ? (
                <>
                  Next Question <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "Finish Bundle"
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="p-4 border rounded-md bg-muted/20">
        <div className="flex justify-between items-center">
          <div className="font-medium">Current Score:</div>
          <div className="font-bold">
            {score} / {currentQuestionIndex + (showResult ? 1 : 0)} correct
          </div>
        </div>
      </div>
    </div>
  );
}
