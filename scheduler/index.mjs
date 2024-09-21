import schedule from "node-schedule";

import { updateMetadata } from "./tasks.mjs";

// 매 10초마다 updateMetadata 실행
schedule.scheduleJob("*/10 * * * * *", () => {
  console.log("[scheduleJob] Metadata INSERT ");
  updateMetadata();
});
