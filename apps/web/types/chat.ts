export interface CodeDataPart {
	type: "data-code";
	id: string;
	data: {
		code: string;
		language: string;
		filename: string;
	};
}

export interface ProjectDataPart {
	type: "data-project";
	id: string;
	data: {
		files: Array<{
			path: string;
			content: string;
			language: string;
		}>;
		framework: string;
		description: string;
	};
}

// Define custom message metadata
export interface V0MessageMetadata {
	model?: string;
	totalTokens?: number;
	timestamp?: string;
}

// Project structure for displaying generated code
export interface GeneratedProject {
	files: Array<{
		path: string;
		content: string;
		language: string;
	}>;
	framework: string;
	description: string;
}
