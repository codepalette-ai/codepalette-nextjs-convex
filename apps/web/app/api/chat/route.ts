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
						content: "body { background-color: black; color: white; }",
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
