import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  COMPANY_INFO,
  ACADEMY_MODULES,
  FINAL_ASSESSMENT_CONFIG,
  PIPELINE_STAGES,
  CERTIFICATE_STATUS,
} from "@/lib/design-system";

describe("E2E Procurement Design System & Foundation", () => {
  describe("Company Info & Platform Constants", () => {
    it("has correct E2E Procurement corporate identity", () => {
      expect(COMPANY_INFO.name).toBe("E2E Procurement Private Limited");
      expect(COMPANY_INFO.cin).toBe("U78300KA2025PTC204064");
      expect(COMPANY_INFO.website).toBe("https://www.e2epvtltd.com/");
    });

    it("verifies the exact 5 Academy Modules with required titles", () => {
      expect(ACADEMY_MODULES).toHaveLength(5);
      expect(ACADEMY_MODULES[0].title).toBe("Module 1 — Recruitment Fundamentals");
      expect(ACADEMY_MODULES[1].title).toBe("Module 2 — JD Decoding & Requirement Understanding");
      expect(ACADEMY_MODULES[2].title).toBe("Module 3 — Candidate Sourcing & Recruitment Preparation");
      expect(ACADEMY_MODULES[3].title).toBe("Module 4 — Communication, Screening & Interview Management");
      expect(ACADEMY_MODULES[4].title).toBe("Module 5 — Recruitment Operations");

      // Verify each module requires 70% passing score
      ACADEMY_MODULES.forEach((mod) => {
        expect(mod.passingScore).toBe(70);
      });
    });

    it("strictly verifies that Module 5 does NOT contain ATS in title or description", () => {
      const mod5 = ACADEMY_MODULES[4];
      expect(mod5.title.toLowerCase()).not.toContain("ats");
      expect(mod5.description.toLowerCase()).not.toContain("ats");
      expect(mod5.id.toLowerCase()).not.toContain("ats");
    });

    it("verifies Final Assessment configuration specifications", () => {
      expect(FINAL_ASSESSMENT_CONFIG.title).toBe("Final Assessment");
      expect(FINAL_ASSESSMENT_CONFIG.totalQuestions).toBe(20);
      expect(FINAL_ASSESSMENT_CONFIG.durationMinutes).toBe(20);
      expect(FINAL_ASSESSMENT_CONFIG.passingScore).toBe(70);
      expect(FINAL_ASSESSMENT_CONFIG.unlimitedRetries).toBe(true);
    });

    it("verifies all 11 mandatory recruitment pipeline stages in order", () => {
      const expectedStages = [
        "Sourced",
        "Contacted",
        "Interested",
        "Screened",
        "Shortlisted",
        "Interview Scheduled",
        "Interview Attended",
        "Selected",
        "Offered",
        "Offer Accepted",
        "Joined",
      ];
      expect(PIPELINE_STAGES.map((s) => s.label)).toEqual(expectedStages);
    });

    it("verifies all 5 required certificate statuses", () => {
      expect(CERTIFICATE_STATUS.NOT_ELIGIBLE).toBe("NOT_ELIGIBLE");
      expect(CERTIFICATE_STATUS.PENDING_APPROVAL).toBe("PENDING_APPROVAL");
      expect(CERTIFICATE_STATUS.APPROVED).toBe("APPROVED");
      expect(CERTIFICATE_STATUS.REJECTED).toBe("REJECTED");
      expect(CERTIFICATE_STATUS.ISSUED).toBe("ISSUED");
    });
  });

  describe("Logo Component", () => {
    it("renders full logo with E2E text, PROCUREMENT badge, and subtitle", () => {
      render(<Logo variant="full" />);
      expect(screen.getByText("E2E")).toBeInTheDocument();
      expect(screen.getByText("PROCUREMENT")).toBeInTheDocument();
      expect(screen.getByText("Recruiter Academy & Operations")).toBeInTheDocument();
    });

    it("renders compact logo without subtitle", () => {
      render(<Logo variant="compact" />);
      expect(screen.getByText("E2E")).toBeInTheDocument();
      expect(screen.getByText("PROCUREMENT")).toBeInTheDocument();
      expect(screen.queryByText("Recruiter Academy & Operations")).not.toBeInTheDocument();
    });
  });

  describe("Button Component", () => {
    it("renders button with children and responds to click events", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Submit Action</Button>);
      const btn = screen.getByRole("button", { name: /submit action/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("handles disabled state properly", () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled Button
        </Button>
      );
      const btn = screen.getByRole("button", { name: /disabled button/i });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("shows loading state with spinner and sets aria-busy", () => {
      render(<Button isLoading>Processing</Button>);
      const btn = screen.getByRole("button", { name: /processing/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute("aria-busy", "true");
    });
  });

  describe("Badge Component", () => {
    it("renders badge with text and custom variants", () => {
      render(<Badge variant="success">Certified</Badge>);
      expect(screen.getByText("Certified")).toBeInTheDocument();
    });

    it("renders with dot indicator when enabled", () => {
      const { container } = render(
        <Badge variant="warning" dot>
          Pending
        </Badge>
      );
      const dot = container.querySelector(".rounded-full");
      expect(dot).toBeInTheDocument();
    });
  });

  describe("Input Component", () => {
    it("renders input with label and helper text", () => {
      render(
        <Input label="Email Address" helperText="Enter your official registered email" id="email" />
      );
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByText(/enter your official registered email/i)).toBeInTheDocument();
    });

    it("renders error state with aria-invalid", () => {
      render(
        <Input label="Password" error="Password must be at least 8 characters" id="password" />
      );
      const input = screen.getByLabelText(/password/i);
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  describe("ProgressBar Component", () => {
    it("renders progress bar with correct value and accessibility attributes", () => {
      render(<ProgressBar value={70} max={100} showLabel benchmark={70} />);
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "70");
      expect(progressBar).toHaveAttribute("aria-valuemin", "0");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
      expect(screen.getByText("70%")).toBeInTheDocument();
      expect(screen.getByText("Passing (70%)")).toBeInTheDocument();
    });

    it("clamps values over 100 to 100%", () => {
      render(<ProgressBar value={120} max={100} showLabel />);
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "100");
    });
  });

  describe("Card Component", () => {
    it("renders structured card hierarchy", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Module Overview</CardTitle>
            <CardDescription>Essential details</CardDescription>
          </CardHeader>
          <CardContent>Body content here</CardContent>
          <CardFooter>Action button</CardFooter>
        </Card>
      );
      expect(screen.getByText("Module Overview")).toBeInTheDocument();
      expect(screen.getByText("Essential details")).toBeInTheDocument();
      expect(screen.getByText("Body content here")).toBeInTheDocument();
      expect(screen.getByText("Action button")).toBeInTheDocument();
    });
  });

  describe("EmptyState Component", () => {
    it("renders helpful empty state when data is absent", () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No Recruiters Found"
          description="Create your first recruiter to start the training workflow."
          actionLabel="Add recruiter"
          onAction={handleAction}
        />
      );
      expect(screen.getByText("No Recruiters Found")).toBeInTheDocument();
      expect(
        screen.getByText("Create your first recruiter to start the training workflow.")
      ).toBeInTheDocument();
      const actionBtn = screen.getByRole("button", { name: /add recruiter/i });
      fireEvent.click(actionBtn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });
});
