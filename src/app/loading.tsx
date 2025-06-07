// app/loading.tsx - Global Loading UI
export default function Loading() {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center mx-auto animate-pulse">
            <div className="h-6 w-6 bg-primary-foreground rounded animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Loading...</h2>
            <p className="text-sm text-muted-foreground">Please wait</p>
          </div>
        </div>
      </div>
    )
  }