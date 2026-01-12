interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="grid gap-1">
        <h1 className="font-geist text-2xl font-semibold tracking-tight text-zinc-950">{heading}</h1>
        {text && <p className="text-base text-zinc-500">{text}</p>}
      </div>
      {children}
    </div>
  );
}
