export async function getIsDelivered(messageId: string): Promise<boolean | null> {
  const graphqlEndpoint = "https://api.hyperlane.xyz/v1/graphql";
  let formattedMessageId = messageId;
  if (messageId.startsWith("0x")) {
    formattedMessageId = `\\\\x${messageId.substring(2)}`;
    console.log("Formatted message ID :", formattedMessageId);
  }

  const query = `query MyQuery { message_view(limit: 1, where: {msg_id: {_eq: "${formattedMessageId}"}}) { is_delivered } }`;

  try {
    const response = await fetch(graphqlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const raw = await response.text();

    if (!response.ok) return null;

    const data = JSON.parse(raw);
    const view = data?.data?.message_view;
    if (view && view.length > 0) {
      return view[0].is_delivered;
    }
    return null;
  } catch {
    return null;
  }
}

export async function waitForIsDelivered(
  messageId: string,
  intervalMs: number = 5000,
  maxAttempts: number = 50
): Promise<boolean> {
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt++;
    const delivered = await getIsDelivered(messageId);
    console.debug(`attempt #${attempt}`);
    if (delivered === true) {
      console.info(`[waitForIsDelivered] message ${messageId} was delivered after ${attempt} attempts.`);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  console.warn(`[waitForIsDelivered] Message ${messageId} was not delivered after ${maxAttempts} attempts.`);
  return false;
}