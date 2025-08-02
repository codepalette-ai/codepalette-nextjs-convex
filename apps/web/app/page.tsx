"use client";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";

export default function Home() {
	return (
		<>
			<Authenticated>
				<UserButton />
			</Authenticated>
			<Unauthenticated>
				<SignInButton />
			</Unauthenticated>
		</>
	);
}
