import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Save, MoveUp, MoveDown, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Question {
  question: string;
  type: "multiple-choice" | "open-ended";
  options?: string[];
  correctAnswer: number | string;
  subject?: string;
}

interface QuestionBundleProps {
  onBundleCreated: () => void;
}

export default function QuestionBundle({
  onBundleCreated,
}: QuestionBundleProps) {
  const { user } = useAuth();
  const [bundleTitle, setBundleTitle] = useState("New Question Bundle");
  const [bundleSubject, setBundleSubject] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    {
      question: "",
      type: "multiple-choice",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: 0,
      subject: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "multiple-choice",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: 0,
        subject: bundleSubject,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const duplicateQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, { ...questions[index] });
    setQuestions(newQuestions);
  };

  const moveQuestionUp = (index: number) => {
    if (index === 0) return;
    const newQuestions = [...questions];
    [newQuestions[index - 1], newQuestions[index]] = [
      newQuestions[index],
      newQuestions[index - 1],
    ];
    setQuestions(newQuestions);
  };

  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return;
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[index + 1]] = [
      newQuestions[index + 1],
      newQuestions[index],
    ];
    setQuestions(newQuestions);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateQuestionType = (
    index: number,
    type: "multiple-choice" | "open-ended",
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      type,
      correctAnswer: type === "multiple-choice" ? 0 : "",
    };
    setQuestions(newQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string,
  ) => {
    const newQuestions = [...questions];
    if (!newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options = [];
    }
    newQuestions[questionIndex].options![optionIndex] = value;
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    if (!newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options = [];
    }
    newQuestions[questionIndex].options!.push(
      `Option ${newQuestions[questionIndex].options!.length + 1}`,
    );
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    if (
      newQuestions[questionIndex].options &&
      newQuestions[questionIndex].options!.length > 2
    ) {
      newQuestions[questionIndex].options!.splice(optionIndex, 1);
      // Adjust correctAnswer if needed
      if (typeof newQuestions[questionIndex].correctAnswer === "number") {
        if (newQuestions[questionIndex].correctAnswer === optionIndex) {
          newQuestions[questionIndex].correctAnswer = 0;
        } else if (newQuestions[questionIndex].correctAnswer > optionIndex) {
          newQuestions[questionIndex].correctAnswer =
            (newQuestions[questionIndex].correctAnswer as number) - 1;
        }
      }
    }
    setQuestions(newQuestions);
  };

  const handleSaveBundle = async () => {
    if (!user) return;
    if (questions.some((q) => !q.question.trim())) {
      setError("All questions must have content");
      return;
    }

    if (
      questions.some(
        (q) =>
          q.type === "multiple-choice" && q.options?.some((opt) => !opt.trim()),
      )
    ) {
      setError("All multiple-choice options must have content");
      return;
    }

    if (questions.some((q) => q.type === "open-ended" && !q.correctAnswer)) {
      setError("All open-ended questions must have a sample answer");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create a bundle record first
      const { data: bundleData, error: bundleError } = await supabase
        .from("question_bundles")
        .insert([
          {
            title: bundleTitle,
            subject: bundleSubject || null,
            created_by: user.id,
            question_count: questions.length,
          },
        ])
        .select();

      if (bundleError) throw bundleError;

      if (!bundleData || bundleData.length === 0) {
        throw new Error("Failed to create question bundle");
      }

      const bundleId = bundleData[0].id;

      // Insert all questions with the bundle ID
      const questionsToInsert = questions.map((q, index) => ({
        bundle_id: bundleId,
        question: q.question,
        type: q.type,
        options: q.type === "multiple-choice" ? q.options : null,
        correct_answer:
          q.type === "multiple-choice"
            ? q.options?.[q.correctAnswer as number]
            : q.correctAnswer,
        subject: q.subject || bundleSubject || null,
        order_index: index,
        created_by: user.id,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      // Success - reset form and notify parent
      onBundleCreated();
    } catch (err) {
      console.error("Error saving question bundle:", err);
      setError("Failed to save question bundle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Add this function to shuffle the questions when practicing the bundle
  const shuffleQuestions = (questions: Question[]) => {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Create Question Bundle</h2>
        <Button onClick={handleSaveBundle} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Bundle"}
        </Button>
      </div>

      <div className="space-y-4 p-4 border rounded-md">
        <div className="space-y-2">
          <Label htmlFor="bundleTitle">Bundle Title</Label>
          <Input
            id="bundleTitle"
            value={bundleTitle}
            onChange={(e) => setBundleTitle(e.target.value)}
            placeholder="Enter a title for this question bundle"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bundleSubject">Subject (Optional)</Label>
          <Input
            id="bundleSubject"
            value={bundleSubject}
            onChange={(e) => setBundleSubject(e.target.value)}
            placeholder="e.g. Mathematics, Science, Literature"
          />
        </div>
      </div>

      {questions.map((question, questionIndex) => (
        <Card key={questionIndex} className="border-primary/20">
          <CardHeader className="pb-2 flex flex-row justify-between items-start">
            <CardTitle className="text-lg">
              Question {questionIndex + 1}
            </CardTitle>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => moveQuestionUp(questionIndex)}
                disabled={questionIndex === 0}
              >
                <MoveUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => moveQuestionDown(questionIndex)}
                disabled={questionIndex === questions.length - 1}
              >
                <MoveDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => duplicateQuestion(questionIndex)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => removeQuestion(questionIndex)}
                disabled={questions.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select
                value={question.type}
                onValueChange={(value) =>
                  updateQuestionType(
                    questionIndex,
                    value as "multiple-choice" | "open-ended",
                  )
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Question Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple-choice">
                    Multiple Choice
                  </SelectItem>
                  <SelectItem value="open-ended">Open Ended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`question-${questionIndex}`}>Question</Label>
              <Textarea
                id={`question-${questionIndex}`}
                placeholder="Enter your question here..."
                value={question.question}
                onChange={(e) =>
                  updateQuestion(questionIndex, "question", e.target.value)
                }
                rows={2}
              />
            </div>

            {question.type === "multiple-choice" ? (
              <div className="space-y-4">
                <Label>Answer Options</Label>
                {question.options?.map((option, optionIndex) => (
                  <div
                    key={optionIndex}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="radio"
                      id={`question-${questionIndex}-option-${optionIndex}`}
                      name={`question-${questionIndex}-correct-answer`}
                      checked={question.correctAnswer === optionIndex}
                      onChange={() =>
                        updateQuestion(
                          questionIndex,
                          "correctAnswer",
                          optionIndex,
                        )
                      }
                      className="h-4 w-4"
                    />
                    <Input
                      placeholder={`Option ${optionIndex + 1}`}
                      value={option}
                      onChange={(e) =>
                        updateOption(questionIndex, optionIndex, e.target.value)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(questionIndex, optionIndex)}
                      disabled={(question.options?.length || 0) <= 2}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(questionIndex)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Option
                </Button>
                <p className="text-xs text-muted-foreground">
                  Select the radio button next to the correct answer.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor={`correctAnswer-${questionIndex}`}>
                  Sample Correct Answer
                </Label>
                <Textarea
                  id={`correctAnswer-${questionIndex}`}
                  placeholder="Enter a sample correct answer for AI evaluation..."
                  value={question.correctAnswer as string}
                  onChange={(e) =>
                    updateQuestion(
                      questionIndex,
                      "correctAnswer",
                      e.target.value,
                    )
                  }
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used by the AI to evaluate student responses.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button onClick={addQuestion} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Add Another Question
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={handleSaveBundle} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Question Bundle"}
        </Button>
      </div>
    </div>
  );
}
