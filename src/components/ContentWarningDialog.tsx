import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface ContentWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warnings: string[];
  mangaTitle: string;
}

export const ContentWarningDialog = ({
  open,
  onOpenChange,
  warnings,
  mangaTitle,
}: ContentWarningDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-6 h-6" />
            <AlertDialogTitle>Content Warning</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p className="font-medium text-foreground">
              "{mangaTitle}" contains the following content that may be disturbing to some readers:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning) => (
                <li key={warning} className="text-foreground">{warning}</li>
              ))}
            </ul>
            <p className="text-muted-foreground">
              Reader discretion is advised. Do you wish to continue?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Go Back</AlertDialogCancel>
          <AlertDialogAction onClick={() => onOpenChange(false)}>I Understand, Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};