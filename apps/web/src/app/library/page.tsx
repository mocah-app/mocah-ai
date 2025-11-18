export default function LibraryPage() {
  return (
    <div className="flex flex-1 flex-col min-h-dvh gap-4 p-1 w-full bg-dot">
      <div className="flex bg-background/50 dark:bg-background/80 flex-1 flex-col items-center justify-center gap-4 p-4 border border-border">
        <h1 className="text-2xl font-bold">Library</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full">
          <LibraryCard />
          <LibraryCard />
          <LibraryCard />
          <LibraryCard />
          <LibraryCard />
          <LibraryCard />
        </div>
      </div>
    </div>
  );
}

function LibraryCard() {
  return (
    <div className="flex flex-col gap-4 bg-secondary/50 hover:bg-secondary/25 transition-all duration-300 scale-100 hover:scale-105 rounded-lg p-4 border hover:border-2 border-border w-full h-full"></div>
  );
}
