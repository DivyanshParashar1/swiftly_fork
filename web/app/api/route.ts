export async function GET() {

  const time = new Date().toISOString()

  console.log("Cron ran at:", time)

  await fetch("https://api.swiftly.nakshjoshi.in/health")

  return Response.json({time})
}