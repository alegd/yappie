import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./Card";

describe("Card components", () => {
  it("should render Card with children and custom className", () => {
    render(<Card className="custom">Content</Card>);
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Content")).toHaveClass("custom");
  });

  it("should render CardHeader", () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });

  it("should render CardTitle as h3", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Title");
  });

  it("should render CardDescription", () => {
    render(<CardDescription>Description</CardDescription>);
    expect(screen.getByText("Description")).toBeInTheDocument();
  });

  it("should render CardContent", () => {
    render(<CardContent>Body</CardContent>);
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("should render CardFooter", () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
