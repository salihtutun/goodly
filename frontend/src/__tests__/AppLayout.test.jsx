import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import AppLayout from "../components/app/AppLayout";

// Mock the API module
jest.mock("../lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockRejectedValue(new Error("not authenticated")),
    post: jest.fn(),
    interceptors: { request: { use: jest.fn() } },
  },
  formatApiError: jest.fn((e) => e?.message || "Error"),
}));

test("renders sidebar navigation links", async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
  expect(await screen.findByTestId("nav-dashboard")).toBeInTheDocument();
  expect(screen.getByTestId("nav-projects")).toBeInTheDocument();
  expect(screen.getByTestId("nav-audit")).toBeInTheDocument();
  expect(screen.getByTestId("nav-social")).toBeInTheDocument();
  expect(screen.getByTestId("nav-ai-visibility")).toBeInTheDocument();
  expect(screen.getByTestId("nav-gbp")).toBeInTheDocument();
  expect(screen.getByTestId("nav-ai")).toBeInTheDocument();
  expect(screen.getByTestId("nav-billing")).toBeInTheDocument();
});

test("renders logout button", async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <AppLayout>
          <div>Content</div>
        </AppLayout>
      </AuthProvider>
    </BrowserRouter>
  );
  expect(await screen.findByTestId("logout-btn")).toBeInTheDocument();
});
