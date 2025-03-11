import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Upload, Check, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";

interface FileUploaderProps {
  bucketName: string;
  onUploadComplete?: (url: string, file: File) => void;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  folderPath?: string;
}

export default function FileUploader({
  bucketName,
  onUploadComplete,
  acceptedFileTypes = "*",
  maxSizeMB = 100,
  folderPath,
}: FileUploaderProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bucketExists, setBucketExists] = useState(true);

  useEffect(() => {
    // Check if bucket exists
    const checkBucket = async () => {
      try {
        const { data, error } = await supabase.storage.getBucket(bucketName);
        if (error) {
          console.error("Bucket does not exist:", error);
          setBucketExists(false);
        } else {
          setBucketExists(true);
        }
      } catch (err) {
        console.error("Error checking bucket:", err);
        setBucketExists(false);
      }
    };

    checkBucket();
  }, [bucketName]);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check file size
      if (file.size > maxSizeBytes) {
        setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError(null);
      setSuccess(false);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !user) return;
    if (!bucketExists) {
      setError(`Storage bucket '${bucketName}' does not exist`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(false);

    try {
      // Create a unique file path with user ID as folder
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = folderPath
        ? `${folderPath}/${fileName}`
        : `${user.id}/${fileName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Upload the file to Supabase storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      clearInterval(progressInterval);

      if (error) throw error;

      // Get the public URL for the file
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setSuccess(true);
      setProgress(100);
      setSelectedFile(null);

      // Call the callback with the URL
      if (onUploadComplete) {
        onUploadComplete(urlData.publicUrl, selectedFile);
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setError(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  if (!bucketExists) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Storage Error</AlertTitle>
        <AlertDescription>
          Storage bucket '{bucketName}' does not exist. Please create it in
          Supabase.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">Select File</Label>
        <Input
          id="file"
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          disabled={uploading}
        />
        {selectedFile && (
          <p className="text-sm text-muted-foreground">
            Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert
          variant="default"
          className="bg-green-50 border-green-200 text-green-800"
        >
          <Check className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>File uploaded successfully!</AlertDescription>
        </Alert>
      )}

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
          <p className="text-xs text-center mt-1 text-muted-foreground">
            Uploading... {progress}%
          </p>
        </div>
      )}

      <Button
        onClick={uploadFile}
        disabled={!selectedFile || uploading || !user}
        className="w-full"
      >
        <Upload className="mr-2 h-4 w-4" />
        {uploading ? "Uploading..." : "Upload File"}
      </Button>
    </div>
  );
}
