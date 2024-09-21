import fs from "fs";

import { redisClient } from "@/app/lib/redis";
import { NextResponse } from "next/server";

import jwt from "jsonwebtoken";

import { pool } from "@/app/lib/database";

const privateKey = fs.readFileSync(`${process.env.PWD}/certs/private.pem`);

async function issueAccessToken(myWaitingNumber, ticketId) {
  if (myWaitingNumber > 0) return null;

  const redisKey = `metadata:${ticketId}`;
  const existsTicket = await redisClient.exists(redisKey);
  if (existsTicket) {
    const metaData = await redisClient.get(redisKey);
    return jwt.sign({ meta_data: metaData }, privateKey, {
      algorithm: "RS512",
      expiresIn: "1h",
    });
  }
}

async function getMetaDataFromDB(ticketId) {
  const promisePool = pool.promise();

  // await promisePool.execute("SELECT ")
}

export async function GET(_, { params }) {
  const ticketId = params.ticket_id;
  if (!ticketId)
    NextResponse.json({ result: false, message: "비정상적인 호출입니다." });

  const totalWaiting = await redisClient.LRANGE("waiting", 0, -1);
  const myTicketIndex = totalWaiting.findIndex(
    (ticket) => ticket.split(":")[0] === ticketId
  );
  const myWaitingNumber = totalWaiting.length - (myTicketIndex + 1);

  await redisClient.LSET(
    "waiting",
    myTicketIndex,
    `${ticketId}:${new Date().getTime()}`
  );
  const accessToken = await issueAccessToken(myWaitingNumber, ticketId);

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
