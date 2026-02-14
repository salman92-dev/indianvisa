import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useRef, DragEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, FileCheck, Send, Image, FileText, ChevronLeft, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UploadsTabProps {
  applicationId?: string;
  onNext: () => void;
  onBack: () => void;
  isLastStep?: boolean;
  submitting?: boolean;
  disabled?: boolean;
  isFormComplete?: boolean;
  missingItems?: string[];
  onDocumentUploaded?: (type: "photo" | "passport", uploaded: boolean) => void;
  declarationAccepted?: boolean;
  onDeclarationChange?: (accepted: boolean) => void;
}

interface UploadedFile {
  name: string;
  type: string;
  url?: string;
  previewUrl?: string;
}

const UploadsTab = ({ 
  applicationId, 
  onNext, 
  onBack, 
  isLastStep, 
  submitting, 
  disabled,
  isFormComplete,
  missingItems = [],
  onDocumentUploaded,
  declarationAccepted,
  onDeclarationChange
}: UploadsTabProps) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<UploadedFile | null>(null);
  const [passportFile, setPassportFile] = useState<UploadedFile | null>(null);
  const [additionalFile, setAdditionalFile] = useState<UploadedFile | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const passportInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (photoFile?.previewUrl) URL.revokeObjectURL(photoFile.previewUrl);
      if (passportFile?.previewUrl) URL.revokeObjectURL(passportFile.previewUrl);
      if (additionalFile?.previewUrl) URL.revokeObjectURL(additionalFile.previewUrl);
    };
  }, []);

  // Load existing documents on mount
  useEffect(() => {
    if (applicationId) {
      loadExistingDocuments();
    }
  }, [applicationId]);

  const loadExistingDocuments = async () => {
    if (!applicationId) return;

    try {
      const { data: docs, error } = await supabase
        .from("application_documents")
        .select("*")
        .eq("application_id", applicationId);

      if (error) throw error;

      if (docs && docs.length > 0) {
        for (const doc of docs) {
          // Generate signed URL for preview (valid for 1 hour)
          let previewUrl: string | undefined;
          if (doc.mime_type.startsWith("image/")) {
            const { data: signedData } = await supabase.storage
              .from("visa-documents")
              .createSignedUrl(doc.file_path, 3600);
            previewUrl = signedData?.signedUrl;
          }

          const file = { 
            name: doc.file_name, 
            type: doc.mime_type,
            previewUrl 
          };
          
          if (doc.document_type === "photo") {
            setPhotoFile(file);
            onDocumentUploaded?.("photo", true);
          }
          if (doc.document_type === "passport") {
            setPassportFile(file);
            onDocumentUploaded?.("passport", true);
          }
          if (doc.document_type === "other") {
            setAdditionalFile(file);
          }
        }
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  const handleFileUpload = async (file: File, documentType: "photo" | "passport" | "other") => {
    if (!applicationId) {
      toast.error("Please save the application first by completing previous steps");
      return;
    }

    // Client-side pre-validation for better UX
    const maxSize = documentType === "photo" ? 1024 * 1024 : 2048 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    const allowedTypes = documentType === "photo" 
      ? ["image/jpeg", "image/jpg"]
      : documentType === "passport"
      ? ["application/pdf"]
      : ["application/pdf", "image/jpeg", "image/jpg"];
    
    if (!allowedTypes.includes(file.type)) {
      const typeNames = documentType === "photo" ? "JPEG" : documentType === "passport" ? "PDF" : "PDF or JPEG";
      toast.error(`Please upload a ${typeNames} file`);
      return;
    }

    // Create preview URL for images
    let previewUrl: string | undefined;
    if (file.type.startsWith("image/")) {
      previewUrl = URL.createObjectURL(file);
    }

    setUploading(documentType);
    try {
      // Get the session for auth token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("Please log in to upload documents");
        return;
      }

      // Use server-side validation edge function with explicit auth header
      const formData = new FormData();
      formData.append('file', file);
      formData.append('application_id', applicationId);
      formData.append('document_type', documentType);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/visa-document-upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.error) {
        throw new Error(data.error);
      }

      const uploadedFile = { name: file.name, type: file.type, previewUrl };
      
      if (documentType === "photo") {
        // Cleanup old preview URL
        if (photoFile?.previewUrl) URL.revokeObjectURL(photoFile.previewUrl);
        setPhotoFile(uploadedFile);
        onDocumentUploaded?.("photo", true);
      }
      if (documentType === "passport") {
        if (passportFile?.previewUrl) URL.revokeObjectURL(passportFile.previewUrl);
        setPassportFile(uploadedFile);
        onDocumentUploaded?.("passport", true);
      }
      if (documentType === "other") {
        if (additionalFile?.previewUrl) URL.revokeObjectURL(additionalFile.previewUrl);
        setAdditionalFile(uploadedFile);
      }

      toast.success(`${documentType === "photo" ? "Photo" : documentType === "passport" ? "Passport scan" : "Document"} uploaded successfully`);
    } catch (error: any) {
      console.error("Upload error:", error);
      // Cleanup preview URL on error
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      toast.error(`Failed to upload: ${error.message || "Please try again"}`);
    } finally {
      setUploading(null);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(type);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, documentType: "photo" | "passport" | "other") => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0], documentType);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (disabled) return;

    if (!photoFile || !passportFile) {
      toast.error("Please upload both photo and passport scan");
      return;
    }

    onNext();
  };

  const canSubmit = photoFile && passportFile && isFormComplete && declarationAccepted && !disabled;

  const DropZone = ({
    type, 
    accept, 
    inputRef, 
    icon: Icon, 
    title, 
    subtitle,
    uploadedFile,
    children 
  }: { 
    type: "photo" | "passport" | "other";
    accept: string;
    inputRef: React.RefObject<HTMLInputElement>;
    icon: typeof Image;
    title: string;
    subtitle: string;
    uploadedFile: UploadedFile | null;
    children?: React.ReactNode;
  }) => (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex-1">
          <Label className="text-base font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </Label>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>
        {uploadedFile && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
            <FileCheck className="h-4 w-4" />
            <span className="text-sm truncate max-w-[150px]">{uploadedFile.name}</span>
          </div>
        )}
      </div>
      
      {!disabled && (
        <div
          onDragOver={(e) => handleDragOver(e, type)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, type)}
          onClick={() => inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all duration-200
            ${dragOver === type 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }
            ${uploading === type ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, type);
              e.target.value = '';
            }}
            disabled={uploading !== null}
            className="hidden"
          />
          
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {uploading === type ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {dragOver === type ? 'Drop file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {children}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
        <CardDescription>Please upload required documents to complete your application</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <DropZone
            type="photo"
            accept="image/jpeg,image/jpg"
            inputRef={photoInputRef as React.RefObject<HTMLInputElement>}
            icon={Image}
            title="Passport-style Photo *"
            subtitle="JPEG only, max 1MB"
            uploadedFile={photoFile}
          >
            {/* Photo Preview with actual thumbnail */}
            {photoFile && (
              <div className="mt-2 p-3 bg-muted rounded-lg flex items-center gap-4">
                <div className="h-20 w-20 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden border border-border">
                  {photoFile.previewUrl ? (
                    <img 
                      src={photoFile.previewUrl} 
                      alt="Passport photo preview" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{photoFile.name}</p>
                  <p className="text-xs text-muted-foreground">Passport Photo</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <FileCheck className="h-3 w-3" />
                    Uploaded successfully
                  </p>
                </div>
              </div>
            )}
          </DropZone>

          {/* Passport Upload */}
          <DropZone
            type="passport"
            accept="application/pdf"
            inputRef={passportInputRef as React.RefObject<HTMLInputElement>}
            icon={FileText}
            title="Passport Scan *"
            subtitle="PDF only, max 2MB"
            uploadedFile={passportFile}
          >
            {/* Passport Preview */}
            {passportFile && (
              <div className="mt-2 p-3 bg-muted rounded-lg flex items-center gap-4">
                <div className="h-20 w-20 bg-primary/10 rounded-lg flex items-center justify-center border border-border">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{passportFile.name}</p>
                  <p className="text-xs text-muted-foreground">Passport Scan (PDF)</p>
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <FileCheck className="h-3 w-3" />
                    Uploaded successfully
                  </p>
                </div>
              </div>
            )}
          </DropZone>

          {/* Additional Documents */}
          {!disabled && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex-1">
                <Label className="text-base font-medium">Additional Documents (Optional)</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload supporting documents if applicable to your visa type
                </p>
              </div>
              
              <div
                onDragOver={(e) => handleDragOver(e, "other")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "other")}
                onClick={() => additionalInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all duration-200
                  ${dragOver === "other" 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                  }
                  ${uploading === "other" ? 'pointer-events-none opacity-60' : ''}
                `}
              >
                <input
                  ref={additionalInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "other");
                    e.target.value = '';
                  }}
                  disabled={uploading !== null}
                  className="hidden"
                />
                
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  {uploading === "other" ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {dragOver === "other" ? 'Drop file here' : 'Drag & drop or click (PDF/JPEG, max 2MB)'}
                  </p>
                </div>
              </div>

              {additionalFile && (
                <div className="flex items-center gap-3 text-sm p-2 bg-background rounded border">
                  {additionalFile.previewUrl ? (
                    <img 
                      src={additionalFile.previewUrl} 
                      alt="Additional document preview" 
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <FileText className="h-5 w-5 text-primary" />
                  )}
                  <span className="truncate flex-1">{additionalFile.name}</span>
                  <FileCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                </div>
              )}
            </div>
          )}

          {/* Declaration Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Declaration:</strong> I hereby declare that the information furnished in this application is true and correct to the best of my knowledge and belief. I understand that furnishing false information is a punishable offence under Indian Law.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="declaration"
                checked={declarationAccepted}
                onCheckedChange={(checked) => onDeclarationChange?.(!!checked)}
                disabled={disabled}
              />
              <Label htmlFor="declaration" className="cursor-pointer text-sm leading-relaxed">
                I have read and understood the above declaration. I confirm that all information provided is accurate and complete, and I accept full responsibility for any false or misleading information. *
              </Label>
            </div>
          </div>

          {/* Missing Fields Alert */}
          {!disabled && !canSubmit && missingItems.length > 0 && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Please complete all required fields before submitting:</strong>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {missingItems.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="text-destructive-foreground">{item}</li>
                  ))}
                  {missingItems.length > 5 && (
                    <li className="text-destructive-foreground">...and {missingItems.length - 5} more items</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {!disabled && (
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onBack} size="lg">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button 
                        type="submit" 
                        disabled={!canSubmit || submitting}
                        size="lg"
                        className="w-full sm:w-auto"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!canSubmit && !submitting && (
                    <TooltipContent>
                      <p>{!declarationAccepted ? "Please accept the declaration" : "Complete all required fields and upload documents to submit"}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadsTab;
