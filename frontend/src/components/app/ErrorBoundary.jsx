import { Component } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, RefreshCw, Home } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-8">
              <div className="h-24 w-24 rounded-full bg-[#E07A5F]/10 flex items-center justify-center">
                <Leaf size={48} className="text-[#E07A5F]" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="font-display font-bold text-4xl text-[#1A201A] tracking-tight">
              Something went sideways
            </h1>
            <p className="mt-4 text-[#5C685C]">
              An unexpected error occurred. Our team has been notified.
            </p>
            {this.state.error && (
              <p className="mt-2 text-xs text-[#5C685C] font-mono bg-[#F3F0E9] rounded-lg p-3 max-h-24 overflow-auto">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = "/";
                }}
                className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6"
              >
                <Home size={16} className="mr-2" />
                Go home
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="rounded-full border-[#2D3E32] text-[#2D3E32] hover:bg-[#F3F0E9]"
              >
                <RefreshCw size={16} className="mr-2" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
