import { env } from "@/env";

const V0_API_BASE = "https://api.v0.dev/v1";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const chatId = searchParams.get('chatId');

		if (!chatId) {
			return new Response(
				JSON.stringify({
					success: false,
					error: "Chat ID is required",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Get the updated chat from v0
		const chatResponse = await fetch(`${V0_API_BASE}/chats/${chatId}`, {
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
			return new Response(
				JSON.stringify({
					success: false,
					error: "Failed to fetch chat data",
				}),
				{
					status: chatResponse.status,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const chatData = await chatResponse.json();
		
		// Determine progress based on chat state and latest version status
		let progressUpdate = "";
		const latestVersion = chatData.latestVersion;
		
		if (latestVersion?.status === "completed" && latestVersion?.demoUrl) {
			progressUpdate = "App generated successfully!";
		} else if (latestVersion?.status === "completed" && latestVersion?.files && latestVersion.files.length > 0) {
			progressUpdate = "Code generated, preparing preview...";
		} else if (latestVersion?.status === "pending") {
			progressUpdate = "v0 is generating your app...";
		} else if (latestVersion?.status === "failed") {
			progressUpdate = "Generation failed, please try again";
		} else {
			// Check if there are new messages from v0
			const assistantMessages = chatData.messages?.filter((msg: any) => msg.role === "assistant") || [];
			if (assistantMessages.length > 0) {
				progressUpdate = "v0 is working on your request...";
			} else {
				progressUpdate = "v0 is analyzing your request...";
			}
		}

		return new Response(
			JSON.stringify({
				success: true,
				chat: chatData,
				messages: chatData.messages || [],
				latestVersion: chatData.latestVersion,
				progressUpdate: latestVersion?.demoUrl ? "" : progressUpdate,
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("Error polling v0 chat:", error);

		return new Response(
			JSON.stringify({
				success: false,
				error: "Internal server error",
				details: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
