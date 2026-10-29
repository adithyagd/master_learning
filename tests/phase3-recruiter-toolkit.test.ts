// @vitest-environment node
import { describe, it, expect } from "vitest";
import { TOOLKIT_ITEMS, TOOLKIT_CATEGORIES } from "@/lib/toolkit-data";

describe("Phase 3: Recruiter Toolkit Reference Library", () => {
  describe("1. Completeness of Required Reference Materials (12 Core Modules)", () => {
    it("contains all 12 mandatory recruiter reference topics", () => {
      const itemIds = TOOLKIT_ITEMS.map((item) => item.id);

      const requiredTopics = [
        "recruitment-terminology",
        "jd-decoding-checklist",
        "candidate-sourcing-checklist",
        "boolean-search-examples",
        "candidate-screening-questions",
        "professional-calling-scripts",
        "candidate-followup-messages",
        "interview-confirmation-templates",
        "job-fair-checklist",
        "interview-prep-guide",
        "pipeline-stage-definitions",
        "offer-joining-templates",
      ];

      requiredTopics.forEach((topic) => {
        expect(itemIds).toContain(topic);
      });
    });

    it("ensures every toolkit item has title, description, content, and valid category", () => {
      TOOLKIT_ITEMS.forEach((item) => {
        expect(item.title).toBeDefined();
        expect(item.description).toBeDefined();
        expect(item.content.length).toBeGreaterThan(50);
        expect(item.tags.length).toBeGreaterThan(0);
        expect(TOOLKIT_CATEGORIES).toContain(item.category);
      });
    });
  });

  describe("2. Strict Zero-ATS Verification", () => {
    it("strictly verifies that all toolkit items contain zero ATS terminology", () => {
      const atsRegex = /\b(ats)\b/i;
      TOOLKIT_ITEMS.forEach((item) => {
        expect(atsRegex.test(item.title)).toBe(false);
        expect(atsRegex.test(item.description)).toBe(false);
        expect(atsRegex.test(item.content)).toBe(false);
        expect(item.content.toLowerCase()).not.toContain("applicant tracking");
        if (item.copyableText) {
          expect(atsRegex.test(item.copyableText)).toBe(false);
          expect(item.copyableText.toLowerCase()).not.toContain("applicant tracking");
        }
      });
    });
  });

  describe("3. Category Filtering & Item Classification", () => {
    it("correctly groups items into the 4 defined categories", () => {
      const checklists = TOOLKIT_ITEMS.filter((i) => i.category === "Checklists");
      const templates = TOOLKIT_ITEMS.filter((i) => i.category === "Templates & Scripts");
      const booleanSearches = TOOLKIT_ITEMS.filter((i) => i.category === "Boolean Searches");
      const glossary = TOOLKIT_ITEMS.filter((i) => i.category === "Glossary & Guides");

      expect(checklists.length).toBe(3); // JD, Sourcing, Job fair
      expect(templates.length).toBe(5); // Questions, calling scripts, follow-ups, interview confirms, offer templates
      expect(booleanSearches.length).toBe(1); // Boolean recipes
      expect(glossary.length).toBe(3); // Terminology, candidate prep, pipeline stages
    });
  });

  describe("4. Copyable Templates & Formats", () => {
    it("provides adaptable copyable plaintext for operational templates", () => {
      const copyableItems = TOOLKIT_ITEMS.filter((i) => i.copyableText);
      expect(copyableItems.length).toBeGreaterThanOrEqual(8);

      // Verify Boolean strings item has copyable text
      const booleanItem = TOOLKIT_ITEMS.find((i) => i.id === "boolean-search-examples");
      expect(booleanItem?.copyableText).toContain("Warehouse Supervisor");
      expect(booleanItem?.copyableText).toContain("Full Stack");
      expect(booleanItem?.copyableText).toContain("AND");
      expect(booleanItem?.copyableText).toContain("OR");

      // Verify Interview confirmation has copyable text with placeholders
      const interviewItem = TOOLKIT_ITEMS.find((i) => i.id === "interview-confirmation-templates");
      expect(interviewItem?.copyableText).toContain("Subject: Interview Confirmation");
      expect(interviewItem?.copyableText).toContain("[Candidate Name]");
      expect(interviewItem?.copyableText).toContain("[Client Name]");

      // Verify Offer rollout template has pre-joining touchpoints
      const offerItem = TOOLKIT_ITEMS.find((i) => i.id === "offer-joining-templates");
      expect(offerItem?.copyableText).toContain("Day -7");
      expect(offerItem?.copyableText).toContain("Day -3");
      expect(offerItem?.copyableText).toContain("Day -1");
    });
  });

  describe("5. Search Algorithm Simulation", () => {
    it("locates relevant items when searching by keyword across fields", () => {
      const search = (q: string) => {
        const query = q.toLowerCase();
        return TOOLKIT_ITEMS.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.content.toLowerCase().includes(query) ||
            item.tags.some((t) => t.toLowerCase().includes(query)) ||
            (item.copyableText && item.copyableText.toLowerCase().includes(query))
        );
      };

      // Searching for "boolean"
      const booleanResults = search("boolean");
      expect(booleanResults.length).toBeGreaterThanOrEqual(1);
      expect(booleanResults.some((r) => r.id === "boolean-search-examples")).toBe(true);

      // Searching for "objection"
      const objectionResults = search("objection");
      expect(objectionResults.some((r) => r.id === "professional-calling-scripts")).toBe(true);

      // Searching for "no-show"
      const noshowResults = search("no-show");
      expect(noshowResults.some((r) => r.id === "interview-confirmation-templates")).toBe(true);

      // Searching for non-existent keyword returns empty array
      const emptyResults = search("xyznonexistentterm12345");
      expect(emptyResults).toHaveLength(0);
    });
  });
});
