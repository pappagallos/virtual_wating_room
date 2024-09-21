import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { createClient } from "redis";

const path = process.env.PWD.replace("scheduler", ".env");
dotenv.config({ path });

export const redisClient = await createClient()
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export async function updateMetadata() {
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
      if (keys.length <= 0) {
        console.log("Insert할 Metadata가 없습니다.");
        return;
      }

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
    console.log("Metadata INSERT 완료");
  }
}
