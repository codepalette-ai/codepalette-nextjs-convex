import { env } from "@/env";

// Allow responses up to 30 seconds
export const maxDuration = 300;

const V0_API_BASE = "https://api.v0.dev/v1";

export async function POST(req: Request) {
	try {
		const { messages, chatId } = await req.json();

		// Get the last user message
		const lastMessage = messages[messages.length - 1];
		const userRequest = lastMessage?.content || "Create a React app";

		let currentChatId = chatId;

		// If no chatId provided, initialize a new chat
		if (!currentChatId) {
			const initPayload = {
				type: "files",
				name: "Quantum Apps AI",
				chatPrivacy: "private",
				files: [
					{
						name: "app/globals.css",
						content: `@import "tailwindcss";

@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
	--background: oklch(1 0 0);
	--foreground: oklch(0.145 0 0);
	--card: oklch(1 0 0);
	--card-foreground: oklch(0.145 0 0);
	--popover: oklch(1 0 0);
	--popover-foreground: oklch(0.145 0 0);
	--primary: oklch(0.205 0 0);
	--primary-foreground: oklch(0.985 0 0);
	--secondary: oklch(0.97 0 0);
	--secondary-foreground: oklch(0.205 0 0);
	--muted: oklch(0.97 0 0);
	--muted-foreground: oklch(0.556 0 0);
	--accent: oklch(0.97 0 0);
	--accent-foreground: oklch(0.205 0 0);
	--destructive: oklch(0.577 0.245 27.325);
	--destructive-foreground: oklch(0.577 0.245 27.325);
	--border: oklch(0.922 0 0);
	--input: oklch(0.922 0 0);
	--ring: oklch(0.708 0 0);
	--chart-1: oklch(0.646 0.222 41.116);
	--chart-2: oklch(0.6 0.118 184.704);
	--chart-3: oklch(0.398 0.07 227.392);
	--chart-4: oklch(0.828 0.189 84.429);
	--chart-5: oklch(0.769 0.188 70.08);
	--radius: 0.625rem;
	--sidebar: oklch(0.985 0 0);
	--sidebar-foreground: oklch(0.145 0 0);
	--sidebar-primary: oklch(0.205 0 0);
	--sidebar-primary-foreground: oklch(0.985 0 0);
	--sidebar-accent: oklch(0.97 0 0);
	--sidebar-accent-foreground: oklch(0.205 0 0);
	--sidebar-border: oklch(0.922 0 0);
	--sidebar-ring: oklch(0.708 0 0);
}

.dark {
	--background: oklch(0.145 0 0);
	--foreground: oklch(0.985 0 0);
	--card: oklch(0.145 0 0);
	--card-foreground: oklch(0.985 0 0);
	--popover: oklch(0.145 0 0);
	--popover-foreground: oklch(0.985 0 0);
	--primary: oklch(0.985 0 0);
	--primary-foreground: oklch(0.205 0 0);
	--secondary: oklch(0.269 0 0);
	--secondary-foreground: oklch(0.985 0 0);
	--muted: oklch(0.269 0 0);
	--muted-foreground: oklch(0.708 0 0);
	--accent: oklch(0.269 0 0);
	--accent-foreground: oklch(0.985 0 0);
	--destructive: oklch(0.396 0.141 25.723);
	--destructive-foreground: oklch(0.637 0.237 25.331);
	--border: oklch(0.269 0 0);
	--input: oklch(0.269 0 0);
	--ring: oklch(0.556 0 0);
	--chart-1: oklch(0.488 0.243 264.376);
	--chart-2: oklch(0.696 0.17 162.48);
	--chart-3: oklch(0.769 0.188 70.08);
	--chart-4: oklch(0.627 0.265 303.9);
	--chart-5: oklch(0.645 0.246 16.439);
	--sidebar: oklch(0.205 0 0);
	--sidebar-foreground: oklch(0.985 0 0);
	--sidebar-primary: oklch(0.488 0.243 264.376);
	--sidebar-primary-foreground: oklch(0.985 0 0);
	--sidebar-accent: oklch(0.269 0 0);
	--sidebar-accent-foreground: oklch(0.985 0 0);
	--sidebar-border: oklch(0.269 0 0);
	--sidebar-ring: oklch(0.439 0 0);
}

@theme inline {
	--color-background: var(--background);
	--color-foreground: var(--foreground);
	--color-card: var(--card);
	--color-card-foreground: var(--card-foreground);
	--color-popover: var(--popover);
	--color-popover-foreground: var(--popover-foreground);
	--color-primary: var(--primary);
	--color-primary-foreground: var(--primary-foreground);
	--color-secondary: var(--secondary);
	--color-secondary-foreground: var(--secondary-foreground);
	--color-muted: var(--muted);
	--color-muted-foreground: var(--muted-foreground);
	--color-accent: var(--accent);
	--color-accent-foreground: var(--accent-foreground);
	--color-destructive: var(--destructive);
	--color-destructive-foreground: var(--destructive-foreground);
	--color-border: var(--border);
	--color-input: var(--input);
	--color-ring: var(--ring);
	--color-chart-1: var(--chart-1);
	--color-chart-2: var(--chart-2);
	--color-chart-3: var(--chart-3);
	--color-chart-4: var(--chart-4);
	--color-chart-5: var(--chart-5);
	--radius-sm: calc(var(--radius) - 4px);
	--radius-md: calc(var(--radius) - 2px);
	--radius-lg: var(--radius);
	--radius-xl: calc(var(--radius) + 4px);
	--color-sidebar: var(--sidebar);
	--color-sidebar-foreground: var(--sidebar-foreground);
	--color-sidebar-primary: var(--sidebar-primary);
	--color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
	--color-sidebar-accent: var(--sidebar-accent);
	--color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
	--color-sidebar-border: var(--sidebar-border);
	--color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
	* {
		@apply border-border outline-ring/50;
	}
	body {
		@apply bg-background text-foreground;
	}
}
`,
					},
				],
			};

			console.log("Initializing v0 chat with payload:", initPayload);

			const initResponse = await fetch(`${V0_API_BASE}/chats/init`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.V0_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(initPayload),
			});

			if (!initResponse.ok) {
				const errorText = await initResponse.text();
				console.error("v0 API init error:", {
					status: initResponse.status,
					statusText: initResponse.statusText,
					body: errorText,
				});
				throw new Error(
					`Failed to initialize chat: ${initResponse.status} ${initResponse.statusText} - ${errorText}`,
				);
			}

			const initData = await initResponse.json();
			console.log("v0 chat initialized:", initData);
			currentChatId = initData.id;
		}

		// Send message to the chat
		const messagePayload = {
			message: userRequest,
		};

		console.log("Sending message to v0 chat:", {
			chatId: currentChatId,
			payload: messagePayload,
		});

		const messageResponse = await fetch(
			`${V0_API_BASE}/chats/${currentChatId}/messages`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${env.V0_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(messagePayload),
			},
		);

		if (!messageResponse.ok) {
			const errorText = await messageResponse.text();
			console.error("v0 API message error:", {
				status: messageResponse.status,
				statusText: messageResponse.statusText,
				body: errorText,
			});
			throw new Error(
				`Failed to send message: ${messageResponse.status} ${messageResponse.statusText} - ${errorText}`,
			);
		}

		const messageData = await messageResponse.json();
		console.log("Message sent to v0:", messageData);

		// Get the updated chat with the latest response
		const chatResponse = await fetch(`${V0_API_BASE}/chats/${currentChatId}`, {
			headers: {
				Authorization: `Bearer ${env.V0_API_KEY}`,
			},
		});

		if (!chatResponse.ok) {
			const errorText = await chatResponse.text();
			console.error("v0 API get chat error:", {
				status: chatResponse.status,
				statusText: chatResponse.statusText,
				body: errorText,
			});
			throw new Error(
				`Failed to get chat: ${chatResponse.status} ${chatResponse.statusText} - ${errorText}`,
			);
		}

		const chatData = await chatResponse.json();
		console.log("Retrieved v0 chat data:", chatData);

		return new Response(
			JSON.stringify({
				success: true,
				chatId: currentChatId,
				chat: chatData,
				demoUrl: chatData.latestVersion?.demoUrl,
				files: chatData.latestVersion?.files || [],
				webUrl: chatData.webUrl,
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Error calling v0 Platform API:", error);

		return new Response(
			JSON.stringify({
				success: false,
				error:
					"Sorry, there was an error generating the code. Please try again.",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
