"use client";

import React, { useEffect, useState } from "react";

// Style
import styles from "../client.module.css";

export default function WaitingProgress({ myWaitingTicket }) {
  const [waiting, setWaiting] = useState({
    totalWaiting: 0,
    myWaitingNumber: 0,
  });

  return (
    <div className={styles.waiting_info}>
      <h3>에어프레미아 항공권 예약 대기열</h3>
      <div className={styles.progress_bar}>
        <div className={styles.progress}>
          <span>1%</span>
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
