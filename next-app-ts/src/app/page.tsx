import Image from "next/image";
import styles from "./page.module.css";
import MassaWeb3Test from "./Web3Test";

export default function Home() {
  return (
    <main className={styles.main}>
      <MassaWeb3Test />
    </main>
  );
}
