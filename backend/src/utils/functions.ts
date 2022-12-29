import { ParticipantPopulated } from "./types";
export function userIsConversationParticipant(
  particpants: Array<ParticipantPopulated>,
  userId: string
): boolean {
  return !!particpants.find((particpant) => particpant.userId === userId);
}
