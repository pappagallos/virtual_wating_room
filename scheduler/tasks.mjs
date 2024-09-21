import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { createClient } from "redis";

const path = process.env.PWD.replace("scheduler", ".env");
dotenv.config({ path });

export const redisClient = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

/**
 * Redis에 발행된 Waiting ticket을 데이터베이스에 INSERT하는 함수
 * @returns
 */
export async function insertTicket() {
  // MySQL Connector 생성
  const mysqlConnection = await mysql.createConnection({
    host: process.env.NEXT_PUBLIC_DB_HOST,
    user: process.env.NEXT_PUBLIC_DB_USER,
    password: process.env.NEXT_PUBLIC_DB_PASSWORD,
    database: process.env.NEXT_PUBLIC_DB_DATABASE,
  });

  try {
    // Redis에 담긴 Metadata를 데이터베이스에 Insert
    const cursorStore = {
      currentCursor: 0,
      previousCursor: 0,
    };

    let bulkData = [];
    let bulkKeys = [];
    do {
      const { cursor, keys } = await redisClient.SCAN(
        cursorStore.currentCursor,
        {
          MATCH: "metadata:*",
        }
      );
      if (keys.length <= 0) return;

      cursorStore.previousCursor = cursorStore.currentCursor;
      cursorStore.currentCursor = cursor;

      // [방법 1] For 사용, 방법 2와는 달리 data 라는 변수가 별도로 생성되지 않아 메모리가 낭비되지 않음
      for (let i = 0, length = keys.length; i < length; ++i) {
        const redisKey = keys[i];
        const metadata = await redisClient.GET(redisKey);
        const [_, ticketUUID] = redisKey.split(":");
        bulkData.push(
          `(UUID_TO_BIN('${ticketUUID}')
          , '${JSON.parse(metadata).ip}'
          , '${metadata}')`
        );
        bulkKeys.push(redisKey);
      }

      // [방법 2] Map 사용
      // const data = keys.map(async (key) => {
      //   const metadata = await redisClient.GET(key);
      //   const [ticketUUID, _] = key.split(":");
      //   return bulkData.push(
      //     `(UUID_TO_BIN('${ticketUUID}')
      //   , '${JSON.parse(metadata).ip}'
      //   , '${metadata}')`
      //   );
      // });
      // bulkData.concat(data);
    } while (cursorStore.currentCursor !== cursorStore.previousCursor);

    await mysqlConnection.beginTransaction();
    await mysqlConnection.execute(
      `INSERT INTO waiting(ticket_uuid, client_ip, metadata) VALUES 
      ${bulkData.join(",")}`
    );
    await mysqlConnection.commit();

    // 데이터베이스에 Insert된 Redis 데이터 제거
    redisClient.DEL(bulkKeys);
  } catch (error) {
    console.error(error);
  } finally {
    // destroy 하지 않으면 "SHOW STATUS LIKE 'Threads_connected';" 질의 시 Connection이 누적되어 접속 마비 유발
    if (mysqlConnection) mysqlConnection.destroy();
    console.log("insertWaitingTicket 완료");
  }
}

export async function deleteCanceledTicket(pingFrequency = 60) {
  const frequency = pingFrequency * 1000;

  // MySQL Connector 생성
  const mysqlConnection = await mysql.createConnection({
    host: process.env.NEXT_PUBLIC_DB_HOST,
    user: process.env.NEXT_PUBLIC_DB_USER,
    password: process.env.NEXT_PUBLIC_DB_PASSWORD,
    database: process.env.NEXT_PUBLIC_DB_DATABASE,
  });

  try {
    const deleteTickets = [];
    const currentTime = new Date().getTime();
    const waitingTickets = await redisClient.LRANGE("waiting", 0, -1);
    if (waitingTickets.length <= 0) return;

    for (let i = 0, length = waitingTickets.length; i < length; ++i) {
      const redisKey = waitingTickets[i];
      const [_, ticketTime] = redisKey.split(":");
      // 만약 healthCheck 시간이 현재 시간보다 frequency 이상이면 사용하지 않는 waitingTicket으로 간주하고 삭제 처리
      if (currentTime - ticketTime >= frequency) deleteTickets.push(redisKey);
    }

    if (deleteTickets.length > 0) {
      await mysqlConnection.beginTransaction();
      await mysqlConnection.execute(
        `UPDATE waiting 
      SET deleted_date = NOW(6) 
      WHERE ticket_uuid IN (
      ${deleteTickets
        .map((ticket) => `UUID_TO_BIN('${ticket.split(":")[0]}')`)
        .join(",")})`
      );
      await mysqlConnection.commit();

      // 데이터베이스에 Delete 처리된 deleteTickets을 Redis에서도 데이터 제거하여 대기열 줄이기
      for (let i = 0, length = deleteTickets.length; i < length; ++i) {
        // 2번째 count 인자를 0으로 하면 모든 값에서 deleteTickets[i]를 삭제하라는 의미
        redisClient.LREM("waiting", 0, deleteTickets[i]);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    if (mysqlConnection) mysqlConnection.destroy();
    console.log("healthCheck 완료");
  }
}
