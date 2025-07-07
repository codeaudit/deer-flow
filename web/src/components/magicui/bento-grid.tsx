import { ArrowRightIcon } from "@radix-ui/react-icons";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className: string;
  background?: ReactNode;
  Icon: React.ElementType;
  description: string;
  href: string;
  cta: string;
}

const BentoGrid = memo(({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn("grid w-full auto-rows-auto grid-cols-2 gap-4", className)}
      {...props}
    >
      {children}
    </div>
  );
});

BentoGrid.displayName = "BentoGrid";

const BentoCard = memo(({
  name,
  className,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl",
      "bg-background border border-border",
      "transition-colors duration-200",
      "hover:bg-accent/5",
      className,
    )}
    {...props}
  >
    <a
      className="z-10 flex flex-col gap-1 p-6"
      href={href}
      target="_blank"
    >
      <Icon className="h-12 w-12 text-primary transition-colors duration-200" />
      <h3 className="text-xl font-semibold text-foreground">
        {name}
      </h3>
      <p className="text-muted-foreground">{description}</p>
      <div className="mt-4">
        <Button variant="ghost" size="sm" className="group">
          {cta}
          <ArrowRightIcon className="ms-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>
      </div>
    </a>
  </div>
));

BentoCard.displayName = "BentoCard";

export { BentoCard, BentoGrid };
