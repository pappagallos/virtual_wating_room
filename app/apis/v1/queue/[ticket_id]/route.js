import fs from "fs";

import { redisClient } from "@/app/lib/redis";
import { NextResponse } from "next/server";

import jwt from "jsonwebtoken";

const privateKey = fs.readFileSync(`${process.env.PWD}/certs/private.pem`);

async function issueAccessToken(myWaitingNumber, ticketUUID) {
  if (myWaitingNumber > 0) return null;
  return jwt.sign({ ticket_uuid: ticketUUID }, privateKey, {
    algorithm: "RS512",
    expiresIn: "1h",
  });
}

export async function GET(_, { params }) {
  const ticketUUID = params.ticket_id;
  if (!ticketUUID)
    NextResponse.json({ result: false, message: "비정상적인 호출입니다." });

  const totalWaiting = await redisClient.LRANGE("waiting", 0, -1);
  const myTicketIndex = totalWaiting.findIndex(
    (ticket) => ticket.split(":")[0] === ticketUUID
  );
  const myWaitingNumber = totalWaiting.length - (myTicketIndex + 1);

  // 만약 사용자 차례가 되어 입장할 수 있게되면 ticket 발행 처리
  const accessToken = await issueAccessToken(myWaitingNumber, ticketUUID);
  if (accessToken) {
    // ticket 발행 처리
    await redisClient.LSET("waiting", myTicketIndex, `${ticketUUID}:issued`);
  } else {
    // healthCheck 시간 기록
    await redisClient.LSET(
      "waiting",
      myTicketIndex,
      `${ticketUUID}:${new Date().getTime()}`
    );
  }

  // Redis를 사용하지 않고 Database를 이용해서 구축할 경우 {
  // const promisePool = pool.promise();

  // const totalWaitingResult = await promisePool.execute(
  //   "SELECT COUNT(*) AS total_waiting FROM waiting WHERE ticket_status <> 9",
  //   [ticketId]
  // );
  // const totalWaiting = totalWaitingResult[0][0]["total_waiting"];

  // const myTicketCreatedDateResult = await promisePool.execute(
  //   "SELECT created_date FROM waiting WHERE ticket_uuid = UUID_TO_BIN(?)",
  //   [ticketId]
  // );
  // const myTicketCreatedDate = myTicketCreatedDateResult[0][0]["created_date"];

  // const myWaitingNumberResult = await promisePool.execute(
  //   "SELECT COUNT(*) AS my_waiting_number FROM waiting WHERE ticket_status <> 9 AND created_date <= ? AND ticket_uuid <> UUID_TO_BIN(?)",
  //   [myTicketCreatedDate, ticketId]
  // );
  // const myWaitingNumber = myWaitingNumberResult[0][0]["my_waiting_number"];
  // }

  return NextResponse.json({
    result: true,
    data: {
      total_waiting: totalWaiting.length,
      my_waiting_number: myWaitingNumber,
      access_token: accessToken,
    },
  });
}
