async function run() {
  console.log("Fetching cron sync...");
  const res = await fetch("http://localhost:3000/api/cron/sync?secret=super_secret_cron_pass_2026");
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
