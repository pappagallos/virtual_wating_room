import schedule from "node-schedule";

import { insertWaitingTicket } from "./tasks.mjs";

// 매 10초마다 insertWaitingTicket 실행
schedule.scheduleJob("*/10 * * * * *", () => {
  console.log("[scheduleJob] insertWaitingTicket");
  insertWaitingTicket();
});
