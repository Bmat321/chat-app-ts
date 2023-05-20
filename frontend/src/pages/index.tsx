import Head from "next/head";
import Image from "next/image";
import { getSession, signIn, signOut, useSession } from "next-auth/react";
import { NextPageContext } from "next";
import { Box } from "@chakra-ui/react";
import Chat from "../components/chat/Chat";
import Auth from "../components/auth/Auth";
import { Session } from "next-auth";

export default function Home() {
  const { data: session } = useSession();
  // console.log("Session", session);

  const reLoadSession = () => {
    const event = new Event("visibilitychange");
    document.dispatchEvent(event);
  };

  return (
    <Box>
      {session?.user.username ? (
        <Chat session={session} />
      ) : (
        <Auth session={session} reLoadSession={reLoadSession} />
      )}
    </Box>
  );
}

export async function getServerSideProps(context: NextPageContext) {
  const session = await getSession(context);

  return {
    props: {
      session,
    },
  };
}
