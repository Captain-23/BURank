const USER_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
  }
  recentAcSubmissionList(username: $username, limit: 20) {
    titleSlug
    timestamp
  }
}
`;

async function test() {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
    },
    body: JSON.stringify({
      query: USER_QUERY,
      variables: { username: "neal_wu" },
    }),
  });
  console.log(await res.json());
}
test();
