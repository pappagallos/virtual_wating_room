"use client";

import React, { useEffect, useRef, useState } from "react";
import platform from "platform";

// Style
import styles from "../client.module.css";

export default function WaitingProgress({ myWaitingTicket }) {
  const intervalRef = useRef(null);
  const myWaitingNumberRef = useRef(null);

  const [waiting, setWaiting] = useState({
    totalWaiting: null,
    myWaitingNumber: null,
  });
  const processing = Number.parseInt(
    100 - 100 * safeDivide(waiting.myWaitingNumber, myWaitingNumberRef.current),
    10
  );

  function safeDivide(a, b) {
    if (a === 0 && b === 0) return 0;
    return a / b;
  }

  async function updateClientMetaData() {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL_PREFIX}/assign/${myWaitingTicket.data}`,
      { method: "PUT", body: JSON.stringify({ meta_data: platform }) }
    );
  }

  async function fetchWaitingStatus() {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL_PREFIX}/queue/${myWaitingTicket.data}`,
      { method: "GET" }
    );
    const { data } = await response.json();

    if (!myWaitingNumberRef.current)
      myWaitingNumberRef.current = data.my_waiting_number;

    setWaiting((prevState) => ({
      ...prevState,
      totalWaiting: data.total_waiting,
      myWaitingNumber: data.my_waiting_number,
    }));
  }

  useEffect(() => {
    updateClientMetaData();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(fetchWaitingStatus, 5000);
  }, []);

  if (!intervalRef.current) {
    return (
      <div className={styles.pending}>
        <p>
          잠시만 기다려주세요.
          <br />
          대기열에 입장하고 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.waiting_info}>
      <h3>에어프레미아 항공권 예약 대기열</h3>
      <div className={styles.progress_bar}>
        <div className={styles.progress} style={{ width: `${processing}%` }}>
          <span>{processing}%</span>
        </div>
      </div>
      <div className={styles.waiting_number}>
        <div className={styles.row}>
          <span className={styles.title}>전체 대기자 수</span>
          <span className={styles.number}>{waiting.totalWaiting}명</span>
        </div>
        <div className={styles.row}>
          <span className={styles.title}>내 앞의 대기자 수</span>
          <span className={styles.number}>
            <b>{waiting.myWaitingNumber}명</b>
          </span>
        </div>
      </div>
      {waiting.myWaitingNumber > 0 && (
        <button className={styles.secondary}>대기 취소</button>
      )}
      {waiting.myWaitingNumber === 0 && (
        <button className={styles.primary}>입장</button>
      )}
    </div>
  );
}
