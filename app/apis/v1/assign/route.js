import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { v4 as uuidv4 } from "uuid";
import { pool } from "@/app/lib/database";

export async function POST() {
  const uuid = uuidv4();

  // 클라이언트 IP 가져오는 방법
  // https://www.restack.io/docs/nextjs-knowledge-nextjs-x-forwarded-for-guide
  const forwardedFor = headers().get("x-forwarded-for");
  const clientIP = forwardedFor ? forwardedFor.split(",")[0] : null;

  const promisePool = pool.promise();

  await promisePool.execute(
    "UPDATE waiting SET ticket_status = 9 WHERE client_ip = ?",
    [clientIP]
  );

  // UUID 148Byte => 16Byte 줄이는 방법
  // https://www.mysqltutorial.org/mysql-basics/mysql-uuid/
  await promisePool.execute(
    "INSERT INTO waiting(ticket_uuid, ticket_status, client_ip) VALUES (UUID_TO_BIN(?), 1, ?)",
    [uuid, clientIP]
  );

  return NextResponse.json({ result: true, data: uuid });
}
