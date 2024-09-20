import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { redisClient } from "@/app/lib/redis";
// import { pool } from "@/app/lib/database";

export async function PUT(request, { params }) {
  // 클라이언트 IP 가져오는 방법
  // https://www.restack.io/docs/nextjs-knowledge-nextjs-x-forwarded-for-guide
  const forwardedFor = headers().get("x-forwarded-for");
  const clientIP = forwardedFor ? forwardedFor.split(",")[0] : null;

  const ticketId = params.ticket_id;
  if (!ticketId)
    NextResponse.json({ result: false, message: "비정상적인 호출입니다." });

  const body = await request.json();
  const metaData = body.meta_data;
  metaData["ip"] = clientIP;

  await redisClient.SET(`metadata:${ticketId}`, JSON.stringify(metaData));

  // Redis를 사용하지 않고 Database를 이용해서 구축할 경우 {
  // const promisePool = pool.promise();
  // await promisePool.execute(
  //   "UPDATE waiting SET meta_data = ? WHERE ticket_uuid = UUID_TO_BIN(?)",
  //   [body.meta_data, ticketId]
  // );
  // }

  return NextResponse.json({ result: true });
}
