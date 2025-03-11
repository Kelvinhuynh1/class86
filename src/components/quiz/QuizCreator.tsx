import { useState } from "react";
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
import { Plus, Trash2, Save } from "lucide-react";

interface QuizCreatorProps {
  onQuizCreated: () => void;
}

export default function QuizCreator({ onQuizCreated }: QuizCreatorProps) {
  const { user } = useAuth();
  const [questionType, setQuestionType] = useState<
    "multiple-choice" | "open-ended"
  >("multiple-choice");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>([
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [correctAnswerText, setCorrectAnswerText] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddOption = () => {
    setOptions([...options, `Option ${options.length + 1}`]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return; // Minimum 2 options

    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);

    // Adjust correctAnswer if needed
    if (correctAnswer === index) {
      setCorrectAnswer(0);
    } else if (correctAnswer > index) {
      setCorrectAnswer(correctAnswer - 1);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSaveQuestion = async () => {
    if (!user) return;
    if (!question.trim()) {
      setError("Question text is required");
      return;
    }

    if (questionType === "multiple-choice") {
      if (options.some((opt) => !opt.trim())) {
        setError("All options must have content");
        return;
      }
    } else if (questionType === "open-ended" && !correctAnswerText.trim()) {
      setError("Sample correct answer is required for open-ended questions");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase
        .from("questions")
        .insert([
          {
            created_by: user.id,
            question: question,
            type: questionType,
            options: questionType === "multiple-choice" ? options : null,
            correct_answer:
              questionType === "multiple-choice"
                ? options[correctAnswer]
                : correctAnswerText,
            subject: subject || null,
          },
        ])
        .select();

      if (error) throw error;

      // Reset form
      setQuestion("");
      setOptions(["Option 1", "Option 2", "Option 3", "Option 4"]);
      setCorrectAnswer(0);
      setCorrectAnswerText("");
      setSubject("");

      // Notify parent
      onQuizCreated();
    } catch (err) {
      console.error("Error saving question:", err);
      setError("Failed to save question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-md">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Create New Question</h2>
        <Select
          value={questionType}
          onValueChange={(value) =>
            setQuestionType(value as "multiple-choice" | "open-ended")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Question Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
            <SelectItem value="open-ended">Open Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Textarea
            id="question"
            placeholder="Enter your question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject (Optional)</Label>
          <Input
            id="subject"
            placeholder="e.g. Mathematics, Science, Literature"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {questionType === "multiple-choice" ? (
          <div className="space-y-4">
            <Label>Answer Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`option-${index}`}
                  name="correct-answer"
                  checked={correctAnswer === index}
                  onChange={() => setCorrectAnswer(index)}
                  className="h-4 w-4"
                />
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveOption(index)}
                  disabled={options.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddOption}
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
            <Label htmlFor="correctAnswer">Sample Correct Answer</Label>
            <Textarea
              id="correctAnswer"
              placeholder="Enter a sample correct answer for AI evaluation..."
              value={correctAnswerText}
              onChange={(e) => setCorrectAnswerText(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This will be used by the AI to evaluate student responses.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          onClick={handleSaveQuestion}
          disabled={loading}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Question"}
        </Button>
      </div>
    </div>
  );
}
