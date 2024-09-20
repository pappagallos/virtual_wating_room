import { NextResponse } from "next/server";

import { pool } from "@/app/lib/database";

export async function PUT(request, { params }) {
  const ticketId = params.ticket_id;
  if (!ticketId)
    NextResponse.json({ result: false, message: "비정상적인 호출입니다." });

  const body = await request.json();

  const promisePool = pool.promise();
  await promisePool.execute(
    "UPDATE waiting SET meta_data = ? WHERE ticket_uuid = UUID_TO_BIN(?)",
    [body.meta_data, ticketId]
  );

  return NextResponse.json({ result: true });
}
