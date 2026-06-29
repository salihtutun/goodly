import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Landing from "../pages/Landing";

test("renders hero CTA button", () => {
  render(
    <BrowserRouter>
      <Landing />
    </BrowserRouter>
  );
  expect(screen.getByTestId("hero-cta-primary")).toBeInTheDocument();
});

test("renders navigation login link", () => {
  render(
    <BrowserRouter>
      <Landing />
    </BrowserRouter>
  );
  expect(screen.getByTestId("nav-login-link")).toBeInTheDocument();
});

test("renders get started CTA", () => {
  render(
    <BrowserRouter>
      <Landing />
    </BrowserRouter>
  );
  expect(screen.getByTestId("cta-get-started")).toBeInTheDocument();
});
