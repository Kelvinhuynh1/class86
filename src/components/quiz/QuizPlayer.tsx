import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Check, X, Brain } from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: "multiple-choice" | "open-ended";
  options?: string[];
  correct_answer: string;
  subject?: string;
  created_by: string;
}

interface QuizPlayerProps {
  questionId: string;
  onComplete: () => void;
}

export default function QuizPlayer({
  questionId,
  onComplete,
}: QuizPlayerProps) {
  const { user } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", questionId)
        .single();

      if (error) throw error;

      setQuestion(data as Question);
    } catch (err) {
      console.error("Error fetching question:", err);
      setError("Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!user || !question) return;

    try {
      if (question.type === "multiple-choice") {
        if (selectedAnswer === null) return;

        // Check if answer is correct
        const isAnswerCorrect =
          question.options?.[selectedAnswer] === question.correct_answer;
        setIsCorrect(isAnswerCorrect);

        // Save response to database
        await supabase.from("question_responses").insert([
          {
            question_id: question.id,
            user_id: user.id,
            response: question.options?.[selectedAnswer] || "",
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
              question_id: question.id,
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
              questionId: question.id,
              userAnswer: openEndedAnswer,
              correctAnswer: question.correct_answer,
            },
          });

        if (evaluationError) throw evaluationError;

        setAiEvaluation(evaluationData);
        setIsCorrect(evaluationData.score > 3); // Consider score > 3 as correct
        setShowResult(true);
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      setError("Failed to submit answer");
    } finally {
      setEvaluating(false);
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

  if (!question) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Question not found
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 border rounded-md">
      <div>
        <h2 className="text-xl font-semibold mb-2">{question.question}</h2>
        {question.subject && (
          <div className="text-sm text-muted-foreground">
            Subject: {question.subject}
          </div>
        )}
      </div>

      {question.type === "multiple-choice" && question.options && (
        <div className="space-y-4">
          <RadioGroup
            value={
              selectedAnswer !== null ? selectedAnswer.toString() : undefined
            }
            onValueChange={(value) => setSelectedAnswer(parseInt(value))}
            disabled={showResult}
          >
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 p-3 rounded border ${showResult && option === question.correct_answer ? "bg-green-50 border-green-200" : showResult && selectedAnswer === index && option !== question.correct_answer ? "bg-red-50 border-red-200" : "bg-card"}`}
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
                {showResult && option === question.correct_answer && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
                {showResult &&
                  selectedAnswer === index &&
                  option !== question.correct_answer && (
                    <X className="h-4 w-4 text-red-600" />
                  )}
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      {question.type === "open-ended" && (
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
                <p className="italic">{question.correct_answer}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center">
        {showResult ? (
          <div className="flex-1">
            {question.type === "multiple-choice" && (
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
              question.type === "multiple-choice"
                ? selectedAnswer === null
                : !openEndedAnswer.trim() || evaluating
            }
          >
            Submit Answer
          </Button>
        ) : (
          <Button onClick={onComplete}>Continue</Button>
        )}
      </div>
    </div>
  );
}
