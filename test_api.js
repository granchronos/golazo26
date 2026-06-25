async function run() {
  console.log("Fetching live scores...");
  const res = await fetch("http://localhost:3000/api/live-scores?live=true");
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
