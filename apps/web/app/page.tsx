"use client";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { V0Chatbot } from "@/components/v0-chatbot";

export default function Home() {
	return (
		<>
			<Authenticated>
				<div className="relative h-screen">
					<div className="absolute top-4 right-4 z-10">
						<UserButton />
					</div>
					<V0Chatbot />
				</div>
			</Authenticated>
			<Unauthenticated>
				<div className="min-h-screen flex items-center justify-center bg-background">
					<div className="text-center space-y-4">
						<h1 className="text-4xl font-bold">Quantum Apps AI</h1>
						<p className="text-xl text-muted-foreground">
							Generate React applications with AI
						</p>
						<SignInButton mode="modal">
							<button
								className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
								type="button"
							>
								Sign In to Start Building
							</button>
						</SignInButton>
					</div>
				</div>
			</Unauthenticated>
		</>
	);
}
