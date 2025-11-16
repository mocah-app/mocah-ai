export default function TermsPage() {
	return (
		<div className="mx-auto max-w-4xl p-8">
			<h1 className="mb-6 text-4xl font-bold">Terms of Service</h1>
			<div className="prose prose-lg">
				<p className="text-gray-600">
					Last updated: {new Date().toLocaleDateString()}
				</p>
				<p className="mt-4">
					Please read these Terms of Service carefully before using our
					platform.
				</p>
				{/* Add your terms content here */}
			</div>
		</div>
	);
}

