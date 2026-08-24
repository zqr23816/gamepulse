export async function GET() {
  return Response.json({ status: 'ok', service: 'gamepulse-api', version: '1.0.0' });
}

