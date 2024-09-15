import React from "react";

// Style
import styles from "./client.module.css";

export default function ClientLayout({ children }) {
  return <div className={styles.container}>{children}</div>;
}
