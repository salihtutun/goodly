import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import Login from "../pages/Login";

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

test("renders login form with email input", async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
  expect(await screen.findByTestId("login-email-input")).toBeInTheDocument();
});

test("renders login form with password input", async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
  expect(await screen.findByTestId("login-password-input")).toBeInTheDocument();
});

test("renders demo account button", async () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
  expect(await screen.findByTestId("use-demo-btn")).toBeInTheDocument();
});
