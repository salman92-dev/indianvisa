import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ApplicationData } from "@/types/visa-application";
import { toast } from "sonner";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SecurityQuestionsTabProps {
  data: ApplicationData;
  updateData: (updates: Partial<ApplicationData>) => void;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
}

const SECURITY_QUESTIONS = [
  {
    key: "security_arrested_convicted",
    detailsKey: "security_arrested_details",
    question: "Have you ever been arrested/prosecuted/convicted by Court of Law of any country?",
    number: 1
  },
  {
    key: "security_refused_entry_deported",
    detailsKey: "security_refused_entry_details",
    question: "Have you ever been refused entry / deported by any country including India?",
    number: 2
  },
  {
    key: "security_criminal_activities",
    detailsKey: "security_criminal_details",
    question: "Have you ever been engaged in Human trafficking / Drug trafficking / Child abuse / Crime against women / Economic offense / Financial fraud?",
    number: 3
  },
  {
    key: "security_terrorist_activities",
    detailsKey: "security_terrorist_details",
    question: "Have you ever been engaged in Cyber crime / Terrorist activities / Sabotage / Espionage / Genocide / Political killing / other act of violence?",
    number: 4
  },
  {
    key: "security_terrorist_views",
    detailsKey: "security_terrorist_views_details",
    question: "Have you ever by any means or medium, expressed views that justify or glorify terrorist violence or that may encourage others to terrorist acts or other serious criminal acts?",
    number: 5
  },
  {
    key: "security_asylum_sought",
    detailsKey: "security_asylum_details",
    question: "Have you sought asylum (political or otherwise) in any country?",
    number: 6
  }
];

const SecurityQuestionsTab = ({ data, updateData, onNext, onBack, disabled }: SecurityQuestionsTabProps) => {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    // Validate that details are provided if any question is answered "Yes"
    for (const q of SECURITY_QUESTIONS) {
      const value = data[q.key as keyof ApplicationData] as boolean;
      const details = data[q.detailsKey as keyof ApplicationData] as string;
      
      if (value && (!details || details.trim() === "")) {
        toast.error(`Please provide details for question ${q.number}`);
        return;
      }
    }

    onNext();
  };

  const renderQuestion = (question: typeof SECURITY_QUESTIONS[0]) => {
    const value = data[question.key as keyof ApplicationData] as boolean;
    const details = data[question.detailsKey as keyof ApplicationData] as string || "";

    return (
      <div key={question.key} className="space-y-3 p-4 border rounded-lg">
        <div className="flex gap-2">
          <span className="font-semibold text-primary">{question.number}.</span>
          <Label className="text-sm leading-relaxed">{question.question} *</Label>
        </div>
        
        <RadioGroup
          value={value ? "yes" : "no"}
          onValueChange={(val) => updateData({ [question.key]: val === "yes" })}
          disabled={disabled}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id={`${question.key}-no`} />
            <Label htmlFor={`${question.key}-no`} className="font-normal cursor-pointer">No</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id={`${question.key}-yes`} />
            <Label htmlFor={`${question.key}-yes`} className="font-normal cursor-pointer">Yes</Label>
          </div>
        </RadioGroup>

        {value && (
          <div className="space-y-2 pt-2">
            <Label htmlFor={question.detailsKey}>Please provide details *</Label>
            <Textarea
              id={question.detailsKey}
              value={details}
              onChange={(e) => updateData({ [question.detailsKey]: e.target.value })}
              maxLength={500}
              rows={2}
              placeholder="Provide complete details"
              disabled={disabled}
              className="bg-destructive/5"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Questions</CardTitle>
        <CardDescription>
          Please answer the following questions truthfully. False information may result in visa denial or legal action.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> You must answer all questions truthfully. Providing false or misleading information 
              may result in denial of entry to India, deportation, or legal action.
            </AlertDescription>
          </Alert>

          {SECURITY_QUESTIONS.map(renderQuestion)}

          {!disabled && (
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6">
              <Button type="button" variant="outline" onClick={onBack} size="lg">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button type="submit" size="lg">
                Save & Continue
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default SecurityQuestionsTab;
