import schedule from "node-schedule";

import { insertTicket, deleteCanceledTicket } from "./tasks.mjs";

// 매 10초마다 실행
schedule.scheduleJob("*/10 * * * * *", () => {
  insertTicket();
  deleteCanceledTicket();
});
