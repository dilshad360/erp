import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps
  extends React.ComponentProps<typeof Button> {
  isLoading?: boolean;
  loadingText?: string;
}

export default function LoadingButton({
  children,
  isLoading = false,
  loadingText,
  disabled,
  className,
  ...props
}: LoadingButtonProps): React.JSX.Element {
  return (
    <Button
      disabled={disabled || isLoading}
      className={cn(
        "relative transition-all duration-150 disabled:opacity-60",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          <span>{loadingText ?? children}</span>
        </span>
      ) : (
        children
      )}
    </Button>
  );
}
