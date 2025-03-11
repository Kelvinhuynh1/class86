import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, Trash2, Check, X, Brain, ListChecks } from "lucide-react";

export default function QuestionsPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      question: "What is the capital of France?",
      type: "multiple-choice",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2, // Paris (index 2)
      createdBy: "John Doe",
      subject: "Geography",
    },
    {
      id: "2",
      question: "Explain the process of photosynthesis.",
      type: "open-ended",
      createdBy: "Jane Smith",
      subject: "Science",
    },
    {
      id: "3",
      question: "What is the value of π (pi) to two decimal places?",
      type: "multiple-choice",
      options: ["3.12", "3.14", "3.16", "3.18"],
      correctAnswer: 1, // 3.14 (index 1)
      createdBy: "Admin",
      subject: "Mathematics",
    },
    {
      id: "4",
      question:
        'Describe the main themes in Shakespeare\'s "Romeo and Juliet".',
      type: "open-ended",
      createdBy: "Teacher",
      subject: "Literature",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [questionType, setQuestionType] = useState<
    "multiple-choice" | "open-ended"
  >("multiple-choice");
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    subject: "",
  });

  // For practice mode
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [aiEvaluation, setAiEvaluation] = useState("");

  const handleAddQuestion = () => {
    if (!newQuestion.question.trim() || !user) return;

    if (
      questionType === "multiple-choice" &&
      (newQuestion.options.some((opt) => !opt.trim()) ||
        newQuestion.options.length < 2)
    ) {
      return; // Validate options
    }

    const question: Question = {
      id: Date.now().toString(),
      question: newQuestion.question,
      type: questionType,
      createdBy: user.displayName,
      subject: newQuestion.subject || "General",
    };

    if (questionType === "multiple-choice") {
      question.options = newQuestion.options.filter((opt) => opt.trim());
      question.correctAnswer = newQuestion.correctAnswer;
    }

    setQuestions([...questions, question]);
    resetNewQuestion();
    setIsDialogOpen(false);
  };

  const resetNewQuestion = () => {
    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      subject: "",
    });
    setQuestionType("multiple-choice");
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const startPractice = () => {
    setPracticeMode(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setOpenEndedAnswer("");
    setShowResult(false);
    setAiEvaluation("");
  };

  const endPractice = () => {
    setPracticeMode(false);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  const handleSubmitAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];

    if (currentQuestion.type === "multiple-choice") {
      if (selectedAnswer === null) return;
      setShowResult(true);
    } else {
      if (!openEndedAnswer.trim()) return;
      // Simulate AI evaluation
      simulateAiEvaluation(currentQuestion.question, openEndedAnswer);
      setShowResult(true);
    }
  };

  const simulateAiEvaluation = (question: string, answer: string) => {
    // In a real app, this would call an AI service like Cohere
    setTimeout(() => {
      const randomScore = Math.floor(Math.random() * 5) + 1; // 1-5 score
      const feedback = [
        "Your answer lacks detail and doesn't address the key points.",
        "Good attempt, but you could expand on some concepts.",
        "Solid answer that covers the main points. Consider adding examples.",
        "Excellent response! Well-structured and comprehensive.",
        "Outstanding answer that demonstrates deep understanding of the topic.",
      ];

      setAiEvaluation(`Score: ${randomScore}/5. ${feedback[randomScore - 1]}`);
    }, 1000);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setOpenEndedAnswer("");
      setShowResult(false);
      setAiEvaluation("");
    } else {
      // End of questions
      endPractice();
    }
  };

  const filteredQuestions =
    activeTab === "all"
      ? questions
      : questions.filter((q) => q.type === activeTab);

  return (
    <DashboardLayout activeTab="questions">
      {!practiceMode ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Questions</h1>
              <p className="text-muted-foreground">
                Create and practice with multiple-choice and open-ended
                questions.
              </p>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={startPractice}>
                <Brain className="mr-2 h-4 w-4" /> Practice Mode
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Question</DialogTitle>
                    <DialogDescription>
                      Add a new question for practice and learning.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="multiple-choice"
                            checked={questionType === "multiple-choice"}
                            onChange={() => setQuestionType("multiple-choice")}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="multiple-choice">
                            Multiple Choice
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="open-ended"
                            checked={questionType === "open-ended"}
                            onChange={() => setQuestionType("open-ended")}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="open-ended">Open Ended</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="question">Question</Label>
                      <Textarea
                        id="question"
                        placeholder="Enter your question here..."
                        value={newQuestion.question}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            question: e.target.value,
                          })
                        }
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject (Optional)</Label>
                      <Input
                        id="subject"
                        placeholder="e.g. Mathematics, Science, Literature"
                        value={newQuestion.subject}
                        onChange={(e) =>
                          setNewQuestion({
                            ...newQuestion,
                            subject: e.target.value,
                          })
                        }
                      />
                    </div>

                    {questionType === "multiple-choice" && (
                      <div className="space-y-4">
                        <Label>Answer Options</Label>
                        {newQuestion.options.map((option, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="radio"
                              id={`option-${index}`}
                              name="correct-answer"
                              checked={newQuestion.correctAnswer === index}
                              onChange={() =>
                                setNewQuestion({
                                  ...newQuestion,
                                  correctAnswer: index,
                                })
                              }
                              className="h-4 w-4"
                            />
                            <Input
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) =>
                                handleOptionChange(index, e.target.value)
                              }
                            />
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground">
                          Select the radio button next to the correct answer.
                        </p>
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddQuestion}
                      disabled={
                        !newQuestion.question.trim() ||
                        (questionType === "multiple-choice" &&
                          newQuestion.options.filter((opt) => opt.trim())
                            .length < 2)
                      }
                    >
                      Add Question
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Questions</TabsTrigger>
              <TabsTrigger value="multiple-choice">Multiple Choice</TabsTrigger>
              <TabsTrigger value="open-ended">Open Ended</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {filteredQuestions.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  No questions found. Create one to get started.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredQuestions.map((question) => (
                    <Card key={question.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  question.type === "multiple-choice"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {question.type === "multiple-choice"
                                  ? "Multiple Choice"
                                  : "Open Ended"}
                              </span>
                              {question.subject && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {question.subject}
                                </span>
                              )}
                            </div>
                            <CardTitle className="text-lg mt-2">
                              {question.question}
                            </CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription>
                          Created by {question.createdBy}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {question.type === "multiple-choice" &&
                          question.options && (
                            <div className="space-y-2">
                              {question.options.map((option, index) => (
                                <div
                                  key={index}
                                  className={`flex items-center p-2 rounded ${index === question.correctAnswer ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}
                                >
                                  <div className="h-4 w-4 mr-2 flex items-center justify-center">
                                    {index === question.correctAnswer && (
                                      <Check className="h-3 w-3 text-green-600" />
                                    )}
                                  </div>
                                  <span>{option}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        {question.type === "open-ended" && (
                          <div className="italic text-muted-foreground">
                            Open-ended question (AI-evaluated)
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Practice Mode
              </h1>
              <p className="text-muted-foreground">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            <Button variant="outline" onClick={endPractice}>
              Exit Practice
            </Button>
          </div>

          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    questions[currentQuestionIndex].type === "multiple-choice"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {questions[currentQuestionIndex].type === "multiple-choice"
                    ? "Multiple Choice"
                    : "Open Ended"}
                </span>
                {questions[currentQuestionIndex].subject && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {questions[currentQuestionIndex].subject}
                  </span>
                )}
              </div>
              <CardTitle className="text-xl mt-2">
                {questions[currentQuestionIndex].question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {questions[currentQuestionIndex].type === "multiple-choice" &&
                questions[currentQuestionIndex].options && (
                  <RadioGroup
                    value={
                      selectedAnswer !== null
                        ? selectedAnswer.toString()
                        : undefined
                    }
                    onValueChange={(value) =>
                      setSelectedAnswer(parseInt(value))
                    }
                    disabled={showResult}
                    className="space-y-3"
                  >
                    {questions[currentQuestionIndex].options.map(
                      (option, index) => (
                        <div
                          key={index}
                          className={`flex items-center space-x-2 p-3 rounded border ${showResult && index === questions[currentQuestionIndex].correctAnswer ? "bg-green-50 border-green-200" : showResult && selectedAnswer === index && index !== questions[currentQuestionIndex].correctAnswer ? "bg-red-50 border-red-200" : "bg-card"}`}
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
                            index ===
                              questions[currentQuestionIndex].correctAnswer && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          {showResult &&
                            selectedAnswer === index &&
                            index !==
                              questions[currentQuestionIndex].correctAnswer && (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                      ),
                    )}
                  </RadioGroup>
                )}

              {questions[currentQuestionIndex].type === "open-ended" && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your answer here..."
                    value={openEndedAnswer}
                    onChange={(e) => setOpenEndedAnswer(e.target.value)}
                    disabled={showResult}
                    rows={6}
                    className="w-full"
                  />

                  {showResult && (
                    <div className="p-4 bg-blue-50 rounded border border-blue-200">
                      <h3 className="font-medium mb-2 flex items-center">
                        <Brain className="h-4 w-4 mr-2" /> AI Evaluation
                      </h3>
                      {aiEvaluation ? (
                        <p>{aiEvaluation}</p>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Evaluating your answer...</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                {showResult &&
                  questions[currentQuestionIndex].type ===
                    "multiple-choice" && (
                    <div className="text-sm">
                      {selectedAnswer ===
                      questions[currentQuestionIndex].correctAnswer ? (
                        <span className="text-green-600 font-medium">
                          Correct!
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          Incorrect
                        </span>
                      )}
                    </div>
                  )}
              </div>
              <div className="space-x-2">
                {!showResult ? (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={
                      questions[currentQuestionIndex].type === "multiple-choice"
                        ? selectedAnswer === null
                        : !openEndedAnswer.trim()
                    }
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button onClick={nextQuestion}>
                    {currentQuestionIndex < questions.length - 1
                      ? "Next Question"
                      : "Finish"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
