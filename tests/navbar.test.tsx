import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/layout/Navbar";

vi.mock("@/components/notifications/NotificationCenter", () => ({
  NotificationCenter: () => null,
}));

describe("Navbar home link", () => {
  it.each([
    ["ADMIN", "/admin/dashboard"],
    ["CANDIDATE", "/academy"],
    ["MANAGER", "/manager"],
  ] as const)("routes %s users to their dashboard", (role, expectedHref) => {
    render(
      <Navbar
        user={{
          name: "Test User",
          email: "test@example.com",
          role,
        }}
      />
    );

    expect(screen.getByText("E2E").closest("a")).toHaveAttribute("href", expectedHref);
  });

  it("routes signed-out users to the public home page", () => {
    render(<Navbar user={null} />);

    expect(screen.getByText("E2E").closest("a")).toHaveAttribute("href", "/");
  });
});
