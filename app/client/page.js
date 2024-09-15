import React from "react";
import Image from "next/image";

// 컴포넌트
import WaitingProgress from "./components/WaitingProgress";

// 이미지
import AirPremiaLogo from "../../public/assets/airpremia_logo.svg";

// 스타일
import styles from "./client.module.css";

export default async function page() {
  const assignWaitingTicket = async () => {
    const resposne = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL_PREFIX}/assign`,
      { method: "POST" }
    );
    return await resposne.json();
  };

  const myWaitingTicket = await assignWaitingTicket();

  return (
    <div className={styles.virtual_waiting_room}>
      <div className={styles.room}>
        <Image
          src={AirPremiaLogo}
          alt="에어프레미아 로고"
          className={styles.logo}
        />
        <video
          src="/assets/airpremia_video.mp4"
          type="video/mp4"
          muted
          autoPlay
          loop
        ></video>
      </div>
      <WaitingProgress myWaitingTicket={myWaitingTicket} />
      <div className={styles.copyright}>
        <p>©2024 Air Premia, Inc. All rights reserved.</p>
      </div>
    </div>
  );
}
