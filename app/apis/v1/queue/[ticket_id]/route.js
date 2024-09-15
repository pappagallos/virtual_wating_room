import { NextResponse } from "next/server";

import { pool } from "@/app/lib/database";

export async function GET(_, { params }) {
  const ticketId = params.ticket_id;
  if (!ticketId)
    NextResponse.json({ result: false, message: "비정상적인 호출입니다." });

  const promisePool = pool.promise();

  const totalWaitingResult = await promisePool.execute(
    "SELECT COUNT(*) AS total_waiting FROM waiting WHERE ticket_status <> 9",
    [ticketId]
  );
  const totalWaiting = totalWaitingResult[0][0]["total_waiting"];

  const myTicketCreatedDateResult = await promisePool.execute(
    "SELECT created_date FROM waiting WHERE ticket_uuid = UUID_TO_BIN(?)",
    [ticketId]
  );
  const myTicketCreatedDate = myTicketCreatedDateResult[0][0]["created_date"];

  const myWaitingNumberResult = await promisePool.execute(
    "SELECT COUNT(*) AS my_waiting_number FROM waiting WHERE ticket_status <> 9 AND created_date <= ? AND ticket_uuid <> UUID_TO_BIN(?)",
    [myTicketCreatedDate, ticketId]
  );
  const myWaitingNumber = myWaitingNumberResult[0][0]["my_waiting_number"];

  return NextResponse.json({
    result: true,
    data: {
      total_waiting: totalWaiting,
      my_waiting_number: myWaitingNumber,
    },
  });
}
