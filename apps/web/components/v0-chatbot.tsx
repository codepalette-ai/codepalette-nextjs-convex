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
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/design-system/components/tabs";
import {
	Code,
	Copy,
	Download,
	ExternalLink,
	Paperclip,
	Play,
	Send,
} from "lucide-react";
import { useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	createdAt: Date;
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
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleImageAttachment = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const files = Array.from(event.target.files || []);
		setAttachedImages((prev) => [...prev, ...files]);
	};

	const removeImage = (index: number) => {
		setAttachedImages((prev) => prev.filter((_, i) => i !== index));
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setInput(e.target.value);
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			role: "user",
			content: input.trim(),
			createdAt: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);
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
			}

			// Add assistant response
			const assistantMessage: Message = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content:
					"Generated your React application! Check the preview and code on the right.",
				createdAt: new Date(),
			};

			setMessages((prev) => [...prev, assistantMessage]);
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

	const openDemo = () => {
		const demoUrl = currentChat?.demoUrl || currentChat?.latestVersion?.demoUrl;
		if (demoUrl) {
			window.open(demoUrl, "_blank");
		}
	};

	const openInV0 = () => {
		if (currentChat?.webUrl) {
			window.open(currentChat.webUrl, "_blank");
		}
	};

	return (
		<div className="flex h-screen bg-background">
			{/* Left Panel - Chat Interface */}
			<div className="flex-1 flex flex-col border-r">
				<div className="p-4 border-b">
					<h1 className="text-2xl font-bold">Quantum Apps AI</h1>
					<p className="text-muted-foreground">
						Generate React + Vite applications with AI
					</p>
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

						{isLoading && (
							<div className="flex justify-start">
								<Card className="max-w-[80%]">
									<CardContent className="p-3">
										<div className="flex items-center space-x-2">
											<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
											<span>Generating your application...</span>
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
								))}
							</div>
						</div>
					)}

					<form onSubmit={handleFormSubmit} className="flex space-x-2">
						<div className="flex-1 relative">
							<Input
								value={input}
								onChange={handleInputChange}
								placeholder="Describe the React application you want to build..."
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
						<Button type="submit" disabled={isLoading || !input.trim()}>
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

			{/* Right Panel - Code Preview */}
			<div className="flex-1 flex flex-col">
				<div className="p-4 border-b flex items-center justify-between">
					<h2 className="text-xl font-semibold">Generated App</h2>
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
								disabled={
									!currentChat.demoUrl && !currentChat.latestVersion?.demoUrl
								}
							>
								<Play className="h-4 w-4 mr-2" />
								Preview
							</Button>
							<Button size="sm" variant="outline" onClick={openInV0}>
								<ExternalLink className="h-4 w-4 mr-2" />
								Open in v0
							</Button>
						</div>
					)}
				</div>

				{currentChat ? (
					<div className="flex-1">
						<Tabs defaultValue="preview" className="h-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="preview">Live Preview</TabsTrigger>
								<TabsTrigger value="files">Code Files</TabsTrigger>
							</TabsList>

							<TabsContent value="preview" className="h-full">
								<div className="p-4 h-full">
									{currentChat.demoUrl || currentChat.latestVersion?.demoUrl ? (
										<Card className="h-full">
											<CardHeader className="pb-2">
												<div className="flex items-center justify-between">
													<CardTitle className="text-sm">Live Demo</CardTitle>
													<Button size="sm" variant="ghost" onClick={openDemo}>
														<ExternalLink className="h-4 w-4" />
													</Button>
												</div>
											</CardHeader>
											<CardContent className="p-0 h-full">
												<iframe
													src={
														currentChat.demoUrl ||
														currentChat.latestVersion?.demoUrl
													}
													className="w-full h-full border-0 rounded-b-md"
													title="v0 Generated App Preview"
												/>
											</CardContent>
										</Card>
									) : (
										<Card className="h-full">
											<CardContent className="p-4 h-full">
												<div className="h-full bg-muted rounded-md flex items-center justify-center">
													<div className="text-center text-muted-foreground">
														<Play className="mx-auto h-12 w-12 mb-4 opacity-50" />
														<p>Generating preview...</p>
														<p className="text-sm">
															Your app will appear here shortly
														</p>
													</div>
												</div>
											</CardContent>
										</Card>
									)}
								</div>
							</TabsContent>

							<TabsContent value="files" className="h-full">
								<ScrollArea className="h-full">
									<div className="p-4">
										<div className="mb-4">
											<Badge variant="outline">React + Vite</Badge>
											<p className="mt-2 text-sm text-muted-foreground">
												{currentChat.name}
											</p>
										</div>

										<div className="space-y-4">
											{currentChat.files?.map((file, index) => (
												<Card key={index}>
													<CardHeader className="pb-2">
														<div className="flex items-center justify-between">
															<CardTitle className="text-sm">
																{file.name}
															</CardTitle>
															<Button
																size="sm"
																variant="ghost"
																onClick={() => copyCode(file.content)}
															>
																<Copy className="h-4 w-4" />
															</Button>
														</div>
													</CardHeader>
													<CardContent>
														<SyntaxHighlighter
															language={file.lang}
															style={oneDark}
															className="rounded-md text-sm"
														>
															{file.content}
														</SyntaxHighlighter>
													</CardContent>
												</Card>
											))}
										</div>
									</div>
								</ScrollArea>
							</TabsContent>
						</Tabs>
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
