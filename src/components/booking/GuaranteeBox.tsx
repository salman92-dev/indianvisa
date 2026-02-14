import { Shield, CheckCircle, FileCheck, HeadphonesIcon, RefreshCw } from "lucide-react";

interface GuaranteeBoxProps {
  className?: string;
}

const GuaranteeBox = ({ className = "" }: GuaranteeBoxProps) => {
  const guaranteePoints = [
    { icon: FileCheck, text: "Expert document review" },
    { icon: RefreshCw, text: "Error correction before submission" },
    { icon: HeadphonesIcon, text: "Dedicated support until approval" },
  ];

  return (
    <div className={`bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-full bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Visa4Less Guarantee</h3>
      </div>
      
      <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
        "Your application is reviewed for completeness by our team before submission to government authorities."
      </p>
      
      <ul className="space-y-2">
        {guaranteePoints.map((point, index) => (
          <li key={index} className="flex items-center gap-2 text-sm">
            <point.icon className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-foreground/80">{point.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GuaranteeBox;
