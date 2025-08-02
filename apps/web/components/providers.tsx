"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";
import { env } from "@/env";

export function Providers({ children }: { children: React.ReactNode }) {
	const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);
	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
			enableColorScheme
		>
			<ClerkProvider>
				<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
					{children}
				</ConvexProviderWithClerk>
			</ClerkProvider>
		</NextThemesProvider>
	);
}
