import { Card } from "@/components/ui/card";

export default function PrivacyPage() {
	return (
		<Card className="mx-auto max-w-4xl p-8">
			<h1 className="mb-6 text-4xl font-bold">Privacy Policy</h1>
			<div className="prose prose-lg">
				<p className="text-muted-foreground">
					Last updated: {new Date().toLocaleDateString()}
				</p>
				<p className="mt-4">
					This Privacy Policy describes how we collect, use, and protect your
					personal information.
				</p>
				{/* Add your privacy policy content here */}
			</div>
		</Card>
	);
}

