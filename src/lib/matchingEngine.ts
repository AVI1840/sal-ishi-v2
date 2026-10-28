// Moved to src/domain/matchingEngine.ts in Sprint 0 so the web app and the
// Lambda handlers share one implementation (see PROMPT_SONNET5_PRODUCTION.md).
// Re-exported here so existing imports of "@/lib/matchingEngine" keep working.
export * from "@/domain/matchingEngine";
