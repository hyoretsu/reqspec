import { Logo, ThemeToggle } from "@/components/ui";
import { WorkspaceSwitcher } from "@/components/layout/AppShell/WorkspaceSwitcher";
import { EnvSelector } from "@/components/environments/EnvironmentManager/EnvSelector";

export function TopBar() {
	return (
		<header className="flex items-center gap-3 border-b border-border bg-surface px-3 py-2">
			<span className="flex items-center gap-2">
				<Logo className="h-6 w-6 text-primary" />
				<span className="text-sm font-bold tracking-tight text-fg">ReqSpec</span>
			</span>
			<div className="hidden md:block">
				<WorkspaceSwitcher />
			</div>
			<div className="ml-auto hidden w-72 md:block">
				<EnvSelector />
			</div>
			<ThemeToggle />
		</header>
	);
}
