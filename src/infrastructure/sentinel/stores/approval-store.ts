import { z } from "zod";
import { AtomicJsonStore } from "./atomic-json-store.js";
import {
  ApprovalChainSchema,
  ApprovalEntrySchema,
  type ApprovalEntry,
} from "../../../domain/sentinel/policy/approval.js";
import {
  appendApprovalEntry,
  verifyApprovalChain,
} from "../policy/approval-chain.js";
import { sentinelApprovalsPath } from "../../../domain/sentinel/paths.js";

const ApprovalsFileSchema = z
  .object({
    chain: ApprovalChainSchema,
  })
  .strict();
type ApprovalsFile = z.infer<typeof ApprovalsFileSchema>;

function emptyFile(): ApprovalsFile {
  return { chain: [] };
}

export class ApprovalStore {
  private readonly store: AtomicJsonStore<ApprovalsFile>;

  constructor(workspaceRoot: string) {
    this.store = new AtomicJsonStore<ApprovalsFile>(
      sentinelApprovalsPath(workspaceRoot),
      () => emptyFile(),
      { validate: (raw) => ApprovalsFileSchema.parse(raw) },
    );
  }

  async readChain(): Promise<readonly ApprovalEntry[]> {
    const file = await this.store.read();
    verifyApprovalChain(file.chain);
    return file.chain;
  }

  async append(draft: Omit<ApprovalEntry, "prevHash" | "hash">): Promise<ApprovalEntry> {
    let appended: ApprovalEntry | null = null;
    await this.store.update((current) => {
      verifyApprovalChain(current.chain);
      const entry = appendApprovalEntry(current.chain, draft);
      appended = entry;
      return { chain: [...current.chain, entry] };
    });
    if (appended === null) {
      throw new Error("approval store update returned no entry");
    }
    return ApprovalEntrySchema.parse(appended);
  }

  async forAction(actionPlanId: string): Promise<readonly ApprovalEntry[]> {
    const chain = await this.readChain();
    return chain.filter((entry) => entry.actionPlanId === actionPlanId);
  }
}
