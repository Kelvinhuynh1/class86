import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function LinkHandler() {
  const { encodedUrl } = useParams<{ encodedUrl: string }>();
  const navigate = useNavigate();

  // Decode the URL
  const decodedUrl = encodedUrl ? decodeURIComponent(encodedUrl) : "";

  // Add http:// prefix if missing
  const fullUrl = decodedUrl.startsWith("http")
    ? decodedUrl
    : `https://${decodedUrl}`;

  const handleProceed = () => {
    window.open(fullUrl, "_blank");
    navigate(-1); // Go back to previous page
  };

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-500">
            <AlertTriangle className="mr-2 h-5 w-5" />
            External Link Warning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This website may pose a risk:</p>
          <p className="p-2 bg-muted rounded-md break-all font-mono text-sm">
            {fullUrl}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            You are about to leave our application and visit an external
            website. We are not responsible for the content of external sites.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleProceed}>I Understand and Proceed</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
