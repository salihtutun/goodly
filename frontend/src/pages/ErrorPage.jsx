import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, RefreshCw } from "lucide-react";

export default function ErrorPage({ message = "Something went wrong. Our team has been notified." }) {
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
        <p className="mt-4 text-[#5C685C]">{message}</p>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6"
          >
            <RefreshCw size={16} className="mr-2" />
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-[#2D3E32] text-[#2D3E32] hover:bg-[#F3F0E9]"
          >
            <Link to="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
