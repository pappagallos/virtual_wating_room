import { NextResponse } from "next/server";

import { v4 as uuidv4 } from "uuid";
import { redisClient } from "@/app/lib/redis";
// import { pool } from "@/app/lib/database";

export async function POST() {
  const uuid = uuidv4();

  await redisClient.LPUSH("waiting", `${uuid}:${new Date().getTime()}`);

  // Redis를 사용하지 않고 Database를 이용해서 구축할 경우 {
  // const promisePool = pool.promise();

  // await promisePool.execute(
  //   "UPDATE waiting SET ticket_status = 9 WHERE client_ip = ?",
  //   [clientIP]
  // );

  // UUID 148Byte => 16Byte 줄이는 방법
  // https://www.mysqltutorial.org/mysql-basics/mysql-uuid/
  // await promisePool.execute(
  //   "INSERT INTO waiting(ticket_uuid, ticket_status, client_ip) VALUES (UUID_TO_BIN(?), 1, ?)",
  //   [uuid, clientIP]
  // );
  // }

  return NextResponse.json({ result: true, data: uuid });
}
