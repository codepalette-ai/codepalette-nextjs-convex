"use client";

import { Badge } from "@workspace/design-system/components/badge";
import { Button } from "@workspace/design-system/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/design-system/components/card";
import { Input } from "@workspace/design-system/components/input";
import { ScrollArea } from "@workspace/design-system/components/scroll-area";
import {
	Code,
	Download,
	ExternalLink,
	Paperclip,
	Play,
	Send,
} from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: Date;
	isV0Message?: boolean; // Flag to distinguish v0 messages from our local messages
}

interface V0File {
	name: string;
	content: string;
	lang: string;
	meta?: unknown;
}

interface V0Chat {
	id: string;
	name: string;
	webUrl: string;
	demoUrl?: string;
	files?: V0File[];
	latestVersion?: {
		demoUrl?: string;
		files?: V0File[];
	};
}

export function V0Chatbot() {
	const [attachedImages, setAttachedImages] = useState<File[]>([]);
	const [currentChat, setCurrentChat] = useState<V0Chat | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [chatId, setChatId] = useState<string | null>(null);
	const [pollingProgress, setPollingProgress] = useState<string>("");
	const [isPolling, setIsPolling] = useState(false);
	const [iframeError, setIframeError] = useState(false);
	const [iframeLoading, setIframeLoading] = useState(true);
	const [iframeKey, setIframeKey] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Function to manually stop polling
	const stopPolling = () => {
		setIsPolling(false);
		setPollingProgress("");
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
	};

	const handleImageAttachment = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = Array.from(event.target.files || []);
		setAttachedImages((prev) => [...prev, ...files]);
	};

	const removeImage = (index: number) => {
		setAttachedImages((prev) => prev.filter((_, i) => i !== index));
	};

	// Polling function to check for v0 updates
	const pollChatUpdates = useCallback(async (currentChatId: string) => {
		try {
			const response = await fetch(`/api/chat/poll?chatId=${currentChatId}`);
			if (!response.ok) return;

			const data = await response.json();
			if (data.success && data.chat) {
				const updatedChat = data.chat;
				
				// Process v0 messages and merge with local messages
				if (data.messages && Array.isArray(data.messages)) {
					const v0Messages: Message[] = data.messages
						.filter((msg: any) => msg.role === "assistant")
						.filter((msg: any) => !msg.content.includes('<CodeProject id="codepaletteainextjsstarterkit">'))
						.map((msg: any) => ({
							id: msg.id,
							role: "assistant" as const,
							content: msg.content,
							createdAt: new Date(msg.createdAt),
							isV0Message: true,
						}));

					// Merge v0 messages with existing messages, avoiding duplicates
					setMessages(prevMessages => {
						const existingIds = new Set(prevMessages.map(m => m.id));
						const newV0Messages = v0Messages.filter(msg => !existingIds.has(msg.id));
						
						if (newV0Messages.length > 0) {
							// Remove any non-v0 assistant messages and add v0 messages
							const filteredMessages = prevMessages.filter(m => 
								m.role === "user" || !m.isV0Message
							);
							return [...filteredMessages, ...v0Messages].sort(
								(a, b) => a.createdAt.getTime() - b.createdAt.getTime()
							);
						}
						return prevMessages;
					});
				}
				
				// Always update the chat state with latest version info
				const hasNewDemo = updatedChat.latestVersion?.demoUrl && 
					updatedChat.latestVersion.demoUrl !== currentChat?.demoUrl &&
					updatedChat.latestVersion.demoUrl !== currentChat?.latestVersion?.demoUrl;

				const demoUrl = updatedChat.demoUrl || updatedChat.latestVersion?.demoUrl;
				console.log('Polling update - Demo URL:', demoUrl, 'Progress:', data.progressUpdate);

				// Update current chat with latest version data
				setCurrentChat({
					id: updatedChat.id,
					name: updatedChat.name || "v0 Chat",
					webUrl: updatedChat.webUrl,
					demoUrl: demoUrl,
					files: updatedChat.latestVersion?.files,
					latestVersion: updatedChat.latestVersion,
				});

				// Update progress based on API response
				if (data.progressUpdate !== undefined) {
					setPollingProgress(data.progressUpdate);
				}

				// If we have a demo URL and no progress update, the app is ready
				if (demoUrl && !data.progressUpdate) {
					setPollingProgress("");
					
					// Stop polling when generation is fully complete
					console.log('Generation complete, stopping polling');
					setIsPolling(false);
					if (pollingIntervalRef.current) {
						clearInterval(pollingIntervalRef.current);
						pollingIntervalRef.current = null;
					}
				}

				// Force iframe reload on every polling cycle if we have a demo URL
				if (demoUrl) {
					console.log('Reloading iframe due to polling update');
					reloadIframe();
				}
			}
		} catch (error) {
			console.error("Polling error:", error);
		}
	}, [currentChat]);

	// Start polling when we have a chat ID and are loading
	useEffect(() => {
		if (chatId && isPolling && !pollingIntervalRef.current) {
			pollingIntervalRef.current = setInterval(() => {
				pollChatUpdates(chatId);
			}, 20000); // Poll every 20 seconds for ongoing updates
		}

		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
		};
	}, [chatId, isPolling, pollChatUpdates]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		const clipboardData = e.clipboardData;
		if (!clipboardData) return;

		const items = Array.from(clipboardData.items);
		const imageItems = items.filter(item => item.type.startsWith('image/'));

		if (imageItems.length > 0) {
			e.preventDefault(); // Prevent default paste behavior for images
			
			imageItems.forEach(item => {
				const file = item.getAsFile();
				if (file) {
					// Create a unique name for pasted images
					const timestamp = Date.now();
					const extension = file.type.split('/')[1] || 'png';
					const pastedFile = new File([file], `pasted-image-${timestamp}.${extension}`, {
						type: file.type
					});
					
					setAttachedImages(prev => [...prev, pastedFile]);
				}
			});
		}
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if ((!input.trim() && attachedImages.length === 0) || isLoading) return;

		// Convert attached images to base64
		const imageFiles = await Promise.all(
			attachedImages.map(async (file) => {
				const base64 = await convertImageToBase64(file);
				return {
					name: file.name,
					content: base64,
					type: file.type,
					size: file.size,
				};
			})
		);

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: input.trim() || `Uploaded ${attachedImages.length} image(s)`,
			createdAt: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);
		setIsPolling(true);
		setPollingProgress("Generating...");
		setAttachedImages([]);

		try {
			const response = await fetch("/api/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					messages: [...messages, userMessage].map((msg) => ({
						role: msg.role,
						content: msg.content,
					})),
					chatId: chatId,
					images: imageFiles,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to get response");
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || "Unknown error");
			}

			// Update chat ID if this was the first message
			if (!chatId && data.chatId) {
				setChatId(data.chatId);
			}

			// Update current chat data
			if (data.chat) {
				setCurrentChat({
					id: data.chat.id,
					name: data.chat.name || "v0 Chat",
					webUrl: data.chat.webUrl,
					demoUrl: data.demoUrl,
					files: data.files,
					latestVersion: data.chat.latestVersion,
				});

				// Set initial progress - polling will update this appropriately
				setPollingProgress("v0 is generating your app...");
			}

			// Don't add a local assistant message - we'll get real messages from v0 via polling
		} catch (error) {
			console.error("Error:", error);
			const errorMessage: Message = {
				id: (Date.now() + 2).toString(),
				role: "assistant",
				content:
					"Sorry, there was an error processing your request. Please try again.",
				createdAt: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const copyCode = (code: string) => {
		navigator.clipboard.writeText(code);
	};

	const downloadProject = () => {
		if (!currentChat?.files) return;

		// Create a simple download of all files as a zip-like structure
		const projectData = {
			chatId: currentChat.id,
			name: currentChat.name,
			webUrl: currentChat.webUrl,
			demoUrl: currentChat.demoUrl,
			files: currentChat.files.map((file) => ({
				name: file.name,
				content: file.content,
				language: file.lang,
			})),
		};

		const blob = new Blob([JSON.stringify(projectData, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${currentChat.name || "v0-project"}.json`;
		a.click();
		URL.revokeObjectURL(url);
	};

	// Get the demo URL using consistent logic
	const getDemoUrl = () => {
		return currentChat?.latestVersion?.demoUrl || currentChat?.demoUrl;
	};

	const openDemo = () => {
		const demoUrl = getDemoUrl();
		if (demoUrl) {
			window.open(demoUrl, "_blank");
		}
	};

	// Handle iframe load events
	const handleIframeLoad = () => {
		setIframeLoading(false);
		setIframeError(false);
	};

	const handleIframeError = () => {
		setIframeLoading(false);
		setIframeError(true);
	};

	const reloadIframe = () => {
		setIframeError(false);
		setIframeLoading(true);
		setIframeKey(prev => prev + 1); // Force React to recreate the iframe
		
		// Also try to reload existing iframe as backup
		setTimeout(() => {
			const iframe = document.querySelector('iframe[title="v0 Generated App Preview"]') as HTMLIFrameElement;
			if (iframe && iframe.src) {
				const currentSrc = iframe.src;
				iframe.src = '';
				setTimeout(() => {
					iframe.src = currentSrc + (currentSrc.includes('?') ? '&' : '?') + 'refresh=' + Date.now();
				}, 100);
			}
		}, 200);
	};

	const retryIframe = () => {
		reloadIframe();
	};

	// Reset iframe states when URL changes with a small delay to ensure URL is ready
	useEffect(() => {
		const demoUrl = getDemoUrl();
		if (demoUrl) {
			setIframeLoading(true);
			setIframeError(false);
			
			// Add a small delay to give the v0 URL time to be fully available
			const timer = setTimeout(() => {
				// This will trigger a re-render to ensure iframe loads with stable URL
				setIframeLoading(true);
			}, 1000);
			
			return () => clearTimeout(timer);
		}
	}, [currentChat?.demoUrl, currentChat?.latestVersion?.demoUrl]);

	const openInV0 = () => {
		if (currentChat?.webUrl) {
			window.open(currentChat.webUrl, "_blank");
		}
	};

	// Helper function to convert image to base64
	const convertImageToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result;
				if (typeof result === 'string') {
					// Remove data URL prefix to get just the base64 content
					const base64Content = result.split(',')[1];
					if (base64Content) {
						resolve(base64Content);
					} else {
						reject(new Error('Failed to extract base64 content'));
					}
				} else {
					reject(new Error('FileReader result is not a string'));
				}
			};
			reader.onerror = (error) => reject(error);
			reader.readAsDataURL(file);
		});
	};

	// Handle paste anywhere in the chat area
	const handleGlobalPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		const clipboardData = e.clipboardData;
		if (!clipboardData) return;

		const items = Array.from(clipboardData.items);
		const imageItems = items.filter(item => item.type.startsWith('image/'));

		if (imageItems.length > 0) {
			e.preventDefault();
			
			imageItems.forEach(item => {
				const file = item.getAsFile();
				if (file) {
					const timestamp = Date.now();
					const extension = file.type.split('/')[1] || 'png';
					const pastedFile = new File([file], `pasted-image-${timestamp}.${extension}`, {
						type: file.type
					});
					
					setAttachedImages(prev => [...prev, pastedFile]);
				}
			});
		}
	};

	return (
		<div className="flex h-screen bg-background" onPaste={handleGlobalPaste}>
			{/* Left Panel - Chat Interface (25%) */}
			<div className="w-1/4 flex flex-col border-r">
				<div className="p-4 border-b">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold">Quantum Apps AI</h1>
							<p className="text-muted-foreground">
								Generate React + Vite applications with AI
							</p>
						</div>
						{isPolling && (
							<Button 
								size="sm" 
								variant="outline" 
								onClick={stopPolling}
								className="text-xs"
							>
								Stop Updates
							</Button>
						)}
					</div>
				</div>

				{/* Messages */}
				<ScrollArea className="flex-1 p-4">
					<div className="space-y-4">
						{messages.length === 0 && (
							<div className="text-center text-muted-foreground py-8">
								<Code className="mx-auto h-12 w-12 mb-4 opacity-50" />
								<h3 className="text-lg font-medium">Start Building with AI</h3>
								<p>
									Describe your React application and I'll generate the code for
									you.
								</p>
								<p className="text-sm mt-2 opacity-75">
									💡 Tip: You can paste images directly (Ctrl+V) or use the 📎 button
								</p>
							</div>
						)}

						{messages.map((message) => (
							<div
								key={message.id}
								className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
							>
								<Card
									className={`max-w-[80%] ${message.role === "user" ? "bg-primary text-primary-foreground" : ""}`}
								>
									<CardContent className="p-3">
										<div className="whitespace-pre-wrap">{message.content}</div>

										<div className="text-xs opacity-70 mt-2">
											{message.createdAt.toLocaleTimeString()}
										</div>
									</CardContent>
								</Card>
							</div>
						))}

						{(isLoading || (isPolling && pollingProgress)) && (
							<div className="flex justify-start">
								<Card className="max-w-[80%]">
									<CardContent className="p-3">
										<div className="flex items-center space-x-2">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
											<span>
												{pollingProgress || "Generating your application..."}
											</span>
										</div>
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</ScrollArea>

				{/* Input Area */}
				<div className="p-4 border-t">
					{attachedImages.length > 0 && (
						<div className="mb-3">
							<div className="flex flex-wrap gap-2">
								{attachedImages.map((image, index) => (
									<div key={index} className="relative">
										<div className="flex items-center gap-2 p-2 border rounded-md bg-muted">
											<img
												src={URL.createObjectURL(image)}
												alt={image.name}
												className="w-10 h-10 object-cover rounded"
											/>
											<Badge variant="secondary" className="pr-6">
												{image.name}
												<button
													onClick={() => removeImage(index)}
													type="button"
													className="absolute right-1 top-1/2 -translate-y-1/2 hover:bg-destructive/20 rounded-full p-0.5"
												>
													×
												</button>
											</Badge>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					<form onSubmit={handleFormSubmit} className="flex space-x-2">
						<div className="flex-1 relative">
							<Input
								value={input}
								onChange={handleInputChange}
								onPaste={handlePaste}
								placeholder="Describe the React application you want to build... (or paste images)"
								className="pr-10"
								disabled={isLoading}
							/>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
								onClick={() => fileInputRef.current?.click()}
							>
								<Paperclip className="h-4 w-4" />
							</Button>
						</div>
													<Button type="submit" disabled={isLoading || (!input.trim() && attachedImages.length === 0)}>
								<Send className="h-4 w-4" />
							</Button>
					</form>

					<input
						ref={fileInputRef}
						type="file"
						multiple
						accept="image/*"
						onChange={handleImageAttachment}
						className="hidden"
					/>
				</div>
			</div>

			{/* Right Panel - Live Preview Only (75%) */}
			<div className="w-3/4 flex flex-col">
				<div className="p-4 border-b flex items-center justify-between">
					<h2 className="text-xl font-semibold">Live Preview</h2>
					{currentChat && (
						<div className="flex space-x-2">
							<Button size="sm" variant="outline" onClick={downloadProject}>
								<Download className="h-4 w-4 mr-2" />
								Download
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={openDemo}
								disabled={!getDemoUrl()}
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								Open Full Screen
							</Button>
							<Button size="sm" variant="outline" onClick={openInV0}>
								<ExternalLink className="h-4 w-4 mr-2" />
								Open in v0
							</Button>
						</div>
					)}
				</div>

				{currentChat ? (
					<div className="flex-1 p-4">
						{getDemoUrl() ? (
							<div className="h-full relative">
								{iframeLoading && (
									<div className="absolute inset-0 bg-muted rounded-md flex items-center justify-center z-10">
										<div className="text-center text-muted-foreground">
											<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
											<p className="text-sm">Loading preview...</p>
										</div>
									</div>
								)}
								{iframeError ? (
									<div className="h-full bg-muted rounded-md flex items-center justify-center">
										<div className="text-center text-muted-foreground">
											<p className="text-lg font-medium mb-2">Preview not available</p>
											<p className="text-sm mb-4">The preview is still being generated or there was an error loading it.</p>
											<div className="flex gap-2 justify-center">
												<Button onClick={retryIframe} variant="outline" size="sm">
													Retry
												</Button>
												<Button onClick={openDemo} variant="outline" size="sm">
													<ExternalLink className="h-4 w-4 mr-2" />
													Open in New Tab
												</Button>
											</div>
										</div>
									</div>
								) : (
									(() => {
										const iframeUrl = getDemoUrl();
										console.log('Loading iframe with URL:', iframeUrl, 'Key:', iframeKey);
										console.log('Open full screen would use URL:', iframeUrl);
										return (
											<iframe
												key={`${iframeUrl}-${iframeKey}`}
												src={iframeUrl}
												className="w-full h-full rounded-md border border-border"
												title="v0 Generated App Preview"
												onLoad={handleIframeLoad}
												onError={handleIframeError}
												sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
											/>
										);
									})()
								)}
							</div>
						) : (
							<div className="h-full bg-muted rounded-md flex items-center justify-center">
								<div className="text-center text-muted-foreground">
									{pollingProgress ? (
										<>
											<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
											<p className="text-lg font-medium">{pollingProgress}</p>
											<p className="text-sm mt-2">
												v0 is working on your request. Preview will appear here shortly.
											</p>
										</>
									) : (
										<>
											<div className="h-12 w-12 bg-muted-foreground/20 rounded-full mx-auto mb-4 flex items-center justify-center">
												<span className="text-2xl">🎯</span>
											</div>
											<p className="text-lg font-medium">Waiting for your request</p>
											<p className="text-sm mt-2">
												Start a conversation to generate your app preview.
											</p>
										</>
									)}
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="flex-1 flex items-center justify-center">
						<div className="text-center text-muted-foreground">
							<Code className="mx-auto h-12 w-12 mb-4 opacity-50" />
							<h3 className="text-lg font-medium">No App Generated Yet</h3>
							<p>Start a conversation to see your generated React app here</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
