import cron from "node-cron";
import { db } from "./db";
import { sendDailySummary } from "./mailer";

let schedulerStarted = false;

export function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Run every minute to check which firms need their summary sent
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const firms = await db.firm.findMany({
        where: {
          dailySummaryOn: true,
          summaryTime: timeStr,
          smtpHost: { not: null },
          smtpUser: { not: null },
          dailySummaryTo: { not: null },
        },
      });

      for (const firm of firms) {
        console.log(`[scheduler] Sending daily summary to ${firm.dailySummaryTo} for ${firm.name}`);
        try {
          await sendDailySummary(firm.id);
          console.log(`[scheduler] ✅ Summary sent for ${firm.name}`);
        } catch (err) {
          console.error(`[scheduler] ❌ Failed for ${firm.name}:`, err);
        }
      }
    } catch (err) {
      console.error("[scheduler] Error:", err);
    }
  });

  console.log("[scheduler] Daily summary scheduler started");
}
